import { Router } from 'express';
import { z } from 'zod';
import { query, withTransaction } from '../../db/pool.js';
import { HttpError, wrap } from '../../middleware/errors.js';
import { cleanText } from '../../utils/sanitize.js';
import { slugify } from '../../utils/slugify.js';

const router = Router();

// These would collide with real site/app routes
const RESERVED = ['admin', 'api', 'uploads', 'about', 'contact', 'assets', 'pages', 'login'];

const schema = z.object({
  name: z.string({ error: 'Name is required' }).trim().min(1, 'Name is required').max(80),
  slug: z.string().trim().max(60).optional().default(''),
  color: z.string().trim().regex(/^(#[0-9a-fA-F]{6})?$/, 'Use a hex colour like #1B7A6E').nullable().optional(),
  banner_title: z.string().trim().max(200).default(''),
  banner_description: z.string().trim().max(600).default(''),
  meta_description: z.string().trim().max(300).default(''),
  show_in_nav: z.boolean().default(true),
});

function finalSlug(input, name) {
  const slug = slugify(cleanText(input || name)).replace(/[^a-z0-9-]/g, '') || slugify(cleanText(name)).replace(/[^a-z0-9-]/g, '');
  if (!slug) throw new HttpError(400, 'Please enter a URL slug using letters and numbers.', { slug: 'Use letters, numbers and hyphens' });
  if (RESERVED.includes(slug)) throw new HttpError(400, `"${slug}" is reserved.`, { slug: `"${slug}" is reserved` });
  return slug;
}

router.get('/', wrap(async (_req, res) => {
  const { rows } = await query(
    `SELECT c.*, (SELECT count(*)::int FROM articles a WHERE a.category_id = c.id) AS article_count
       FROM categories c ORDER BY c.sort_order, c.id`);
  res.json({ items: rows });
}));

router.post('/', wrap(async (req, res) => {
  const d = schema.parse(req.body);
  const slug = finalSlug(d.slug, d.name);
  const { rows: [row] } = await query(
    `INSERT INTO categories (slug, name, color, banner_title, banner_description, meta_description, show_in_nav, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7, COALESCE((SELECT max(sort_order) FROM categories), 0) + 1) RETURNING *`,
    [slug, cleanText(d.name), d.color || null, cleanText(d.banner_title), cleanText(d.banner_description), cleanText(d.meta_description), d.show_in_nav]);
  res.status(201).json({ item: row });
}));

router.put('/reorder', wrap(async (req, res) => {
  const { ids } = z.object({ ids: z.array(z.number().int()).min(1) }).parse(req.body);
  await withTransaction(async (db) => {
    for (const [i, id] of ids.entries()) await db.query('UPDATE categories SET sort_order = $2 WHERE id = $1', [id, i + 1]);
  });
  res.json({ ok: true });
}));

router.put('/:id', wrap(async (req, res) => {
  const d = schema.parse(req.body);
  const slug = finalSlug(d.slug, d.name);
  const { rows: [row] } = await query(
    `UPDATE categories SET slug=$2, name=$3, color=$4, banner_title=$5, banner_description=$6, meta_description=$7,
            show_in_nav=$8, updated_at=now() WHERE id=$1 RETURNING *`,
    [req.params.id, slug, cleanText(d.name), d.color || null, cleanText(d.banner_title), cleanText(d.banner_description), cleanText(d.meta_description), d.show_in_nav]);
  if (!row) throw new HttpError(404, 'Category not found');
  res.json({ item: row });
}));

router.delete('/:id', wrap(async (req, res) => {
  const { rows: [{ n }] } = await query('SELECT count(*)::int AS n FROM articles WHERE category_id = $1', [req.params.id]);
  if (n > 0) throw new HttpError(409, `This category still has ${n} article${n === 1 ? '' : 's'}. Move or delete them first.`);
  const { rowCount } = await query('DELETE FROM categories WHERE id = $1', [req.params.id]);
  if (!rowCount) throw new HttpError(404, 'Category not found');
  res.json({ ok: true });
}));

export default router;
