import { Router } from 'express';
import { z } from 'zod';
import { query } from '../../db/pool.js';
import { HttpError, wrap } from '../../middleware/errors.js';

const router = Router();

router.get('/', wrap(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const offset = (Math.max(parseInt(req.query.page, 10) || 1, 1) - 1) * limit;
  const where = [];
  const params = [];
  if (['contact', 'question', 'comment'].includes(req.query.type)) { params.push(req.query.type); where.push(`type = $${params.length}`); }
  if (req.query.status === 'unread') where.push('is_read = FALSE');
  if (req.query.status === 'read') where.push('is_read = TRUE');
  if (req.query.q) {
    params.push(`%${String(req.query.q).trim()}%`);
    where.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length} OR subject ILIKE $${params.length} OR message ILIKE $${params.length})`);
  }
  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [items, total, counts] = await Promise.all([
    query(`SELECT * FROM messages ${w} ORDER BY created_at DESC, id DESC LIMIT ${limit} OFFSET ${offset}`, params),
    query(`SELECT count(*)::int AS n FROM messages ${w}`, params),
    query(`SELECT type, count(*) FILTER (WHERE NOT is_read)::int AS unread, count(*)::int AS total FROM messages GROUP BY type`),
  ]);
  const summary = { contact: { unread: 0, total: 0 }, question: { unread: 0, total: 0 }, comment: { unread: 0, total: 0 } };
  for (const r of counts.rows) summary[r.type] = { unread: r.unread, total: r.total };
  res.json({ items: items.rows, total: total.rows[0].n, page: Math.floor(offset / limit) + 1, limit, summary });
}));

router.post('/mark-all-read', wrap(async (req, res) => {
  const { type } = z.object({ type: z.enum(['contact', 'question', 'comment']).optional() }).parse(req.body || {});
  const { rowCount } = type
    ? await query('UPDATE messages SET is_read = TRUE WHERE is_read = FALSE AND type = $1', [type])
    : await query('UPDATE messages SET is_read = TRUE WHERE is_read = FALSE');
  res.json({ updated: rowCount });
}));

router.patch('/:id', wrap(async (req, res) => {
  const { is_read } = z.object({ is_read: z.boolean() }).parse(req.body);
  const { rows: [row] } = await query('UPDATE messages SET is_read = $2 WHERE id = $1 RETURNING *', [req.params.id, is_read]);
  if (!row) throw new HttpError(404, 'Message not found');
  res.json({ item: row });
}));

router.delete('/:id', wrap(async (req, res) => {
  const { rowCount } = await query('DELETE FROM messages WHERE id = $1', [req.params.id]);
  if (!rowCount) throw new HttpError(404, 'Message not found');
  res.json({ ok: true });
}));

export default router;
