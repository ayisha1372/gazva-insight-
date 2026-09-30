import { Router } from 'express';
import { query } from '../../db/pool.js';
import { wrap } from '../../middleware/errors.js';

const router = Router();

router.get('/', wrap(async (_req, res) => {
  const [counts, recentArticles, recentMessages, byCategory] = await Promise.all([
    query(`SELECT
        (SELECT count(*)::int FROM articles WHERE status = 'published') AS published,
        (SELECT count(*)::int FROM articles WHERE status = 'draft') AS drafts,
        (SELECT count(*)::int FROM categories) AS categories,
        (SELECT count(*)::int FROM media) AS media,
        (SELECT count(*)::int FROM messages WHERE NOT is_read) AS unread,
        (SELECT count(*)::int FROM messages) AS messages`),
    query(`SELECT a.id, a.title, a.status, a.published_at, c.name AS category_name
             FROM articles a JOIN categories c ON c.id = a.category_id ORDER BY a.updated_at DESC LIMIT 5`),
    query(`SELECT id, type, name, subject, message, is_read, created_at FROM messages ORDER BY created_at DESC LIMIT 5`),
    query(`SELECT c.name, count(a.id)::int AS n FROM categories c
             LEFT JOIN articles a ON a.category_id = c.id AND a.status = 'published'
            GROUP BY c.id ORDER BY c.sort_order, c.id`),
  ]);
  res.json({ counts: counts.rows[0], recentArticles: recentArticles.rows, recentMessages: recentMessages.rows, byCategory: byCategory.rows });
}));

export default router;
