import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import { body, validationResult } from 'express-validator';

// Email provider initialization
const emailProvider = process.env.EMAIL_PROVIDER || 'sendgrid';

// Initialize SendGrid
if (emailProvider === 'sendgrid' && process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Initialize Nodemailer for Gmail/SMTP
let nodemailerTransport = null;
if (emailProvider === 'smtp' && process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
  nodemailerTransport = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE || 'gmail',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD
    }
  });
}

// Validation middleware
const validateEmailRequest = [
  body('to')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid recipient email address'),
  body('subject')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Subject must be between 1 and 200 characters'),
  body('html')
    .trim()
    .isLength({ min: 1 })
    .withMessage('HTML content is required'),
  body('text')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Text content is required'),
  body('customerName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Customer name must be between 1 and 100 characters')
];

// Send email via SendGrid
const sendViaSendGrid = async (mailOptions) => {
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error('SendGrid API key not configured');
  }

  const message = {
    to: mailOptions.to,
    from: process.env.SENDGRID_FROM_EMAIL || 'billing@leadflow.ai',
    subject: mailOptions.subject,
    html: mailOptions.html,
    text: mailOptions.text,
    replyTo: process.env.SENDGRID_REPLY_TO || 'support@leadflow.ai'
  };

  const result = await sgMail.send(message);
  return {
    success: true,
    provider: 'SendGrid',
    messageId: result[0].headers['x-message-id'] || `msg_${Date.now()}`,
    recipient: mailOptions.to
  };
};

// Send email via SMTP (Gmail, Outlook, custom SMTP)
const sendViaSMTP = async (mailOptions) => {
  if (!nodemailerTransport) {
    throw new Error('SMTP credentials not configured');
  }

  const mailConfig = {
    from: process.env.SMTP_EMAIL,
    to: mailOptions.to,
    subject: mailOptions.subject,
    html: mailOptions.html,
    text: mailOptions.text,
    replyTo: process.env.SMTP_REPLY_TO || 'support@leadflow.ai'
  };

  const info = await nodemailerTransport.sendMail(mailConfig);
  return {
    success: true,
    provider: 'SMTP',
    messageId: info.messageId,
    recipient: mailOptions.to
  };
};

// Main email sending route handler
export const sendPaymentEmailRoute = [
  ...validateEmailRequest,
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { to, subject, html, text, customerName } = req.body;

      console.log(`[${new Date().toISOString()}] Sending payment email to ${to}`);
      console.log(`Customer: ${customerName}, Provider: ${emailProvider}`);

      let result;

      // Route to appropriate email provider
      if (emailProvider === 'sendgrid') {
        result = await sendViaSendGrid({ to, subject, html, text });
      } else if (emailProvider === 'smtp') {
        result = await sendViaSMTP({ to, subject, html, text });
      } else {
        throw new Error(`Unknown email provider: ${emailProvider}`);
      }

      console.log(`✓ Email sent successfully:`, result);

      res.status(200).json({
        success: true,
        message: 'Payment request email sent successfully',
        ...result
      });

    } catch (error) {
      console.error('Email sending error:', error);

      const statusCode = error.message.includes('not found') || 
                        error.message.includes('not configured') ? 400 : 500;

      res.status(statusCode).json({
        error: 'Failed to send email',
        message: error.message,
        provider: emailProvider,
        ...(process.env.NODE_ENV === 'development' && {
          stack: error.stack,
          suggestions: [
            'Check EMAIL_PROVIDER environment variable',
            'Verify email service credentials (SENDGRID_API_KEY or SMTP_EMAIL)',
            'Ensure recipient email is valid'
          ]
        })
      });
    }
  }
];

// Health check for email service
export const emailHealthCheck = async (req, res) => {
  try {
    const status = {
      emailProvider,
      sendGridConfigured: !!process.env.SENDGRID_API_KEY,
      smtpConfigured: !!process.env.SMTP_EMAIL && !!process.env.SMTP_PASSWORD,
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
    };

    res.json({
      status: 'Email service health check',
      ...status
    });
  } catch (error) {
    res.status(500).json({
      error: 'Email health check failed',
      message: error.message
    });
  }
};
