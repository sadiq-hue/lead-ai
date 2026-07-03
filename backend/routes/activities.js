import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../db/index.js';

const router = express.Router();

const validateActivity = [
  body('contact_id').isUUID().withMessage('contact_id is required and must be a UUID'),
  body('business_id').isUUID().withMessage('business_id is required and must be a UUID'),
  body('type').optional().isIn(['call', 'message', 'meeting', 'email', 'note', 'task', 'demo', 'other']),
  body('direction').optional().isIn(['inbound', 'outbound']),
  body('channel').optional().isIn(['whatsapp', 'instagram', 'facebook', 'tiktok', 'email', 'manual']),
  body('summary').trim().notEmpty().withMessage('summary is required'),
  body('user_id').optional().isUUID(),
  body('duration_seconds').optional().isInt({ min: 0 }),
  body('occurred_at').optional().isISO8601()
];

router.get('/', async (req, res, next) => {
  try {
    const filters = [];
    const values = [];
    if (req.query.contact_id) {
      values.push(req.query.contact_id);
      filters.push(`contact_id = $${values.length}`);
    }
    if (req.query.business_id) {
      values.push(req.query.business_id);
      filters.push(`business_id = $${values.length}`);
    }
    if (req.query.user_id) {
      values.push(req.query.user_id);
      filters.push(`user_id = $${values.length}`);
    }
    if (req.query.type) {
      values.push(req.query.type);
      filters.push(`type = $${values.length}`);
    }
    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const sql = `SELECT * FROM activities ${whereClause} ORDER BY occurred_at DESC LIMIT 200`;
    const result = await query(sql, values);
    res.json({ count: result.rows.length, activities: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM activities WHERE id = $1', [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/', validateActivity, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const {
      contact_id,
      deal_id,
      business_id,
      user_id,
      type = 'message',
      direction = 'outbound',
      channel,
      summary,
      outcome,
      duration_seconds,
      occurred_at = new Date().toISOString()
    } = req.body;

    const sql = `INSERT INTO activities (contact_id, deal_id, business_id, user_id, type, direction, channel, summary, outcome, duration_seconds, occurred_at)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`;
    const params = [contact_id, deal_id, business_id, user_id, type, direction, channel, summary, outcome, duration_seconds, occurred_at];
    const result = await query(sql, params);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', validateActivity, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const allowed = ['deal_id','user_id','type','direction','channel','summary','outcome','duration_seconds','occurred_at'];
    const fields = Object.keys(req.body).filter((key) => allowed.includes(key));
    if (!fields.length) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }
    const values = fields.map((key) => req.body[key]);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const sql = `UPDATE activities SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`;
    const result = await query(sql, [...values, req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM activities WHERE id = $1 RETURNING id, summary', [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    res.json({ success: true, deleted: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

export default router;
