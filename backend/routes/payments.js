import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../db/index.js';

const router = express.Router();

const validatePayment = [
  body('deal_id').isUUID().withMessage('deal_id is required and must be a UUID'),
  body('business_id').isUUID().withMessage('business_id is required and must be a UUID'),
  body('amount').isNumeric().withMessage('amount is required and must be numeric'),
  body('provider').optional().isIn(['mpesa', 'bank', 'cash', 'card', 'other']),
  body('status').optional().isIn(['initiated', 'pending', 'confirmed', 'failed', 'timeout', 'refunded'])
];

router.get('/', async (req, res, next) => {
  try {
    const filters = [];
    const values = [];

    if (req.query.business_id) {
      values.push(req.query.business_id);
      filters.push(`business_id = $${values.length}`);
    }
    if (req.query.deal_id) {
      values.push(req.query.deal_id);
      filters.push(`deal_id = $${values.length}`);
    }
    if (req.query.status) {
      values.push(req.query.status);
      filters.push(`status = $${values.length}`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const sql = `SELECT * FROM payments ${whereClause} ORDER BY created_at DESC LIMIT 200`;
    const result = await query(sql, values);
    res.json({ count: result.rows.length, payments: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM payments WHERE id = $1', [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/', validatePayment, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const {
      deal_id,
      business_id,
      provider = 'mpesa',
      provider_ref,
      checkout_request_id,
      amount,
      currency = 'KES',
      status = 'initiated',
      mpesa_phone,
      failure_reason,
      receipt_url,
      paid_at
    } = req.body;

    const sql = `INSERT INTO payments (deal_id, business_id, provider, provider_ref, checkout_request_id, amount, currency, status, mpesa_phone, failure_reason, receipt_url, paid_at)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`;
    const params = [deal_id, business_id, provider, provider_ref, checkout_request_id, amount, currency, status, mpesa_phone, failure_reason, receipt_url, paid_at];
    const result = await query(sql, params);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', validatePayment, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const allowed = [
      'provider','provider_ref','checkout_request_id','amount','currency','status','mpesa_phone','failure_reason','receipt_url','paid_at'
    ];
    const fields = Object.keys(req.body).filter((key) => allowed.includes(key));

    if (!fields.length) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    const values = fields.map((key) => req.body[key]);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const sql = `UPDATE payments SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`;
    const result = await query(sql, [...values, req.params.id]);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM payments WHERE id = $1 RETURNING id, amount', [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json({ success: true, deleted: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

export default router;
