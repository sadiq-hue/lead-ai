import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../db/index.js';

const router = express.Router();

const validateBusiness = [
  body('name').trim().notEmpty().withMessage('Business name is required'),
  body('tier').optional().isIn(['starter', 'growth', 'pro']).withMessage('Invalid business tier'),
  body('country_code').optional().trim().isLength({ min: 2, max: 5 }),
  body('currency').optional().trim().isLength({ min: 3, max: 5 })
];

router.get('/', async (req, res, next) => {
  try {
    const filters = [];
    const values = [];

    if (req.query.id) {
      values.push(req.query.id);
      filters.push(`id = $${values.length}`);
    }
    if (req.query.name) {
      values.push(`%${req.query.name}%`);
      filters.push(`name ILIKE $${values.length}`);
    }
    if (req.query.active) {
      values.push(req.query.active === 'true');
      filters.push(`active = $${values.length}`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const sql = `SELECT * FROM businesses ${whereClause} ORDER BY created_at DESC LIMIT 100`;
    const result = await query(sql, values);
    res.json({ count: result.rows.length, businesses: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM businesses WHERE id = $1', [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Business not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/', validateBusiness, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const {
      name,
      industry,
      tier = 'starter',
      whatsapp_number,
      meta_page_id,
      mpesa_shortcode,
      mpesa_passkey,
      daraja_consumer_key,
      country_code = 'KE',
      currency = 'KES',
      timezone = 'Africa/Nairobi',
      logo_url,
      active = true
    } = req.body;

    const sql = `INSERT INTO businesses (name, industry, tier, whatsapp_number, meta_page_id, mpesa_shortcode, mpesa_passkey, daraja_consumer_key, country_code, currency, timezone, logo_url, active)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`;
    const params = [name, industry, tier, whatsapp_number, meta_page_id, mpesa_shortcode, mpesa_passkey, daraja_consumer_key, country_code, currency, timezone, logo_url, active];
    const result = await query(sql, params);
    const created = result.rows[0];

    await query('SELECT seed_system_categories($1)', [created.id]);
    await query('SELECT seed_pipeline_stages($1)', [created.id]);

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', validateBusiness, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const fields = Object.keys(req.body).filter((key) => [
      'name','industry','tier','whatsapp_number','meta_page_id','mpesa_shortcode','mpesa_passkey','daraja_consumer_key','country_code','currency','timezone','logo_url','active','description','products'
    ].includes(key));

    if (!fields.length) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    const values = fields.map((key) => req.body[key]);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const sql = `UPDATE businesses SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`;
    const result = await query(sql, [...values, req.params.id]);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Business not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM businesses WHERE id = $1 RETURNING id, name', [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Business not found' });
    }
    res.json({ success: true, deleted: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

export default router;
