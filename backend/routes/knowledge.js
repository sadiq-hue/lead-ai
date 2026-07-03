import express from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, resolve, extname } from 'path';
import { readFile } from 'fs/promises';
import { query } from '../db/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsDir = resolve(__dirname, '..', 'uploads', 'knowledge');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.txt'];
    if (allowed.includes(extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, and TXT files are allowed'));
    }
  },
});

const router = express.Router();

const validateEntry = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('keywords').optional().isArray(),
  body('category').optional().trim(),
];

// List knowledge entries for a business
router.get('/business/:business_id', async (req, res, next) => {
  try {
    const { category, search, active } = req.query;
    const filters = ['business_id = $1'];
    const values = [req.params.business_id];
    let paramIdx = 2;

    if (category) {
      filters.push(`category = $${paramIdx++}`);
      values.push(category);
    }
    if (search) {
      filters.push(`(title ILIKE $${paramIdx} OR content ILIKE $${paramIdx} OR array_to_string(keywords, ',') ILIKE $${paramIdx})`);
      values.push(`%${search}%`);
      paramIdx++;
    }
    if (active !== undefined) {
      filters.push(`is_active = $${paramIdx++}`);
      values.push(active === 'true');
    }

    const result = await query(
      `SELECT * FROM business_knowledge WHERE ${filters.join(' AND ')} ORDER BY category, title`,
      values
    );
    res.json({ count: result.rows.length, entries: result.rows });
  } catch (error) {
    next(error);
  }
});

// Upload file and create knowledge entry from extracted text
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { business_id, category } = req.body;
    if (!business_id) return res.status(400).json({ error: 'business_id is required' });

    const ext = extname(req.file.originalname).toLowerCase();
    let content = '';

    if (ext === '.pdf') {
      const { default: pdfParse } = await import('pdf-parse');
      const buffer = await readFile(req.file.path);
      const data = await pdfParse(buffer);
      content = data.text;
    } else if (ext === '.docx') {
      const { default: mammoth } = await import('mammoth');
      const buffer = await readFile(req.file.path);
      const result = await mammoth.extractRawText({ buffer });
      content = result.value;
    } else if (ext === '.txt') {
      content = await readFile(req.file.path, 'utf-8');
    }

    const title = req.body.title || req.file.originalname.replace(ext, '');

    // Auto-generate keywords from extracted content
    const stopWords = new Set(['this','that','with','from','have','been','will','they','their','which','about','would','into','them','than','then','also','more','some','what','when','make','been','been','were','other','such','only','just','over','very','after','before','between','under','these','those','while','where','each']);
    const contentWords = [...new Set(
      content.toLowerCase().split(/[\s,.;:!?()]+/)
        .filter(w => w.length > 3 && !stopWords.has(w))
    )].slice(0, 20);

    const keywords = req.body.keywords ? JSON.parse(req.body.keywords) : contentWords;
    const fileUrl = `/uploads/knowledge/${req.file.filename}`;

    const result = await query(
      `INSERT INTO business_knowledge (business_id, title, content, keywords, category, file_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [business_id, title, content, keywords, category || 'general', fileUrl]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Get single entry
router.get('/:id', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM business_knowledge WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Knowledge entry not found' });
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Create entry
router.post('/business/:business_id', validateEntry, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { title, content, keywords, category } = req.body;
    const result = await query(
      `INSERT INTO business_knowledge (business_id, title, content, keywords, category)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.params.business_id, title, content, keywords || [], category || 'general']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update entry
router.put('/:id', async (req, res, next) => {
  try {
    const { title, content, keywords, category, is_active } = req.body;
    const sets = [];
    const values = [];
    let idx = 1;

    if (title !== undefined) { sets.push(`title = $${idx++}`); values.push(title); }
    if (content !== undefined) { sets.push(`content = $${idx++}`); values.push(content); }
    if (keywords !== undefined) { sets.push(`keywords = $${idx++}`); values.push(keywords); }
    if (category !== undefined) { sets.push(`category = $${idx++}`); values.push(category); }
    if (is_active !== undefined) { sets.push(`is_active = $${idx++}`); values.push(is_active); }

    if (!sets.length) return res.status(400).json({ error: 'No fields to update' });

    sets.push(`updated_at = NOW()`);
    values.push(req.params.id);

    const result = await query(
      `UPDATE business_knowledge SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Knowledge entry not found' });
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Delete entry
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM business_knowledge WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Knowledge entry not found' });
    res.json({ deleted: true, id: req.params.id });
  } catch (error) {
    next(error);
  }
});

export default router;
