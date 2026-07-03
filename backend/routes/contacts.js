import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../db/index.js';

const router = express.Router();

const validateContact = [
  body('business_id').isUUID().withMessage('business_id is required and must be a UUID'),
  body('full_name').trim().notEmpty().withMessage('full_name is required'),
  body('contact_type').optional().isIn(['lead', 'customer', 'prospect', 'partner', 'other']),
  body('status').optional().isIn(['active', 'inactive', 'blocked', 'archived']),
  body('source_channel').optional().isIn(['whatsapp', 'instagram', 'facebook', 'tiktok', 'email', 'manual']),
  body('assigned_to').optional().isUUID(),
  body('lifetime_value').optional().isNumeric(),
  body('total_deals').optional().isInt(),
  body('won_deals').optional().isInt(),
  body('last_contacted_at').optional().isISO8601()
];

router.get('/', async (req, res, next) => {
  try {
    const filters = [];
    const values = [];

    if (req.query.business_id) {
      values.push(req.query.business_id);
      filters.push(`business_id = $${values.length}`);
    }
    if (req.query.assigned_to) {
      values.push(req.query.assigned_to);
      filters.push(`assigned_to = $${values.length}`);
    }
    if (req.query.status) {
      values.push(req.query.status);
      filters.push(`status = $${values.length}`);
    }
    if (req.query.contact_type) {
      values.push(req.query.contact_type);
      filters.push(`contact_type = $${values.length}`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const sql = `SELECT * FROM contacts ${whereClause} ORDER BY updated_at DESC LIMIT 200`;
    const result = await query(sql, values);
    res.json({ count: result.rows.length, contacts: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM contacts WHERE id = $1', [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/', validateContact, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const {
      business_id,
      lead_id,
      full_name,
      phone_primary,
      phone_secondary,
      email,
      company,
      job_title,
      contact_type = 'lead',
      status = 'active',
      source_channel,
      assigned_to,
      avatar_url,
      address,
      notes,
      lifetime_value = 0,
      total_deals = 0,
      won_deals = 0,
      last_contacted_at
    } = req.body;

    const sql = `INSERT INTO contacts (business_id, lead_id, full_name, phone_primary, phone_secondary, email, company, job_title, contact_type, status, source_channel, assigned_to, avatar_url, address, notes, lifetime_value, total_deals, won_deals, last_contacted_at)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *`;
    const params = [business_id, lead_id, full_name, phone_primary, phone_secondary, email, company, job_title, contact_type, status, source_channel, assigned_to, avatar_url, address, notes, lifetime_value, total_deals, won_deals, last_contacted_at];
    const result = await query(sql, params);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', validateContact, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const allowed = [
      'lead_id','full_name','phone_primary','phone_secondary','email','company','job_title','contact_type','status','source_channel','assigned_to','avatar_url','address','notes','lifetime_value','total_deals','won_deals','last_contacted_at'
    ];
    const fields = Object.keys(req.body).filter((key) => allowed.includes(key));

    if (!fields.length) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    const values = fields.map((key) => req.body[key]);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const sql = `UPDATE contacts SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`;
    const result = await query(sql, [...values, req.params.id]);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM contacts WHERE id = $1 RETURNING id, full_name', [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json({ success: true, deleted: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

export default router;
