import express from 'express';
import { query } from '../db/index.js';
import { sendWhatsAppMessage, parseTwilioWebhook, parseMetaWebhook } from '../services/whatsapp-provider.js';
import { generateResponse } from '../services/ai-engine.js';

async function getRelevantKnowledge(business, message, maxResults = 3) {
  try {
    if (!business?.id) return [];
    const words = message.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    if (!words.length) return [];
    // Only match against keywords array and title — avoid false positives from content ILIKE on large docs
    const likeExprs = words.map((_, i) => `($${i + 2} = ANY(keywords) OR title ILIKE $${i + 2})`).join(' OR ');
    const result = await query(
      `SELECT DISTINCT ON (title) title, content, category, keywords
       FROM business_knowledge
       WHERE business_id = $1 AND is_active = TRUE AND (${likeExprs})
       LIMIT $${words.length + 2}`,
      [business.id, ...words.map(w => `%${w}%`), maxResults]
    );
    return result.rows;
  } catch (err) {
    console.error('Knowledge query error:', err.message);
    return [];
  }
}

const router = express.Router();
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'leadai_verify_2026';

// Meta Cloud API webhook verification
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
    console.log('Meta webhook verified');
    return res.status(200).send(challenge);
  }
  res.status(403).json({ error: 'Verification failed' });
});

// Meta Cloud API incoming webhook (real WhatsApp messages)
router.post('/webhook', async (req, res) => {
  try {
    const body = req.body;
    if (!body?.entry) return res.sendStatus(200);
    for (const entry of body.entry) {
      const messages = await parseMetaWebhook({ changes: entry.changes });
      for (const msg of messages) {
        await handleIncomingMessage(msg.from, msg.message, msg.messageId, msg.timestamp);
      }
    }
    res.sendStatus(200);
  } catch (error) {
    console.error('Meta webhook error:', error);
    res.sendStatus(200);
  }
});

// Twilio WhatsApp webhook (incoming messages from Twilio sandbox)
router.post('/twilio-webhook', async (req, res) => {
  try {
    const parsed = await parseTwilioWebhook(req.body);
    if (parsed.message) {
      await handleIncomingMessage(parsed.from, parsed.message, parsed.messageId, parsed.timestamp);
    }
    res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
  } catch (error) {
    console.error('Twilio webhook error:', error);
    res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
  }
});

async function handleIncomingMessage(phoneNumber, text, msgId, timestamp) {
  let lead = await query('SELECT * FROM leads WHERE phone_number = $1 LIMIT 1', [phoneNumber]);
  const businesses = await query('SELECT id FROM businesses LIMIT 1');
  if (!businesses.rows.length) return;
  const businessId = businesses.rows[0].id;

  if (!lead.rows.length) {
    const newLead = await query(
      `INSERT INTO leads (business_id, channel, phone_number, name, status, score, first_contact_at, last_activity_at)
       VALUES ($1, 'whatsapp', $2, $3, 'new', 50, $4, $4) RETURNING *`,
      [businessId, phoneNumber, `Lead ${phoneNumber.slice(-4)}`, timestamp]
    );
    lead = newLead;
  } else {
    await query('UPDATE leads SET last_activity_at = $1, updated_at = $1 WHERE id = $2',
      [timestamp, lead.rows[0].id]);
  }

  await query(
    `INSERT INTO conversations (lead_id, business_id, channel, direction, content, external_msg_id, sent_at, created_at)
     VALUES ($1, $2, 'whatsapp', 'inbound', $3, $4, $5, $5)`,
    [lead.rows[0].id, businessId, text, msgId || null, timestamp]
  );

  await generateAndStoreAIResponse(lead.rows[0].id, businessId, text, timestamp);
}

async function generateAndStoreAIResponse(leadId, businessId, userMessage, timestamp, businessOverride) {
  const leadData = await query('SELECT * FROM leads WHERE id = $1', [leadId]);
  const lead = leadData.rows[0];
  let business;
  if (businessOverride) {
    business = businessOverride;
  } else {
    const businessData = await query('SELECT * FROM businesses WHERE id = $1', [businessId]);
    business = businessData.rows[0];
  }
  const recentMessages = await query(
    `SELECT content, direction FROM conversations WHERE lead_id = $1 ORDER BY sent_at DESC LIMIT 5`, [leadId]);
  const history = recentMessages.rows.reverse();

  const context = lead.metadata || {};
  const knowledge = await getRelevantKnowledge(business, userMessage);
  const result = await generateResponse(userMessage, business, lead, history, context, knowledge);
  const aiResponse = result.text;
  let newLeadScore = Math.min(Math.max(lead.score + (result.scoreDelta || 0), 0), 100);
  let newStatus = result.statusUpdate || lead.status;
  const actionRequired = result.actionRequired || null;
  const notifyAdmin = result.notifyAdmin || null;
  const updatedMetadata = { ...lead.metadata, ...result.contextUpdates };

  if (result.escalate) {
    await query(
      `INSERT INTO conversations (lead_id, business_id, channel, direction, content, auto_sent, escalated, ai_confidence_tier, sent_at, created_at)
       VALUES ($1, $2, 'whatsapp', 'outbound', $3, TRUE, TRUE, 'low', $4, $4)`,
      [leadId, businessId, aiResponse, timestamp]
    );
    await query(
      `INSERT INTO notifications (business_id, type, channel, title, body, ref_id, ref_type, sent_at)
       VALUES ($1, 'escalation', 'in_app', 'Human intervention needed', $2, $3, 'lead', $4)`,
      [businessId, `Lead ${lead.name || lead.phone_number} has requested human assistance`, leadId, timestamp]
    );
  } else if (actionRequired === 'meeting_link' || notifyAdmin === 'meeting_link_sent') {
    await query(
      `INSERT INTO conversations (lead_id, business_id, channel, direction, content, auto_sent, ai_confidence_tier, sent_at, created_at)
       VALUES ($1, $2, 'whatsapp', 'outbound', $3, TRUE, 'high', $4, $4)`,
      [leadId, businessId, aiResponse, timestamp]
    );
    const notifType = notifyAdmin === 'meeting_link_sent' ? 'meeting_link_sent' : 'meeting_link_request';
    const notifTitle = notifyAdmin === 'meeting_link_sent' ? 'Meeting link sent' : 'Meeting link requested';
    const notifBody = notifyAdmin === 'meeting_link_sent'
      ? `Meeting link was sent to ${lead.name || lead.phone_number}`
      : `Lead ${lead.name || lead.phone_number} has booked and is requesting the meeting link`;
    await query(
      `INSERT INTO notifications (business_id, type, channel, title, body, ref_id, ref_type, sent_at)
       VALUES ($1, $2, 'in_app', $3, $4, $5, 'lead', $6)`,
      [businessId, notifType, notifTitle, notifBody, leadId, timestamp]
    );
  } else {
    await query(
      `INSERT INTO conversations (lead_id, business_id, channel, direction, content, auto_sent, ai_confidence_tier, sent_at, created_at)
       VALUES ($1, $2, 'whatsapp', 'outbound', $3, TRUE, 'high', $4, $4)`,
      [leadId, businessId, aiResponse, timestamp]
    );
  }

  await query(
    `UPDATE leads SET score = $1, status = $2, metadata = $3, last_activity_at = $4, updated_at = $4 WHERE id = $5`,
    [newLeadScore, newStatus, JSON.stringify(updatedMetadata), timestamp, leadId]
  );

  if (lead.phone_number) {
    sendWhatsAppMessage(lead.phone_number, aiResponse).catch(e =>
      console.error('Failed to send WhatsApp reply:', e.message)
    );
  }
}

router.post('/simulate', async (req, res, next) => {
  try {
    const { business_id, phone_number, message, name, industry } = req.body;
    if (!phone_number || !message) {
      return res.status(400).json({ error: 'phone_number and message are required' });
    }

    let businessId = business_id;
    if (!businessId) {
      const businesses = await query('SELECT id FROM businesses LIMIT 1');
      if (!businesses.rows.length) {
        return res.status(400).json({ error: 'No businesses found. Create a business first.' });
      }
      businessId = businesses.rows[0].id;
    }

    let businessOverride = null;
    if (industry) {
      const bData = await query('SELECT * FROM businesses WHERE id = $1', [businessId]);
      if (bData.rows.length) {
        businessOverride = { ...bData.rows[0], industry };
      }
    }

    let lead = await query('SELECT * FROM leads WHERE phone_number = $1 LIMIT 1', [phone_number]);
    const now = new Date().toISOString();

    if (!lead.rows.length) {
      const newLead = await query(
        `INSERT INTO leads (business_id, channel, phone_number, name, status, score, first_contact_at, last_activity_at)
         VALUES ($1, 'whatsapp', $2, $3, 'new', 50, $4, $4) RETURNING *`,
        [businessId, phone_number, name || `Lead ${phone_number.slice(-4)}`, now]
      );
      lead = newLead;
    } else {
      await query('UPDATE leads SET last_activity_at = $1, updated_at = $1 WHERE id = $2', [now, lead.rows[0].id]);
    }

    await query(
      `INSERT INTO conversations (lead_id, business_id, channel, direction, content, sent_at, created_at)
       VALUES ($1, $2, 'whatsapp', 'inbound', $3, $4, $4)`,
      [lead.rows[0].id, businessId, message, now]
    );

    await generateAndStoreAIResponse(lead.rows[0].id, businessId, message, now, businessOverride);

    const updatedLead = await query('SELECT * FROM leads WHERE id = $1', [lead.rows[0].id]);
    const conversations = await query(
      'SELECT * FROM conversations WHERE lead_id = $1 ORDER BY sent_at ASC', [lead.rows[0].id]
    );

    res.status(201).json({ lead: updatedLead.rows[0], conversations: conversations.rows });
  } catch (error) {
    next(error);
  }
});

// Human agent sends a direct message to a lead
router.post('/send', async (req, res, next) => {
  try {
    const { lead_id, business_id, message } = req.body;
    if (!lead_id || !business_id || !message) {
      return res.status(400).json({ error: 'lead_id, business_id, and message are required' });
    }
    const now = new Date().toISOString();
    const conv = await query(
      `INSERT INTO conversations (lead_id, business_id, channel, direction, content, sent_at, created_at)
       VALUES ($1, $2, 'whatsapp', 'outbound', $3, $4, $4) RETURNING *`,
      [lead_id, business_id, message, now]
    );
    await query('UPDATE leads SET last_activity_at = $1, updated_at = $1 WHERE id = $2',
      [now, lead_id]);
    const leadData = await query('SELECT * FROM leads WHERE id = $1', [lead_id]);
    if (leadData.rows[0]?.phone_number) {
      sendWhatsAppMessage(leadData.rows[0].phone_number, message).catch(e =>
        console.error('Failed to send WhatsApp reply:', e.message)
      );
    }
    res.status(201).json({ conversation: conv.rows[0], lead: leadData.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.get('/messages', async (req, res, next) => {
  try {
    const { lead_id } = req.query;
    if (!lead_id) return res.status(400).json({ error: 'lead_id is required' });
    const result = await query(
      'SELECT * FROM conversations WHERE lead_id = $1 ORDER BY sent_at ASC', [lead_id]
    );
    res.json({ messages: result.rows, count: result.rows.length });
  } catch (error) {
    next(error);
  }
});

export default router;
