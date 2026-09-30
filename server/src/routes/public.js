import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { SETTING_DEFAULTS } from '../db/defaults.js';
import { optionalAdmin } from '../middleware/auth.js';
import { HttpError, wrap } from '../middleware/errors.js';
import { cleanText } from '../utils/sanitize.js';
import { notifyNewMessage } from '../utils/notify.js';

const router = Router();

/* ───────────── helpers ───────────── */

const CARD_COLUMNS = `a.id, a.slug, a.title, a.excerpt, COALESCE(a.card_image, a.cover_image) AS image,
  a.author_name, a.published_at, a.label,
  c.slug AS category_slug, c.name AS category_name, c.color AS category_color`;

const toCard = (r) => ({
  id: r.id, slug: r.slug, title: r.title, excerpt: r.excerpt, image: r.image,
  author_name: r.author_name, published_at: r.published_at, label: r.label,
  category: { slug: r.category_slug, name: r.category_name, color: r.category_color },
});

export async function getSettings() {
  const { rows } = await query('SELECT key, value FROM settings');
  const out = {};
  for (const key of Object.keys(SETTING_DEFAULTS)) {
    const stored = rows.find((r) => r.key === key)?.value || {};
    out[key] = { ...SETTING_DEFAULTS[key], ...stored };
  }
  return out;
}

const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many messages sent from this connection. Please try again in a little while.' },
});

/* ───────────── read endpoints ───────────── */

router.get('/site', wrap(async (_req, res) => {
  const [settings, cats] = await Promise.all([
    getSettings(),
    query('SELECT slug, name, color, show_in_nav FROM categories ORDER BY sort_order, id'),
  ]);
  res.json({ ...settings, categories: cats.rows });
}));

router.get('/home', wrap(async (_req, res) => {
  const settings = await getSettings();
  const featured = await query(
    `SELECT hf.size, ${CARD_COLUMNS}
       FROM home_featured hf
       JOIN articles a ON a.id = hf.article_id AND a.status = 'published'
       JOIN categories c ON c.id = a.category_id
      ORDER BY hf.position, hf.id`
  );
  const n = Math.max(0, Math.min(12, Number(settings.home.latest_count) || 0));
  let latest = [];
  if (n > 0) {
    const ids = featured.rows.map((r) => r.id);
    const run = (excludeIds) => query(
      `SELECT ${CARD_COLUMNS} FROM articles a JOIN categories c ON c.id = a.category_id
        WHERE a.status = 'published' AND NOT (a.id = ANY($1::int[]))
        ORDER BY a.published_at DESC, a.id DESC LIMIT $2`, [excludeIds, n]);
    latest = (await run(ids)).rows;
    if (!latest.length) latest = (await run([])).rows; // everything is featured -> fall back to newest overall
  }
  res.json({
    featured: featured.rows.map((r) => ({ size: r.size, article: toCard(r) })),
    latest: latest.map(toCard),
  });
}));

router.get('/categories/:slug', wrap(async (req, res) => {
  const { rows: [category] } = await query(
    `SELECT slug, name, color, banner_title, banner_description, meta_description FROM categories WHERE slug = $1`, [req.params.slug]);
  if (!category) throw new HttpError(404, 'Category not found');

  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 4, 1), 50);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
  const [items, total] = await Promise.all([
    query(
      `SELECT ${CARD_COLUMNS} FROM articles a JOIN categories c ON c.id = a.category_id
        WHERE c.slug = $1 AND a.status = 'published'
        ORDER BY a.published_at DESC, a.id DESC LIMIT $2 OFFSET $3`, [req.params.slug, limit, offset]),
    query(`SELECT count(*)::int AS n FROM articles a JOIN categories c ON c.id = a.category_id
            WHERE c.slug = $1 AND a.status = 'published'`, [req.params.slug]),
  ]);
  res.json({ category, items: items.rows.map(toCard), total: total.rows[0].n });
}));

router.get('/articles/:category/:slug', optionalAdmin, wrap(async (req, res) => {
  const preview = req.query.preview === '1' && !!req.admin;
  const { rows: [r] } = await query(
    `SELECT a.id, a.slug, a.title, a.excerpt, a.body, a.cover_image, a.cover_alt, a.author_name, a.author_role,
            a.author_avatar, a.label, a.style, a.show_share, a.read_time, a.meta_description, a.published_at, a.status,
            c.slug AS category_slug, c.name AS category_name, c.color AS category_color
       FROM articles a JOIN categories c ON c.id = a.category_id
      WHERE c.slug = $1 AND a.slug = $2 ${preview ? '' : "AND a.status = 'published'"}`,
    [req.params.category, req.params.slug]);
  if (!r) throw new HttpError(404, 'Article not found');
  const { category_slug, category_name, category_color, ...article } = r;
  res.json({ ...article, category: { slug: category_slug, name: category_name, color: category_color } });
}));

router.get('/pages/:slug', wrap(async (req, res) => {
  const { rows: [page] } = await query('SELECT slug, meta_title, meta_description, eyebrow, title, description, body FROM pages WHERE slug = $1', [req.params.slug]);
  if (!page) throw new HttpError(404, 'Page not found');
  res.json(page);
}));

/* ───────────── visitor submissions ───────────── */

const text = (max, label) => z.string({ error: `${label} is required` }).trim().min(1, `${label} is required`).max(max, `${label} is too long`);
const email = z.string({ error: 'Email is required' }).trim().max(200).regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address');
const honeypot = z.string().optional(); // hidden field; real people leave it empty

const contactSchema = z.object({
  firstName: text(80, 'First name'),
  lastName: z.string().trim().max(80).optional().default(''),
  email,
  phone: z.string().trim().max(40).optional().default(''),
  subject: text(300, 'Subject'),
  message: text(5000, 'Message'),
  website: honeypot,
});
const questionSchema = z.object({
  name: text(120, 'Name'),
  email,
  subject: text(300, 'Subject'),
  category: text(80, 'Category'),
  question: text(5000, 'Question'),
  website: honeypot,
});
const commentSchema = z.object({
  article_id: z.coerce.number().int().positive(),
  name: text(120, 'Name'),
  email,
  message: text(3000, 'Comment'),
  website: honeypot,
});

async function store(m) {
  const { rows: [saved] } = await query(
    `INSERT INTO messages (type, name, email, phone, subject, category, message, article_id, article_title)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [m.type, cleanText(m.name), m.email, m.phone ? cleanText(m.phone) : null, m.subject ? cleanText(m.subject) : null,
     m.category ? cleanText(m.category) : null, cleanText(m.message), m.article_id ?? null, m.article_title ?? null]
  );
  notifyNewMessage(saved); // fire and forget
}

router.post('/contact', formLimiter, wrap(async (req, res) => {
  const d = contactSchema.parse(req.body);
  if (d.website) return res.json({ ok: true }); // bot: pretend success, store nothing
  await store({ type: 'contact', name: `${d.firstName} ${d.lastName}`.trim(), email: d.email, phone: d.phone, subject: d.subject, message: d.message });
  res.status(201).json({ ok: true });
}));

router.post('/questions', formLimiter, wrap(async (req, res) => {
  const d = questionSchema.parse(req.body);
  if (d.website) return res.json({ ok: true });
  await store({ type: 'question', name: d.name, email: d.email, subject: d.subject, category: d.category, message: d.question });
  res.status(201).json({ ok: true });
}));

router.post('/comments', formLimiter, wrap(async (req, res) => {
  const d = commentSchema.parse(req.body);
  if (d.website) return res.json({ ok: true });
  const { rows: [article] } = await query(`SELECT id, title FROM articles WHERE id = $1 AND status = 'published'`, [d.article_id]);
  if (!article) throw new HttpError(404, 'Article not found');
  await store({ type: 'comment', name: d.name, email: d.email, message: d.message, article_id: article.id, article_title: article.title });
  res.status(201).json({ ok: true });
}));

export default router;
