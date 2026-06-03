# 🚀 LeadFlow AI - Production Email Setup (Quick Start)

You've chosen the **Backend API (Production)** approach for email sending. This is the professional choice! Here's the fastest way to get it running.

## 5-Minute Setup

### Step 1: Get an API Key (Choose One)

#### 🏆 Option A: SendGrid (Easiest)
```bash
# 1. Go to https://sendgrid.com/
# 2. Sign up free (100 emails/day)
# 3. Go to Settings → API Keys → Create API Key
# 4. Copy the key (starts with "SG.")
```

#### 📧 Option B: Gmail (Quickest)
```bash
# 1. Go to https://myaccount.google.com/apppasswords
# 2. Generate an app password
# 3. Copy the 16-character password
```

### Step 2: Configure Backend

```bash
# 1. Navigate to backend
cd backend

# 2. Copy environment template
cp .env.example .env

# 3. Edit .env and add your credentials
# For SendGrid:
#   EMAIL_PROVIDER=sendgrid
#   SENDGRID_API_KEY=SG.xxxxxxx
#   SENDGRID_FROM_EMAIL=billing@leadflow.ai
#
# For Gmail:
#   EMAIL_PROVIDER=smtp
#   SMTP_SERVICE=gmail
#   SMTP_EMAIL=your-email@gmail.com
#   SMTP_PASSWORD=your-app-password

# 4. Install dependencies
npm install

# 5. Start backend
npm start
```

You should see:
```
╔════════════════════════════════════════╗
║   LeadFlow AI Backend API Running      ║
║ Port: 3001                             ║
╚════════════════════════════════════════╝
```

### Step 3: Configure Frontend

```bash
# 1. Copy frontend environment template (if not exists)
cp .env.example .env

# 2. Verify this line exists or add it:
VITE_BACKEND_API_URL=http://localhost:3001

# 3. In another terminal, start frontend
npm run dev
```

### Step 4: Test It Works!

```bash
# 1. Open http://localhost:5173 in your browser
# 2. Go to Payments tab
# 3. Click "Send Payment Request" button
# 4. Fill in form with valid email
# 5. Click "Send Request"
# 6. Check your email inbox!
```

---

## Detailed Setup by Provider

### SendGrid (Recommended for Production)

```bash
# 1. Create account: https://sendgrid.com/
# 2. Settings → API Keys → Create API Key
# 3. Copy key (format: SG.xxxxxxxxx...)

# In backend/.env:
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your_key_here
SENDGRID_FROM_EMAIL=billing@leadflow.ai
SENDGRID_REPLY_TO=support@leadflow.ai
```

**Advantages:**
- 100 free emails/day
- Enterprise-grade reliability
- Best for production
- Great dashboard for monitoring

**Dashboard:** https://app.sendgrid.com/

---

### Gmail (Recommended for Testing)

```bash
# 1. Enable 2FA: https://myaccount.google.com/security
# 2. Get app password: https://myaccount.google.com/apppasswords
# 3. Select "Mail" + "Windows Device"
# 4. Copy 16-char password

# In backend/.env:
EMAIL_PROVIDER=smtp
SMTP_SERVICE=gmail
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-16-char-password
SMTP_REPLY_TO=support@leadflow.ai
```

**Advantages:**
- No signup needed
- Great for testing
- Easy setup
- Works worldwide

---

## Deployment

### Development
```bash
# Terminal 1: Backend (starts on port 3001)
cd backend
npm run dev

# Terminal 2: Frontend (starts on port 5173)
npm run dev
```

### Production (Railway.app - Easiest)

```bash
# 1. Create account: https://railway.app/
# 2. Connect GitHub repo
# 3. Select `backend` folder to deploy
# 4. Add environment variables
# 5. Get deployment URL (e.g., https://leadai-backend.railway.app)
# 6. Update VITE_BACKEND_API_URL in frontend .env
```

### Production (Heroku)

```bash
# 1. Create account: https://heroku.com/
# 2. Install CLI: https://devcenter.heroku.com/articles/heroku-cli
# 3. Deploy:
heroku login
heroku create leadai-backend
git push heroku main
# 4. Set env variables
heroku config:set SENDGRID_API_KEY=SG.xxxxx
```

---

## Troubleshooting

### Backend won't start
```bash
# Check if port 3001 is in use
lsof -i :3001

# Try different port
PORT=3002 npm start
```

### Email not sending
1. Check backend terminal for errors
2. Verify email provider credentials in `.env`
3. Check your email provider's dashboard for delivery status

### CORS errors
Backend only accepts requests from `http://localhost:5173` by default.

Update in `backend/.env`:
```
FRONTEND_URL=https://your-production-domain.com
```

### Testing the backend directly
```bash
curl -X POST http://localhost:3001/api/send-payment-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Payment",
    "html": "<h1>Test</h1>",
    "text": "Test",
    "customerName": "Test User"
  }'
```

---

## File Structure

```
LeadAI/
├── backend/                    ← Backend server
│   ├── server.js               ← Main server file
│   ├── package.json            ← Dependencies
│   ├── .env                    ← Your credentials (secret)
│   ├── .env.example            ← Template
│   └── routes/
│       └── email.js            ← Email sending logic
├── src/                        ← Frontend React code
│   └── app/components/pages/
│       └── Payments.tsx        ← Uses backend API
├── .env                        ← Frontend config
├── .env.example                ← Frontend template
├── BACKEND_SETUP.md            ← Detailed backend guide
└── PRODUCTION_EMAIL_SETUP.md   ← This file
```

---

## Environment Variables

### Backend (.env in `backend/` folder)
```bash
EMAIL_PROVIDER=sendgrid or smtp
SENDGRID_API_KEY=SG.xxxxx (if using SendGrid)
SMTP_EMAIL=xxx@gmail.com (if using Gmail)
SMTP_PASSWORD=your-app-password (if using Gmail)
FRONTEND_URL=http://localhost:5173 (or production URL)
PORT=3001
```

### Frontend (.env in root folder)
```bash
VITE_BACKEND_API_URL=http://localhost:3001
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_PROJECT_ID=xxx
# ... other vars
```

---

## Next Steps

1. ✅ Set up backend with email provider
2. ✅ Test locally (payment request form)
3. ✅ Monitor emails (check provider dashboard)
4. ✅ Deploy backend to production (Railway/Heroku)
5. ✅ Update frontend to production backend URL
6. ✅ Deploy frontend (Vercel/Netlify)

---

## Quick Command Reference

```bash
# Backend
cd backend && npm install       # Install dependencies
npm start                       # Start backend
npm run dev                     # Start with auto-reload
PORT=3002 npm start             # Start on different port

# Frontend
npm install                     # Install dependencies
npm run dev                     # Start dev server
npm run build                   # Build for production
```

---

## Getting Help

- **Backend logs:** Check terminal where `npm start` is running
- **Email status:** Check your SendGrid/Gmail dashboard
- **API testing:** Use the curl command above
- **CORS issues:** Make sure FRONTEND_URL is set in backend .env

---

## Security Checklist

✅ Never commit `.env` file  
✅ Keep API keys secret  
✅ Use HTTPS in production  
✅ Validate all inputs  
✅ Use environment variables for secrets  
✅ Keep dependencies updated  

---

**You're all set! Start by running:**

```bash
# Terminal 1
cd backend && npm install && npm start

# Terminal 2
npm run dev

# Then test at http://localhost:5173/payments
```

🎉 Happy emailing!
