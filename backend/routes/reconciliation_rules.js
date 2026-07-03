import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../db/index.js';

const router = express.Router();

const validateRule = [
  body('business_id').isUUID().withMessage('business_id is required and must be a UUID'),
  body('name').trim().notEmpty().withMessage('name is required'),
  body('match_field').trim().notEmpty().withMessage('match_field is required'),
  body('match_operator').optional().isIn(['contains', 'equals', 'starts_with', 'ends_with', 'greater_than', 'less_than']),
  body('match_value').trim().notEmpty().withMessage('match_value is required')
];

router.get('/', async (req, res, next) => {
  try {
    const filters = [];
    const values = [];
    if (req.query.business_id) {
      values.push(req.query.business_id);
      filters.push(`business_id = $${values.length}`);
    }
    if (req.query.active) {
      values.push(req.query.active === 'true');
      filters.push(`active = $${values.length}`);
    }
    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const sql = `SELECT * FROM reconciliation_rules ${whereClause} ORDER BY priority ASC LIMIT 200`;
    const result = await query(sql, values);
    res.json({ count: result.rows.length, reconciliationRules: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM reconciliation_rules WHERE id = $1', [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Reconciliation rule not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/', validateRule, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const {
      business_id,
      category_id,
      name,
      match_field,
      match_operator = 'contains',
      match_value,
      auto_approve = false,
      priority = 10,
      active = true
    } = req.body;

    const sql = `INSERT INTO reconciliation_rules (business_id, category_id, name, match_field, match_operator, match_value, auto_approve, priority, active)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`;
    const params = [business_id, category_id, name, match_field, match_operator, match_value, auto_approve, priority, active];
    const result = await query(sql, params);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', validateRule, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const allowed = ['category_id','name','match_field','match_operator','match_value','auto_approve','priority','active'];
    const fields = Object.keys(req.body).filter((key) => allowed.includes(key));
    if (!fields.length) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }
    const values = fields.map((key) => req.body[key]);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const sql = `UPDATE reconciliation_rules SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`;
    const result = await query(sql, [...values, req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Reconciliation rule not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM reconciliation_rules WHERE id = $1 RETURNING id, name', [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Reconciliation rule not found' });
    }
    res.json({ success: true, deleted: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

export default router;
