import { Router } from 'express';
import { z } from 'zod';
import { query } from '../../db/pool.js';
import { HttpError, wrap } from '../../middleware/errors.js';
import { cleanHtml, cleanText } from '../../utils/sanitize.js';
import { slugify } from '../../utils/slugify.js';

const router = Router();

// Images must come from the media library (/uploads/...) or be an https URL
const imageUrl = z.string().trim().max(600)
  .refine((v) => v === '' || /^\/uploads\/[\w.-]+$/.test(v) || /^https:\/\/\S+$/.test(v), 'Choose an image from the library or paste an https:// link')
  .nullable().optional();

const schema = z.object({
  title: z.string({ error: 'Title is required' }).trim().min(1, 'Title is required').max(300),
  slug: z.string().trim().max(100).optional().default(''),
  category_id: z.coerce.number({ error: 'Choose a category' }).int().positive('Choose a category'),
  excerpt: z.string().trim().max(2000).default(''),
  body: z.string().max(400_000).default(''),
  cover_image: imageUrl,
  cover_alt: z.string().trim().max(300).nullable().optional(),
  card_image: imageUrl,
  author_name: z.string().trim().max(120).default(''),
  author_role: z.string().trim().max(160).default(''),
  author_avatar: imageUrl,
  label: z.string().trim().max(60).nullable().optional(),
  style: z.enum(['standard', 'poem']).default('standard'),
  show_share: z.boolean().default(true),
  read_time: z.string().trim().max(40).nullable().optional(),
  meta_description: z.string().trim().max(300).nullable().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  published_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a valid date').default(() => new Date().toISOString().slice(0, 10)),
});

const nn = (v) => (v && String(v).trim() ? String(v).trim() : null);

function toColumns(d) {
  return [
    d.category_id, cleanText(d.title), cleanText(d.excerpt), cleanHtml(d.body),
    nn(d.cover_image), nn(cleanText(d.cover_alt || '')), nn(d.card_image),
    cleanText(d.author_name), cleanText(d.author_role), nn(d.author_avatar),
    nn(cleanText(d.label || '')), d.style, d.show_share, nn(cleanText(d.read_time || '')),
    nn(cleanText(d.meta_description || '')), d.status, d.published_at,
  ];
}

async function uniqueSlug(categoryId, base, excludeId = null) {
  let slug = base;
  for (let i = 2; i < 200; i++) {
    const { rowCount } = await query('SELECT 1 FROM articles WHERE category_id=$1 AND slug=$2 AND id <> COALESCE($3, -1)', [categoryId, slug, excludeId]);
    if (!rowCount) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

async function resolveSlug(d, excludeId) {
  if (d.slug) {
    const s = slugify(cleanText(d.slug));
    const { rowCount } = await query('SELECT 1 FROM articles WHERE category_id=$1 AND slug=$2 AND id <> COALESCE($3, -1)', [d.category_id, s, excludeId ?? null]);
    if (rowCount) throw new HttpError(409, 'That URL is already used by another article in this category.', { slug: 'Already used in this category' });
    return s;
  }
  return uniqueSlug(d.category_id, slugify(cleanText(d.title)), excludeId ?? null);
}

router.get('/', wrap(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 15, 1), 100);
  const offset = (Math.max(parseInt(req.query.page, 10) || 1, 1) - 1) * limit;
  const where = [];
  const params = [];
  if (req.query.q) { params.push(`%${String(req.query.q).trim()}%`); where.push(`(a.title ILIKE $${params.length} OR a.author_name ILIKE $${params.length})`); }
  if (req.query.category) { params.push(req.query.category); where.push(`c.slug = $${params.length}`); }
  if (['draft', 'published'].includes(req.query.status)) { params.push(req.query.status); where.push(`a.status = $${params.length}`); }
  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [items, total] = await Promise.all([
    query(`SELECT a.id, a.slug, a.title, a.status, a.published_at, a.author_name, a.updated_at,
                  COALESCE(a.card_image, a.cover_image) AS image, c.name AS category_name, c.slug AS category_slug
             FROM articles a JOIN categories c ON c.id = a.category_id ${w}
            ORDER BY a.published_at DESC, a.id DESC LIMIT ${limit} OFFSET ${offset}`, params),
    query(`SELECT count(*)::int AS n FROM articles a JOIN categories c ON c.id = a.category_id ${w}`, params),
  ]);
  res.json({ items: items.rows, total: total.rows[0].n, page: Math.floor(offset / limit) + 1, limit });
}));

router.get('/:id', wrap(async (req, res) => {
  const { rows: [row] } = await query(
    `SELECT a.*, c.slug AS category_slug FROM articles a JOIN categories c ON c.id = a.category_id WHERE a.id = $1`, [req.params.id]);
  if (!row) throw new HttpError(404, 'Article not found');
  res.json({ item: row });
}));

router.post('/', wrap(async (req, res) => {
  const d = schema.parse(req.body);
  const slug = await resolveSlug(d);
  const { rows: [row] } = await query(
    `INSERT INTO articles (category_id, title, excerpt, body, cover_image, cover_alt, card_image, author_name, author_role,
       author_avatar, label, style, show_share, read_time, meta_description, status, published_at, slug)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING id, slug`,
    [...toColumns(d), slug]);
  res.status(201).json({ item: row });
}));

router.put('/:id', wrap(async (req, res) => {
  const d = schema.parse(req.body);
  const slug = await resolveSlug(d, Number(req.params.id));
  const { rows: [row] } = await query(
    `UPDATE articles SET category_id=$1, title=$2, excerpt=$3, body=$4, cover_image=$5, cover_alt=$6, card_image=$7,
       author_name=$8, author_role=$9, author_avatar=$10, label=$11, style=$12, show_share=$13, read_time=$14,
       meta_description=$15, status=$16, published_at=$17, slug=$18, updated_at=now()
     WHERE id=$19 RETURNING id, slug`,
    [...toColumns(d), slug, req.params.id]);
  if (!row) throw new HttpError(404, 'Article not found');
  res.json({ item: row });
}));

router.patch('/:id/status', wrap(async (req, res) => {
  const { status } = z.object({ status: z.enum(['draft', 'published']) }).parse(req.body);
  const { rowCount } = await query('UPDATE articles SET status=$2, updated_at=now() WHERE id=$1', [req.params.id, status]);
  if (!rowCount) throw new HttpError(404, 'Article not found');
  res.json({ ok: true });
}));

router.delete('/:id', wrap(async (req, res) => {
  const { rowCount } = await query('DELETE FROM articles WHERE id = $1', [req.params.id]);
  if (!rowCount) throw new HttpError(404, 'Article not found');
  res.json({ ok: true });
}));

export default router;
