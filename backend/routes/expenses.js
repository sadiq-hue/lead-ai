import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../db/index.js';

const router = express.Router();

const validateExpense = [
  body('business_id').isUUID().withMessage('business_id is required and must be a UUID'),
  body('title').trim().notEmpty().withMessage('title is required'),
  body('amount').isNumeric().withMessage('amount is required and must be numeric'),
  body('payment_method').optional().isIn(['mpesa', 'bank', 'cash', 'card', 'other']),
  body('status').optional().isIn(['draft', 'submitted', 'approved', 'rejected', 'paid'])
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
    if (req.query.category_id) {
      values.push(req.query.category_id);
      filters.push(`category_id = $${values.length}`);
    }
    if (req.query.vendor_id) {
      values.push(req.query.vendor_id);
      filters.push(`vendor_id = $${values.length}`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const sql = `SELECT * FROM expenses ${whereClause} ORDER BY incurred_at DESC LIMIT 200`;
    const result = await query(sql, values);
    res.json({ count: result.rows.length, expenses: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM expenses WHERE id = $1', [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/', validateExpense, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const {
      business_id,
      category_id,
      user_id,
      vendor_id,
      import_batch_id,
      recurring_template_id,
      title,
      amount,
      currency = 'KES',
      payment_method = 'mpesa',
      status = 'draft',
      reference_number,
      receipt_url,
      notes,
      is_recurring = false,
      reconciled = false,
      transaction_id,
      incurred_at,
      approved_by,
      approved_at
    } = req.body;

    const sql = `INSERT INTO expenses (business_id, category_id, user_id, vendor_id, import_batch_id, recurring_template_id, title, amount, currency, payment_method, status, reference_number, receipt_url, notes, is_recurring, reconciled, transaction_id, incurred_at, approved_by, approved_at)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) RETURNING *`;
    const params = [business_id, category_id, user_id, vendor_id, import_batch_id, recurring_template_id, title, amount, currency, payment_method, status, reference_number, receipt_url, notes, is_recurring, reconciled, transaction_id, incurred_at, approved_by, approved_at];
    const result = await query(sql, params);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', validateExpense, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const allowed = [
      'category_id','user_id','vendor_id','import_batch_id','recurring_template_id','title','amount','currency','payment_method','status','reference_number','receipt_url','notes','is_recurring','reconciled','transaction_id','incurred_at','approved_by','approved_at'
    ];
    const fields = Object.keys(req.body).filter((key) => allowed.includes(key));

    if (!fields.length) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    const values = fields.map((key) => req.body[key]);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const sql = `UPDATE expenses SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`;
    const result = await query(sql, [...values, req.params.id]);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM expenses WHERE id = $1 RETURNING id, title, amount', [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json({ success: true, deleted: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

export default router;
