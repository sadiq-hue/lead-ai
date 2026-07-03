import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import helmet from 'helmet';
import { sendPaymentEmailRoute } from './routes/email.js';
import businessesRouter from './routes/businesses.js';
import leadsRouter from './routes/leads.js';
import paymentsRouter from './routes/payments.js';
import expensesRouter from './routes/expenses.js';
import contactsRouter from './routes/contacts.js';
import tasksRouter from './routes/tasks.js';
import vendorsRouter from './routes/vendors.js';
import pipelineStagesRouter from './routes/pipeline_stages.js';
import activitiesRouter from './routes/activities.js';
import reconciliationRulesRouter from './routes/reconciliation_rules.js';
import whatsappRouter from './routes/whatsapp.js';
import aiRouter from './routes/ai.js';
import knowledgeRouter from './routes/knowledge.js';
import stocksRouter from './routes/stocks.js';
import crudRouter from './routes/crud.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from the server directory
dotenv.config({ path: resolve(__dirname, '.env') });

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

// Explicit business and core entity routes
app.use('/api/businesses', businessesRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/vendors', vendorsRouter);
app.use('/api/pipeline_stages', pipelineStagesRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/reconciliation_rules', reconciliationRulesRouter);

// WhatsApp integration routes (webhook, send, simulate)
app.use('/api/whatsapp', whatsappRouter);

// AI response generation route
app.use('/api/ai', aiRouter);

// Business knowledge base
app.use('/api/knowledge', knowledgeRouter);

// NSE stock financial statements
app.use('/api/stocks', stocksRouter);

// Serve uploaded files
app.use('/uploads', express.static(resolve(__dirname, 'uploads')));

// Generic CRUD router for other schema entities
app.use('/api', crudRouter);

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
