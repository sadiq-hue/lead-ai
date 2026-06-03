# LeadFlow AI Backend API

Production-ready Node.js/Express backend for handling email sending and payment requests in LeadFlow AI.

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your email service credentials

# Start backend
npm start
```

Backend will be available at `http://localhost:3001`

## Features

- ✅ Email sending via SendGrid or SMTP
- ✅ Production-ready with error handling
- ✅ CORS support for frontend integration
- ✅ Input validation and security headers
- ✅ Health check endpoint
- ✅ Detailed logging

## Email Providers Supported

### SendGrid (Recommended)
- Free tier: 100 emails/day
- Reliable and scalable
- [Sign up](https://sendgrid.com/)

### SMTP (Gmail, custom servers)
- Gmail: No extra cost
- Custom: Use any SMTP provider
- [Setup guide](../BACKEND_SETUP.md)

## Environment Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```bash
# Email provider: sendgrid or smtp
EMAIL_PROVIDER=sendgrid

# For SendGrid
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=billing@leadflow.ai

# For SMTP (Gmail)
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Server config
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## API Endpoints

### POST /api/send-payment-email

Sends a payment request email.

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

**Response:**
```json
{
  "success": true,
  "message": "Payment request email sent successfully",
  "provider": "SendGrid",
  "messageId": "msg_1234567890",
  "recipient": "customer@example.com"
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "Backend API is running",
  "timestamp": "2026-04-15T10:30:00.000Z"
}
```

## Development

```bash
# Start with auto-reload
npm run dev

# Run on different port
PORT=3002 npm start
```

## Project Structure

```
backend/
├── server.js           # Main Express server
├── package.json        # Dependencies and scripts
├── .env.example        # Environment template
├── .gitignore         # Git ignore rules
├── routes/
│   └── email.js       # Email sending routes
└── README.md          # This file
```

## Deployment

### Railway.app (Easiest)
1. Create account: https://railway.app/
2. Connect GitHub repo
3. Select `backend` folder
4. Add environment variables
5. Deploy!

### Heroku
```bash
heroku login
heroku create your-app-name
git push heroku main
heroku config:set SENDGRID_API_KEY=SG.xxxxx
```

### Docker
```bash
docker build -t leadai-backend .
docker run -p 3001:3001 --env-file .env leadai-backend
```

## Troubleshooting

### Port already in use
```bash
lsof -i :3001  # See what's using the port
PORT=3002 npm start  # Use different port
```

### Email not sending
1. Check terminal logs for error messages
2. Verify credentials in `.env`
3. Check email provider dashboard
4. Ensure sender email is verified

### CORS errors
Update `FRONTEND_URL` in `.env` to match your frontend domain.

## Security

- 🔒 Environment variables for all secrets
- 🛡️ Helmet for security headers
- ✅ Input validation with express-validator
- 🔐 CORS configured for your domain
- 📝 Never commit `.env` file

## Documentation

- [Full Backend Setup Guide](../BACKEND_SETUP.md)
- [Production Email Setup](../PRODUCTION_EMAIL_SETUP.md)
- [Email Setup Guide](../EMAIL_SETUP_GUIDE.md)

## Support

For issues:
1. Check terminal logs
2. Review .env configuration
3. Check email provider dashboard
4. See troubleshooting section above

## License

MIT

---

**Happy emailing! 🚀**
