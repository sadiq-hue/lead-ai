import express from 'express';
import multer from 'multer';
import { execFile } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve, extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { readFile } from 'fs/promises';
import { query } from '../db/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsDir = resolve(__dirname, '..', 'uploads', 'stocks');

if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (extname(file.originalname).toLowerCase() === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

const router = express.Router();

// =============================================================
//  STOCKS CRUD
// =============================================================

// List all NSE stocks
router.get('/', async (req, res, next) => {
  try {
    const { sector, search } = req.query;
    const filters = [];
    const values = [];
    let idx = 1;

    if (sector) {
      filters.push(`sector = $${idx++}`);
      values.push(sector);
    }
    if (search) {
      filters.push(`(ticker ILIKE $${idx} OR company_name ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const result = await query(
      `SELECT s.*,
        (SELECT COUNT(*) FROM financial_statements fs WHERE fs.stock_id = s.id) AS statement_count,
        (SELECT COUNT(*) FROM stock_fundamentals sf WHERE sf.stock_id = s.id) AS fundamentals_count
       FROM nse_stocks s ${where} ORDER BY s.ticker`,
      values
    );
    res.json({ stocks: result.rows, count: result.rows.length });
  } catch (err) {
    next(err);
  }
});

// Download PDF file from database
router.get('/pdf/:id', async (req, res, next) => {
  try {
    const result = await query(
      'SELECT file_data, file_name FROM financial_statements WHERE id = $1',
      [req.params.id]
    );
    if (!result.rows.length || !result.rows[0].file_data) {
      return res.status(404).json({ error: 'PDF not found' });
    }
    const { file_data, file_name } = result.rows[0];
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${file_name}"`);
    res.send(file_data);
  } catch (err) {
    next(err);
  }
});

// Get single stock with latest fundamentals
router.get('/:id', async (req, res, next) => {
  try {
    const stockResult = await query('SELECT * FROM nse_stocks WHERE id = $1', [req.params.id]);
    if (!stockResult.rows.length) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    const fundamentalsResult = await query(
      `SELECT sf.*, fs.file_name, fs.period_type
       FROM stock_fundamentals sf
       JOIN financial_statements fs ON fs.id = sf.statement_id
       WHERE sf.stock_id = $1
       ORDER BY sf.fiscal_year DESC, sf.period DESC
       LIMIT 20`,
      [req.params.id]
    );

    const statementsResult = await query(
      `SELECT * FROM financial_statements WHERE stock_id = $1 ORDER BY created_at DESC`,
      [req.params.id]
    );

    res.json({
      ...stockResult.rows[0],
      fundamentals: fundamentalsResult.rows,
      statements: statementsResult.rows,
    });
  } catch (err) {
    next(err);
  }
});

// Create new stock
router.post('/', async (req, res, next) => {
  try {
    const { ticker, company_name, sector, market_cap } = req.body;
    if (!ticker || !company_name) {
      return res.status(400).json({ error: 'ticker and company_name are required' });
    }

    const result = await query(
      `INSERT INTO nse_stocks (ticker, company_name, sector, market_cap)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [ticker.toUpperCase(), company_name, sector || null, market_cap || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ticker already exists' });
    }
    next(err);
  }
});

// Update stock
router.put('/:id', async (req, res, next) => {
  try {
    const { company_name, sector, market_cap, active } = req.body;
    const sets = [];
    const values = [];
    let idx = 1;

    if (company_name !== undefined) { sets.push(`company_name = $${idx++}`); values.push(company_name); }
    if (sector !== undefined) { sets.push(`sector = $${idx++}`); values.push(sector); }
    if (market_cap !== undefined) { sets.push(`market_cap = $${idx++}`); values.push(market_cap); }
    if (active !== undefined) { sets.push(`active = $${idx++}`); values.push(active); }

    if (!sets.length) return res.status(400).json({ error: 'No fields to update' });

    values.push(req.params.id);
    const result = await query(
      `UPDATE nse_stocks SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Stock not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Delete stock
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM nse_stocks WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Stock not found' });
    res.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// =============================================================
//  PDF UPLOAD + PROCESSING
// =============================================================

// Upload financial statement PDF
router.post('/upload', upload.single('pdf'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { stock_id, fiscal_year, period_type, period } = req.body;
    if (!stock_id || !fiscal_year) {
      return res.status(400).json({ error: 'stock_id and fiscal_year are required' });
    }

    const fileUrl = `/uploads/stocks/${req.file.filename}`;
    const fileBuffer = await readFile(req.file.path);

    const result = await query(
      `INSERT INTO financial_statements (stock_id, file_url, file_name, file_data, period_type, fiscal_year, period, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'uploaded') RETURNING *`,
      [stock_id, fileUrl, req.file.originalname, fileBuffer, period_type || 'annual', parseInt(fiscal_year), period || 'FY']
    );

    const doc = result.rows[0];

    // Trigger Python parser in background
    const webhookUrl = `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/stocks/webhook/extraction`;
    const scriptPath = resolve(__dirname, '..', 'scripts', 'parse_financial.py');
    const filePath = resolve(__dirname, '..', 'uploads', 'stocks', req.file.filename);

    const pythonCmd = `python3`;
    const args = [
      scriptPath,
      '--docId', doc.id,
      '--path', filePath,
      '--webhook', webhookUrl,
      '--apiKey', process.env.OPENAI_API_KEY || '',
      '--model', process.env.OPENAI_MODEL || 'gpt-4o-mini',
    ];

    // Update status to processing
    await query(`UPDATE financial_statements SET status = 'processing' WHERE id = $1`, [doc.id]);

    execFile(pythonCmd, args, { timeout: 120000 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Python parser error: ${error.message}`);
        query(`UPDATE financial_statements SET status = 'failed', error_message = $1 WHERE id = $2`,
          [error.message, doc.id]);
      } else {
        console.log(`Python parser output: ${stdout}`);
      }
    });

    res.status(201).json({
      ...doc,
      message: 'PDF uploaded and queued for financial data extraction'
    });
  } catch (err) {
    next(err);
  }
});

// Webhook: receive extraction results from Python script
router.post('/webhook/extraction', async (req, res, next) => {
  try {
    const { docId, status, raw_text, extracted, error } = req.body;

    if (!docId) return res.status(400).json({ error: 'docId is required' });

    // Update statement status
    await query(
      `UPDATE financial_statements SET status = $1, raw_text = $2, error_message = $3 WHERE id = $4`,
      [status, raw_text || null, error || null, docId]
    );

    if (status === 'failed') {
      return res.json({ message: 'Extraction marked as failed' });
    }

    // Get the statement to find stock_id
    const stmtResult = await query('SELECT * FROM financial_statements WHERE id = $1', [docId]);
    if (!stmtResult.rows.length) {
      return res.status(404).json({ error: 'Statement not found' });
    }
    const stmt = stmtResult.rows[0];

    if (extracted && typeof extracted === 'object') {
      // Upsert fundamentals
      await query(
        `INSERT INTO stock_fundamentals
          (stock_id, statement_id, revenue, net_profit, eps, dps, total_assets, total_liabilities, book_value, fiscal_year, period)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (stock_id, statement_id) DO UPDATE SET
          revenue = EXCLUDED.revenue, net_profit = EXCLUDED.net_profit, eps = EXCLUDED.eps,
          dps = EXCLUDED.dps, total_assets = EXCLUDED.total_assets, total_liabilities = EXCLUDED.total_liabilities,
          book_value = EXCLUDED.book_value`,
        [
          stmt.stock_id,
          docId,
          extracted.revenue || null,
          extracted.net_profit || null,
          extracted.eps || null,
          extracted.dps || null,
          extracted.total_assets || null,
          extracted.total_liabilities || null,
          extracted.book_value || null,
          extracted.fiscal_year || stmt.fiscal_year,
          extracted.period || stmt.period || 'FY',
        ]
      );
    }

    res.json({ message: 'Extraction results saved', docId, status });
  } catch (err) {
    next(err);
  }
});

// =============================================================
//  FUNDAMENTALS
// =============================================================

// Get fundamentals for a stock
router.get('/:id/fundamentals', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT sf.*, fs.file_name, fs.period_type
       FROM stock_fundamentals sf
       JOIN financial_statements fs ON fs.id = sf.statement_id
       WHERE sf.stock_id = $1
       ORDER BY sf.fiscal_year DESC, sf.period DESC`,
      [req.params.id]
    );
    res.json({ fundamentals: result.rows, count: result.rows.length });
  } catch (err) {
    next(err);
  }
});

// Get all statements for a stock
router.get('/:id/statements', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM financial_statements WHERE stock_id = $1 ORDER BY created_at DESC`,
      [req.params.id]
    );
    res.json({ statements: result.rows, count: result.rows.length });
  } catch (err) {
    next(err);
  }
});

export default router;
