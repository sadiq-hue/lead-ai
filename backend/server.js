import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { sendPaymentEmailRoute } from './routes/email.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // Security headers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Backend API is running', timestamp: new Date().toISOString() });
});

// Email sending route
app.post('/api/send-payment-email', sendPaymentEmailRoute);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   LeadFlow AI Backend API Running      ║
╠════════════════════════════════════════╣
║ Port: ${PORT}                           
║ Environment: ${process.env.NODE_ENV || 'development'}
║ Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}
║ Email Provider: ${process.env.EMAIL_PROVIDER || 'sendgrid'}
╚════════════════════════════════════════╝
  `);
});

export default app;
