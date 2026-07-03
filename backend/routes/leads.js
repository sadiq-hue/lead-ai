import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../db/index.js';

const router = express.Router();

const validateLead = [
  body('business_id').isUUID().withMessage('business_id is required and must be a UUID'),
  body('channel').optional().isIn(['whatsapp', 'instagram', 'facebook', 'tiktok', 'email', 'manual']),
  body('status').optional().isIn(['new', 'contacted', 'qualified', 'booked', 'won', 'lost', 'unqualified']),
  body('score').optional().isInt({ min: 0, max: 100 }),
  body('assigned_to').optional().isUUID()
];

router.get('/', async (req, res, next) => {
  try {
    const filters = [];
    const values = [];

    if (req.query.business_id) {
      values.push(req.query.business_id);
      filters.push(`business_id = $${values.length}`);
    }
    if (req.query.status) {
      values.push(req.query.status);
      filters.push(`status = $${values.length}`);
    }
    if (req.query.channel) {
      values.push(req.query.channel);
      filters.push(`channel = $${values.length}`);
    }
    if (req.query.assigned_to) {
      values.push(req.query.assigned_to);
      filters.push(`assigned_to = $${values.length}`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const sql = `SELECT * FROM leads ${whereClause} ORDER BY updated_at DESC LIMIT 200`;
    const result = await query(sql, values);
    res.json({ count: result.rows.length, leads: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM leads WHERE id = $1', [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/', validateLead, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const {
      business_id,
      channel = 'whatsapp',
      phone_number,
      name,
      status = 'new',
      score = 0,
      assigned_to,
      source_ref,
      metadata = {}
    } = req.body;

    const sql = `INSERT INTO leads (business_id, channel, phone_number, name, status, score, assigned_to, source_ref, metadata)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`;
    const params = [business_id, channel, phone_number, name, status, score, assigned_to, source_ref, metadata];
    const result = await query(sql, params);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', validateLead, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const allowed = [
      'channel','phone_number','name','status','score','assigned_to','source_ref','metadata','first_contact_at','last_activity_at'
    ];
    const fields = Object.keys(req.body).filter((key) => allowed.includes(key));

    if (!fields.length) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    const values = fields.map((key) => req.body[key]);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const sql = `UPDATE leads SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`;
    const result = await query(sql, [...values, req.params.id]);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM leads WHERE id = $1 RETURNING id, name', [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json({ success: true, deleted: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

export default router;
