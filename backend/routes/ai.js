import express from 'express';
import { query } from '../db/index.js';
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

router.post('/respond', async (req, res, next) => {
  try {
    const { lead_id, business_id, user_message } = req.body;
    if (!lead_id || !business_id || !user_message) {
      return res.status(400).json({ error: 'lead_id, business_id, and user_message are required' });
    }

    const leadData = await query('SELECT * FROM leads WHERE id = $1', [lead_id]);
    if (!leadData.rows.length) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    const lead = leadData.rows[0];

    const businessData = await query('SELECT * FROM businesses WHERE id = $1', [business_id]);
    if (!businessData.rows.length) {
      return res.status(404).json({ error: 'Business not found' });
    }
    const business = businessData.rows[0];

    const recentMsgs = await query(
      `SELECT content, direction FROM conversations WHERE lead_id = $1 ORDER BY sent_at DESC LIMIT 5`,
      [lead_id]
    );
    const history = recentMsgs.rows.reverse();

    const now = new Date().toISOString();

    // Persist the user's inbound message
    await query(
      `INSERT INTO conversations (lead_id, business_id, channel, direction, content, sent_at, created_at)
       VALUES ($1, $2, 'whatsapp', 'inbound', $3, $4, $4)`,
      [lead_id, business_id, user_message, now]
    );

    const context = lead.metadata || {};
    const knowledge = await getRelevantKnowledge(business, user_message);
    const result = await generateResponse(user_message, business, lead, history, context, knowledge);
    const newScore = Math.min(Math.max(lead.score + (result.scoreDelta || 0), 0), 100);
    const newStatus = result.statusUpdate || lead.status;
    const escalated = result.escalate || false;
    const actionRequired = result.actionRequired || null;
    const notifyAdmin = result.notifyAdmin || null;
    const updatedMetadata = { ...lead.metadata, ...result.contextUpdates };

    let aiConv;
    if (escalated) {
      aiConv = await query(
        `INSERT INTO conversations (lead_id, business_id, channel, direction, content, auto_sent, escalated, ai_confidence_tier, sent_at, created_at)
         VALUES ($1, $2, 'whatsapp', 'outbound', $3, TRUE, TRUE, 'low', $4, $4) RETURNING *`,
        [lead_id, business_id, result.text, now]
      );
      await query(
        `INSERT INTO notifications (business_id, type, channel, title, body, ref_id, ref_type, sent_at)
         VALUES ($1, 'escalation', 'in_app', 'Human intervention needed', $2, $3, 'lead', $4)`,
        [business_id, `Lead ${lead.name || lead.phone_number} has requested human assistance`, lead_id, now]
      );
    } else if (actionRequired === 'meeting_link' || notifyAdmin === 'meeting_link_sent') {
      aiConv = await query(
        `INSERT INTO conversations (lead_id, business_id, channel, direction, content, auto_sent, ai_confidence_tier, sent_at, created_at)
         VALUES ($1, $2, 'whatsapp', 'outbound', $3, TRUE, 'high', $4, $4) RETURNING *`,
        [lead_id, business_id, result.text, now]
      );
      const notifType = notifyAdmin === 'meeting_link_sent' ? 'meeting_link_sent' : 'meeting_link_request';
      const notifTitle = notifyAdmin === 'meeting_link_sent' ? 'Meeting link sent' : 'Meeting link requested';
      const notifBody = notifyAdmin === 'meeting_link_sent'
        ? `Meeting link was sent to ${lead.name || lead.phone_number}`
        : `Lead ${lead.name || lead.phone_number} has booked and is requesting the meeting link`;
      await query(
        `INSERT INTO notifications (business_id, type, channel, title, body, ref_id, ref_type, sent_at)
         VALUES ($1, $2, 'in_app', $3, $4, $5, 'lead', $6)`,
        [business_id, notifType, notifTitle, notifBody, lead_id, now]
      );
    } else {
      aiConv = await query(
        `INSERT INTO conversations (lead_id, business_id, channel, direction, content, auto_sent, ai_confidence_tier, sent_at, created_at)
         VALUES ($1, $2, 'whatsapp', 'outbound', $3, TRUE, 'high', $4, $4) RETURNING *`,
        [lead_id, business_id, result.text, now]
      );
    }

    await query('UPDATE leads SET score = $1, status = $2, metadata = $3, last_activity_at = $4, updated_at = $4 WHERE id = $5',
      [newScore, newStatus, JSON.stringify(updatedMetadata), now, lead_id]);

    const updatedLead = await query('SELECT * FROM leads WHERE id = $1', [lead_id]);

    res.json({
      ai_response: result.text,
      conversation: aiConv.rows[0],
      lead: updatedLead.rows[0],
      escalated,
      actionRequired,
      notifyAdmin,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
