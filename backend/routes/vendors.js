import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../db/index.js';

const router = express.Router();

const validateVendor = [
  body('business_id').isUUID().withMessage('business_id is required and must be a UUID'),
  body('name').trim().notEmpty().withMessage('name is required'),
  body('email').optional().isEmail().withMessage('email must be valid'),
  body('category_id').optional().isUUID(),
  body('total_paid').optional().isNumeric(),
  body('transaction_count').optional().isInt(),
  body('last_paid_at').optional().isISO8601()
];

router.get('/', async (req, res, next) => {
  try {
    const filters = [];
    const values = [];

    if (req.query.business_id) {
      values.push(req.query.business_id);
      filters.push(`business_id = $${values.length}`);
    }
    if (req.query.category_id) {
      values.push(req.query.category_id);
      filters.push(`category_id = $${values.length}`);
    }
    if (req.query.name) {
      values.push(`%${req.query.name}%`);
      filters.push(`name ILIKE $${values.length}`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const sql = `SELECT * FROM vendors ${whereClause} ORDER BY updated_at DESC LIMIT 200`;
    const result = await query(sql, values);
    res.json({ count: result.rows.length, vendors: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM vendors WHERE id = $1', [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/', validateVendor, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const {
      business_id,
      name,
      phone,
      email,
      category_id,
      mpesa_till,
      mpesa_paybill,
      website,
      total_paid = 0,
      transaction_count = 0,
      last_paid_at
    } = req.body;

    const sql = `INSERT INTO vendors (business_id, name, phone, email, category_id, mpesa_till, mpesa_paybill, website, total_paid, transaction_count, last_paid_at)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`;
    const params = [business_id, name, phone, email, category_id, mpesa_till, mpesa_paybill, website, total_paid, transaction_count, last_paid_at];
    const result = await query(sql, params);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', validateVendor, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const allowed = [
      'name','phone','email','category_id','mpesa_till','mpesa_paybill','website','total_paid','transaction_count','last_paid_at'
    ];
    const fields = Object.keys(req.body).filter((key) => allowed.includes(key));

    if (!fields.length) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    const values = fields.map((key) => req.body[key]);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const sql = `UPDATE vendors SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`;
    const result = await query(sql, [...values, req.params.id]);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM vendors WHERE id = $1 RETURNING id, name', [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    res.json({ success: true, deleted: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

export default router;
