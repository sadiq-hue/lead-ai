import dotenv from 'dotenv';
dotenv.config();

const provider = process.env.WHATSAPP_PROVIDER || 'log';

let twilioClient = null;
try {
  const twilio = (await import('twilio')).default;
  if (provider === 'twilio') {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    console.log('Twilio client initialized');
  }
} catch (err) {
  console.log('Twilio not available, using log/meta provider');
}

export async function sendWhatsAppMessage(to, body) {
  if (provider === 'twilio' && twilioClient) {
    try {
      const from = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
      const msg = await twilioClient.messages.create({
        from,
        body,
        to: `whatsapp:${to}`,
      });
      console.log(`Twilio sent to ${to}: ${msg.sid}`);
      return { provider: 'twilio', sid: msg.sid, status: msg.status };
    } catch (err) {
      console.error('Twilio send error:', err.message);
      return { provider: 'twilio', error: err.message };
    }
  }

  if (provider === 'meta') {
    const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;
    if (phoneNumberId && accessToken) {
      try {
        const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body },
          }),
        });
        const data = await response.json();
        console.log(`Meta sent to ${to}:`, data?.messages?.[0]?.id || 'ok');
        return { provider: 'meta', data };
      } catch (err) {
        console.error('Meta send error:', err.message);
        return { provider: 'meta', error: err.message };
      }
    }
  }

  console.log(`[LOG] WhatsApp to ${to}: ${body}`);
  return { provider: 'log', to, body };
}

export async function parseTwilioWebhook(body) {
  const numMedia = parseInt(body.NumMedia || '0', 10);
  const message = numMedia > 0 ? '[Media message]' : (body.Body || '');
  return {
    from: body.From?.replace('whatsapp:', '') || body.From || '',
    message,
    messageId: body.MessageSid || '',
    timestamp: new Date().toISOString(),
  };
}

export async function parseMetaWebhook(entry) {
  const messages = [];
  for (const change of entry.changes || []) {
    if (change.field !== 'messages') continue;
    for (const msg of change.value?.messages || []) {
      messages.push({
        from: msg.from,
        message: msg.text?.body || msg.caption || '',
        messageId: msg.id,
        timestamp: msg.timestamp ? new Date(Number(msg.timestamp) * 1000).toISOString() : new Date().toISOString(),
      });
    }
  }
  return messages;
}
