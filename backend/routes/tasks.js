import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../db/index.js';

const router = express.Router();

const validateTask = [
  body('business_id').isUUID().withMessage('business_id is required and must be a UUID'),
  body('title').trim().notEmpty().withMessage('title is required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('status').optional().isIn(['todo', 'in_progress', 'done', 'cancelled']),
  body('assigned_to').optional().isUUID(),
  body('created_by').optional().isUUID(),
  body('due_at').optional().isISO8601(),
  body('completed_at').optional().isISO8601()
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

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const sql = `SELECT * FROM tasks ${whereClause} ORDER BY created_at DESC LIMIT 200`;
    const result = await query(sql, values);
    res.json({ count: result.rows.length, tasks: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/', validateTask, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const {
      contact_id,
      deal_id,
      business_id,
      assigned_to,
      created_by,
      title,
      description,
      priority = 'medium',
      status = 'todo',
      due_at,
      completed_at
    } = req.body;

    const sql = `INSERT INTO tasks (contact_id, deal_id, business_id, assigned_to, created_by, title, description, priority, status, due_at, completed_at)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`;
    const params = [contact_id, deal_id, business_id, assigned_to, created_by, title, description, priority, status, due_at, completed_at];
    const result = await query(sql, params);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', validateTask, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const allowed = [
      'contact_id','deal_id','assigned_to','created_by','title','description','priority','status','due_at','completed_at'
    ];
    const fields = Object.keys(req.body).filter((key) => allowed.includes(key));

    if (!fields.length) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    const values = fields.map((key) => req.body[key]);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const sql = `UPDATE tasks SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`;
    const result = await query(sql, [...values, req.params.id]);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM tasks WHERE id = $1 RETURNING id, title', [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ success: true, deleted: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

export default router;
