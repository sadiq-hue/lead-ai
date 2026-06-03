# Backend API Production Setup Guide

## Overview

This guide walks you through setting up the LeadFlow AI Backend API for production-grade email sending. The backend supports multiple email providers for flexibility and reliability.

---

## Architecture

```
Frontend (React) → Backend API (Node.js/Express) → Email Provider (SendGrid/SMTP)
   Payments.tsx        server.js                  SendGrid or Gmail/SMTP
```

---

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy the example file and add your credentials:

```bash
cp .env.example .env
```

Edit `.env` and fill in your email service credentials (see options below).

### 3. Start Backend

```bash
npm start
```

You should see:
```
╔════════════════════════════════════════╗
║   LeadFlow AI Backend API Running      ║
╠════════════════════════════════════════╣
║ Port: 3001
║ Environment: development
║ Frontend: http://localhost:5173
║ Email Provider: sendgrid
╚════════════════════════════════════════╝
```

### 4. Configure Frontend

Update your `.env` file in the root directory:

```
VITE_BACKEND_API_URL=http://localhost:3001
```

### 5. Test

Fill out a payment request form and submit. Check your email!

---

## Email Provider Setup

### Option A: SendGrid (Recommended)

**Why SendGrid?**
- Free tier: 100 emails/day
- Reliable and scalable
- 24/7 support
- Best for production

**Setup:**

1. **Create SendGrid Account:**
   - Go to https://sendgrid.com/
   - Click "Sign Up Free"
   - Verify your email

2. **Create API Key:**
   - Login to SendGrid Dashboard
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Name it "LeadFlow AI Backend"
   - Copy the API key (you won't see it again!)

3. **Verify Sender Email:**
   - Go to Sender Authentication
   - Verify your domain or single sender email
   - This is who emails will come from

4. **Update `.env`:**
   ```
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   SENDGRID_FROM_EMAIL=billing@leadflow.ai
   SENDGRID_REPLY_TO=support@leadflow.ai
   ```

5. **Test:**
   ```bash
   npm start
   ```
   Then submit a payment request from the frontend.

---

### Option B: Gmail (SMTP)

**Why Gmail?**
- Free to use
- No sign-ups needed (use your existing account)
- Good for development/testing

**Setup:**

1. **Enable 2-Factor Authentication:**
   - Go to https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Create App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Device"
   - Google will generate a 16-character password
   - Copy this password

3. **Update `.env`:**
   ```
   EMAIL_PROVIDER=smtp
   SMTP_SERVICE=gmail
   SMTP_EMAIL=your-email@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   SMTP_REPLY_TO=support@leadflow.ai
   ```

4. **Test:**
   ```bash
   npm start
   ```

---

### Option C: Custom SMTP Server

For corporate email or other SMTP providers.

**Setup:**

1. **Get SMTP Credentials:**
   - Ask your email provider for:
     - SMTP Server (e.g., smtp.company.com)
     - Port (usually 587 or 465)
     - Username
     - Password

2. **Update `.env`:**
   ```
   EMAIL_PROVIDER=smtp
   SMTP_SERVICE=custom
   SMTP_HOST=smtp.company.com
   SMTP_PORT=587
   SMTP_EMAIL=your-email@company.com
   SMTP_PASSWORD=your-password
   SMTP_REPLY_TO=billing@leadflow.ai
   ```

3. **Restart Backend:**
   ```bash
   npm start
   ```

---

## Development vs Production

### Local Development

```bash
# Terminal 1: Backend
cd backend
npm run dev  # Uses nodemon for auto-reload

# Terminal 2: Frontend
npm run dev
```

### Production Deployment

#### Option 1: Railway.app (Easiest)

1. **Create Railway Account:**
   - Go to https://railway.app/
   - Sign up with GitHub

2. **Deploy Backend:**
   - Connect your GitHub repo
   - Select the `backend` folder
   - Add environment variables
   - Click Deploy

3. **Update Frontend `.env`:**
   ```
   VITE_BACKEND_API_URL=https://your-railway-url.railway.app
   ```

#### Option 2: Heroku

1. **Create Heroku Account:**
   - Go to https://www.heroku.com/
   - Sign up

2. **Install Heroku CLI:**
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku
   
   # Windows
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

3. **Deploy:**
   ```bash
   heroku login
   heroku create your-app-name-backend
   git push heroku main
   ```

4. **Set Environment Variables:**
   ```bash
   heroku config:set SENDGRID_API_KEY=SG.xxxxx
   heroku config:set SENDGRID_FROM_EMAIL=billing@leadflow.ai
   ```

#### Option 3: Docker + Your Own Server

1. **Create `Dockerfile`:**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   EXPOSE 3001
   CMD ["node", "server.js"]
   ```

2. **Build & Run:**
   ```bash
   docker build -t leadai-backend .
   docker run -p 3001:3001 --env-file .env leadai-backend
   ```

---

## API Endpoints

### Send Payment Email

**Endpoint:** `POST /api/send-payment-email`

**Request:**
```json
{
  "to": "customer@example.com",
  "subject": "Payment Request",
  "html": "<h1>Payment Due</h1>...",
  "text": "Payment Due...",
  "customerName": "John Doe",
  "company": "Acme Corp",
  "amount": "1000",
  "paymentMethod": "Bank Transfer",
  "dueDate": "2026-04-20",
  "description": "Monthly invoice"
}
```

**Response - Success:**
```json
{
  "success": true,
  "message": "Payment request email sent successfully",
  "provider": "SendGrid",
  "messageId": "msg_1234567890",
  "recipient": "customer@example.com"
}
```

**Response - Error:**
```json
{
  "error": "Failed to send email",
  "message": "Invalid email address: invalid@",
  "provider": "sendgrid"
}
```

### Health Check

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "Backend API is running",
  "timestamp": "2026-04-15T10:30:00.000Z"
}
```

---

## Troubleshooting

### Backend won't start

```bash
# Check if port 3001 is already in use
lsof -i :3001

# Try different port
PORT=3002 npm start
```

### Email not sending

1. **Check backend logs:**
   ```bash
   npm start
   ```
   Look for error messages

2. **Verify credentials:**
   ```bash
   # Test email connection
   curl -X GET http://localhost:3001/health
   ```

3. **Common issues:**
   - SendGrid API key invalid or expired
   - Gmail app password incorrect
   - Sender email not verified
   - Rate limits exceeded

### CORS errors

The backend is configured to accept requests from `http://localhost:5173` and `FRONTEND_URL` env variable.

If you're getting CORS errors:

1. **Update `.env`:**
   ```
   FRONTEND_URL=https://your-frontend-domain.com
   ```

2. **Restart backend:**
   ```bash
   npm start
   ```

### Emails going to spam

1. **Add SPF record** to your domain (SendGrid provides this)
2. **Add DKIM signature** (SendGrid provides this)
3. **Use authenticated domain** instead of generic email

---

## Monitoring & Logs

### View SendGrid Logs

1. Go to https://app.sendgrid.com/
2. Go to Activity Feed
3. You'll see all emails sent with status and errors

### View Terminal Logs

Logs are printed to console:

```
[2026-04-15T10:30:42.123Z] Sending payment email to customer@example.com
Customer: John Doe, Provider: sendgrid
✓ Email sent successfully: {
  success: true,
  provider: 'SendGrid',
  messageId: 'msg_xxx'
}
```

---

## Environment Variables Reference

```bash
# Server
PORT=3001                           # Server port
NODE_ENV=development                # development or production
FRONTEND_URL=http://localhost:5173  # Frontend URL for CORS

# Email Provider
EMAIL_PROVIDER=sendgrid             # sendgrid or smtp

# SendGrid
SENDGRID_API_KEY=SG.xxxxx          # SendGrid API key
SENDGRID_FROM_EMAIL=billing@leadflow.ai
SENDGRID_REPLY_TO=support@leadflow.ai

# SMTP (Gmail or custom)
SMTP_SERVICE=gmail                  # gmail or custom
SMTP_EMAIL=your-email@gmail.com     # Your email
SMTP_PASSWORD=your-app-password     # App password
SMTP_REPLY_TO=support@leadflow.ai   # Reply-to email
```

---

## Next Steps

1. ✅ Set up backend
2. ✅ Configure email provider
3. ✅ Test locally
4. ✅ Deploy to production
5. ✅ Monitor and maintain

---

## Support

For issues:

1. Check the troubleshooting section above
2. Review backend logs in terminal
3. Check SendGrid/email provider dashboards
4. Review CORS and network settings

---

## Security Checklist

- ✅ Never commit `.env` file to Git
- ✅ Use environment variables for all secrets
- ✅ Validate all inputs on backend
- ✅ Use HTTPS in production
- ✅ Implement rate limiting (optional)
- ✅ Add authentication if needed (optional)
- ✅ Use helmet for security headers (already included)
- ✅ Keep dependencies updated

---

## File Structure

```
backend/
├── server.js              # Main Express server
├── package.json           # Dependencies
├── .env                   # *DO NOT COMMIT* - Your credentials
├── .env.example           # Template for .env
├── routes/
│   └── email.js           # Email sending logic
└── logs/                  # Log files (optional)
```

---

Congratulations! You now have a production-ready email backend for LeadFlow AI! 🎉
