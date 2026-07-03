import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

const ALLOWED_TABLES = new Set([
  'businesses',
  'users',
  'leads',
  'conversations',
  'ai_sessions',
  'deals',
  'bookings',
  'payments',
  'transactions',
  'notifications',
  'contacts',
  'tags',
  'contact_tags',
  'pipeline_stages',
  'pipeline_entries',
  'activities',
  'notes',
  'tasks',
  'reminders',
  'custom_field_definitions',
  'contact_custom_fields',
  'expense_categories',
  'vendors',
  'recurring_expense_templates',
  'expenses',
  'budgets',
  'budget_alerts',
  'import_batches',
  'imported_raw_lines',
  'mpesa_statements',
  'reconciliation_rules',
  'financial_summaries',
  'cash_flow_forecasts',
  'insight_events',
  'nse_stocks',
  'financial_statements',
  'stock_fundamentals'
]);

const columnsCache = new Map();

const validateResource = (resource) => {
  if (!ALLOWED_TABLES.has(resource)) {
    const err = new Error(`Resource not found: ${resource}`);
    err.status = 404;
    throw err;
  }
  return resource;
};

const getTableColumns = async (table) => {
  if (columnsCache.has(table)) {
    return columnsCache.get(table);
  }
  const result = await query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`,
    [table]
  );
  const columns = result.rows.map((row) => row.column_name);
  columnsCache.set(table, columns);
  return columns;
};

const buildSearchFilter = (queryParams, columns) => {
  const filters = [];
  const values = [];

  Object.entries(queryParams).forEach(([key, value]) => {
    if (['limit', 'offset', 'sort', 'direction'].includes(key)) {
      return;
    }
    if (columns.includes(key)) {
      values.push(value);
      filters.push(`${key} = $${values.length}`);
    }
  });

  return { filters, values };
};

const buildPayload = (payload, columns, ignoreColumns = []) => {
  const keys = Object.keys(payload).filter(
    (key) => columns.includes(key) && !ignoreColumns.includes(key)
  );
  const values = keys.map((key) => payload[key]);
  return { keys, values };
};

router.get('/:resource', async (req, res, next) => {
  try {
    const resource = validateResource(req.params.resource);
    const columns = await getTableColumns(resource);
    const { filters, values } = buildSearchFilter(req.query, columns);
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 1000);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const sortColumn = columns.includes(req.query.sort) ? req.query.sort : columns.includes('created_at') ? 'created_at' : 'id';
    const sortDirection = req.query.direction === 'asc' ? 'ASC' : 'DESC';

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const sql = `SELECT * FROM ${resource} ${whereClause} ORDER BY ${sortColumn} ${sortDirection} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    const result = await query(sql, [...values, limit, offset]);

    res.json({ resource, count: result.rows.length, rows: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get('/:resource/:id', async (req, res, next) => {
  try {
    const resource = validateResource(req.params.resource);
    const result = await query(`SELECT * FROM ${resource} WHERE id = $1`, [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/:resource', async (req, res, next) => {
  try {
    const resource = validateResource(req.params.resource);
    const columns = await getTableColumns(resource);
    const { keys, values } = buildPayload(req.body, columns, ['id']);

    if (!keys.length) {
      return res.status(400).json({ error: 'Request body must contain valid fields to insert' });
    }

    const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
    const sql = `INSERT INTO ${resource} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const result = await query(sql, values);
    const created = result.rows[0];

    if (resource === 'businesses') {
      await query('SELECT seed_system_categories($1)', [created.id]);
      await query('SELECT seed_pipeline_stages($1)', [created.id]);
    }

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

router.put('/:resource/:id', async (req, res, next) => {
  try {
    const resource = validateResource(req.params.resource);
    const columns = await getTableColumns(resource);
    const { keys, values } = buildPayload(req.body, columns, ['id']);

    if (!keys.length) {
      return res.status(400).json({ error: 'Request body must contain valid fields to update' });
    }

    const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
    const sql = `UPDATE ${resource} SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;
    const result = await query(sql, [...values, req.params.id]);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/:resource/:id', async (req, res, next) => {
  try {
    const resource = validateResource(req.params.resource);
    const result = await query(`DELETE FROM ${resource} WHERE id = $1 RETURNING *`, [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json({ success: true, deleted: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

export default router;
