import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../db/index.js';

const router = express.Router();

const validatePipelineStage = [
  body('business_id').isUUID().withMessage('business_id is required and must be a UUID'),
  body('name').trim().notEmpty().withMessage('name is required'),
  body('position').optional().isInt({ min: 0 }).withMessage('position must be a non-negative integer'),
  body('color_hex').optional().trim().isLength({ min: 4, max: 7 }).withMessage('color_hex must be a valid hex color'),
  body('is_won').optional().isBoolean(),
  body('is_lost').optional().isBoolean()
];

router.get('/', async (req, res, next) => {
  try {
    const filters = [];
    const values = [];
    if (req.query.business_id) {
      values.push(req.query.business_id);
      filters.push(`business_id = $${values.length}`);
    }
    if (req.query.is_won) {
      values.push(req.query.is_won === 'true');
      filters.push(`is_won = $${values.length}`);
    }
    if (req.query.is_lost) {
      values.push(req.query.is_lost === 'true');
      filters.push(`is_lost = $${values.length}`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const sql = `SELECT * FROM pipeline_stages ${whereClause} ORDER BY position ASC LIMIT 200`;
    const result = await query(sql, values);
    res.json({ count: result.rows.length, pipelineStages: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM pipeline_stages WHERE id = $1', [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Pipeline stage not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/', validatePipelineStage, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const {
      business_id,
      name,
      position = 0,
      color_hex = '#1D9E75',
      is_won = false,
      is_lost = false
    } = req.body;

    const sql = `INSERT INTO pipeline_stages (business_id, name, position, color_hex, is_won, is_lost)
                 VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`;
    const params = [business_id, name, position, color_hex, is_won, is_lost];
    const result = await query(sql, params);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', validatePipelineStage, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const allowed = ['name','position','color_hex','is_won','is_lost'];
    const fields = Object.keys(req.body).filter((key) => allowed.includes(key));
    if (!fields.length) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }
    const values = fields.map((key) => req.body[key]);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const sql = `UPDATE pipeline_stages SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`;
    const result = await query(sql, [...values, req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Pipeline stage not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM pipeline_stages WHERE id = $1 RETURNING id, name', [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Pipeline stage not found' });
    }
    res.json({ success: true, deleted: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

export default router;
