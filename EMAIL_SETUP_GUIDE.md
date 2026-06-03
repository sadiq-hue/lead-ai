# Email Sending Setup Guide

The payment request feature now supports real email sending. You have two options for implementation:

## Option 1: Backend API (Recommended)

This is the most professional approach and works with any email service provider.

### Steps:

1. **Create a backend API endpoint** that receives email requests and sends them using your preferred service.

2. **Supported services:**
   - SendGrid
   - Mailgun
   - AWS SES
   - Firebase Cloud Functions
   - Your own backend (Node.js, Python, etc.)

3. **Backend endpoint should:**
   - Accept POST requests at `/api/send-payment-email`
   - Receive JSON payload with email details
   - Send the email
   - Return success/error response

4. **Example Node.js + SendGrid backend:**

```javascript
// backend/routes/email.js
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.post('/api/send-payment-email', async (req, res) => {
  const { to, subject, html, text } = req.body;

  try {
    await sgMail.send({
      to,
      from: 'billing@leadflow.ai',
      subject,
      html,
      text
    });
    res.json({ success: true, messageId: `msg_${Date.now()}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

5. **Leave default configuration** in `Payments.tsx`:
   - The system will automatically fallback to EmailJS if the backend API is unavailable

---

## Option 2: EmailJS (Client-side)

This works without a backend but has limitations for production use.

### Setup Instructions:

1. **Create EmailJS Account:**
   - Go to [https://www.emailjs.com/](https://www.emailjs.com/)
   - Sign up for a free account
   - Click "Create a service"

2. **Add Email Service:**
   - Choose your email provider (Gmail, Outlook, etc.)
   - Follow the authentication steps

3. **Create Email Template:**
   - Go to "Email Templates"
   - Create a new template with these variables:
     - `{to_email}` - Recipient email
     - `{to_name}` - Recipient name
     - `{subject}` - Email subject
     - `{message_html}` - HTML content
     - `{message_text}` - Plain text content
     - `{amount}` - Payment amount
     - `{payment_method}` - Payment method
     - `{due_date}` - Due date
     - `{company}` - Company name
     - `{description}` - Description

4. **Get Your Credentials:**
   - Service ID: Dashboard → "Services" → Copy Service ID
   - Template ID: Dashboard → "Email Templates" → Copy Template ID
   - Public Key: Dashboard → "Account" → "API Keys" → Copy Public Key

5. **Update Payments.tsx:**
   
   Open `src/app/components/pages/Payments.tsx` and update these constants at the top:

   ```typescript
   const EMAILJS_SERVICE_ID = "service_xxxxxxxx"; // Replace with your Service ID
   const EMAILJS_TEMPLATE_ID = "template_xxxxxxxx"; // Replace with your Template ID
   const EMAILJS_PUBLIC_KEY = "xxxxxxxxxxxxxxxxxxxxxxxx"; // Replace with your Public Key
   ```

6. **Test Your Setup:**
   - Fill out the payment request form
   - Click "Send Request"
   - Check the recipient's email inbox

---

## Option 3: Firebase Cloud Functions

If you're already using Firebase:

1. **Create a Cloud Function:**

```javascript
// functions/index.js
const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

exports.sendPaymentEmail = functions.https.onCall(async (data, context) => {
  const { to, subject, html, text } = data;

  try {
    await transporter.sendMail({
      from: 'billing@leadflow.ai',
      to,
      subject,
      html,
      text
    });
    
    return { success: true };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
```

2. **Update Payments.tsx** to call the Cloud Function instead of the backend API.

---

## Troubleshooting

### Emails not sending?

1. **Check console for errors:** Open DevTools → Console tab
2. **Verify credentials:** Make sure EMAILJS_* constants are correctly set
3. **Check spam folder:** Sometimes emails end up in spam
4. **Test email format:** Use a valid email address for testing

### EmailJS Setup Issues:

- Email template variables not matching? Check EmailJS dashboard for exact variable names
- Authentication failed? Verify Service ID and Public Key are correct
- Rate limits? EmailJS free tier has limits, consider upgrading

### Backend API Issues:

- CORS errors? Add proper CORS headers to your backend
- Timeout? Increase fetch timeout or check if backend is running
- 404 errors? Verify the API endpoint path is correct

---

## Security Best Practices

⚠️ **Important:**

- **Don't hardcode credentials in frontend** - This is a security risk
- Use environment variables instead:
  ```javascript
  const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  ```

- **Preferred approach:** Use backend API to handle all email logic
- **Rate limiting:** Implement rate limiting to prevent spam
- **Validation:** Always validate email addresses on backend

---

## Testing Email Sending

1. **Test with dummy email:**
   ```
   Name: John Doe
   Email: test@example.com
   Amount: $100
   ```

2. **Check email was sent:**
   - Look for email in recipient's inbox
   - Check spam/junk folder
   - Look for delivery logs in your email service dashboard

3. **Debug:** Open browser DevTools Console to see logs and error messages

---

## Next Steps

1. Choose your email service (Backend API recommended)
2. Follow the setup instructions for your chosen option
3. Update the configuration in Payments.tsx
4. Test by sending a payment request
5. Monitor the browser console for any issues

Need help? Check:
- EmailJS documentation: https://www.emailjs.com/docs/
- Your email service provider's documentation
- Browser console for detailed error messages
