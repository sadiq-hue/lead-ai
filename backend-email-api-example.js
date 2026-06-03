/**
 * Example Backend API for Sending Payment Request Emails
 * 
 * This is a reference implementation showing how to set up a backend
 * email service to handle payment request emails.
 * 
 * You can use this with:
 * - Express.js (shown here)
 * - Firebase Cloud Functions
 * - AWS Lambda
 * - Or adapt to your own backend
 */

// ============================================
// OPTION 1: Node.js + Express + SendGrid
// ============================================

const express = require('express');
const sgMail = require('@sendgrid/mail');
const app = express();

// Setup
app.use(express.json());
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Email sending endpoint
app.post('/api/send-payment-email', async (req, res) => {
  try {
    const { to, subject, html, text, customerName } = req.body;

    // Validate input
    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Send email via SendGrid
    const message = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'billing@leadflow.ai',
      subject,
      html,
      text,
      replyTo: 'support@leadflow.ai'
    };

    await sgMail.send(message);

    console.log(`Payment email sent to ${to}`);
    res.json({
      success: true,
      messageId: `msg_${Date.now()}`,
      recipient: to
    });

  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({
      error: 'Failed to send email',
      message: error.message
    });
  }
});

// ============================================
// OPTION 2: Node.js + Express + Nodemailer
// ============================================

/*
const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD // Use app password, not account password
  }
});

app.post('/api/send-payment-email', async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
      text
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`Payment email sent: ${info.response}`);
    res.json({
      success: true,
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({
      error: 'Failed to send email',
      message: error.message
    });
  }
});
*/

// ============================================
// OPTION 3: Firebase Cloud Function
// ============================================

/*
const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.password
  }
});

exports.sendPaymentEmail = functions.https.onCall(async (data, context) => {
  const { to, subject, html, text } = data;

  // Validate authentication (optional)
  // if (!context.auth) {
  //   throw new functions.https.HttpsError(
  //     'unauthenticated',
  //     'User must be authenticated'
  //   );
  // }

  try {
    const mailOptions = {
      from: 'billing@leadflow.ai',
      to,
      subject,
      html,
      text
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
*/

// ============================================
// SETUP INSTRUCTIONS
// ============================================

/*

FOR SENDGRID (Recommended):

1. Create SendGrid Account:
   - Go to https://sendgrid.com/
   - Sign up for a free account
   - Verify your sender email

2. Create API Key:
   - Settings → API Keys
   - Create a new API key
   - Copy and save securely

3. Set Environment Variables:
   SENDGRID_API_KEY=your_api_key_here
   SENDGRID_FROM_EMAIL=billing@leadflow.ai

4. Install Package:
   npm install @sendgrid/mail

5. Start Server:
   node server.js

6. Test Endpoint:
   curl -X POST http://localhost:3000/api/send-payment-email \
     -H "Content-Type: application/json" \
     -d '{
       "to": "test@example.com",
       "subject": "Payment Request",
       "html": "<h1>Payment Due</h1>",
       "text": "Payment Due"
     }'


FOR NODEMAILER + GMAIL:

1. Enable 2-Factor Authentication on Google Account

2. Create App Password:
   - https://myaccount.google.com/apppasswords
   - Select Mail and Windows Device
   - Copy the generated password

3. Set Environment Variables:
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password

4. Install Package:
   npm install nodemailer


FOR FIREBASE CLOUD FUNCTIONS:

1. Initialize Firebase:
   firebase init functions

2. Configure Email Settings:
   firebase functions:config:set email.user="your@gmail.com" email.password="app-password"

3. Deploy Function:
   firebase deploy --only functions

4. Update Frontend to Call Cloud Function Instead of HTTP API

*/

// Start server (for local development)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Email API server running on port ${PORT}`);
});

module.exports = app;
