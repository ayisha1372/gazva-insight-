import { Router } from 'express';
import { z } from 'zod';
import { query, withTransaction } from '../../db/pool.js';
import { getSettings } from '../public.js';
import { HttpError, wrap } from '../../middleware/errors.js';
import { cleanHtml, cleanText } from '../../utils/sanitize.js';

const router = Router();

/* ───────────── settings groups ───────────── */

const t = (max = 300) => z.string().trim().max(max).default('');
const url = z.string().trim().max(500).refine((v) => v === '' || /^https?:\/\/\S+$/.test(v), 'Must start with http:// or https://').default('');
const link = z.string().trim().max(500).refine((v) => v === '' || v === '#' || /^\/[\w\-./#?=&]*$/.test(v) || /^(https?:\/\/|mailto:|tel:)\S+$/.test(v), 'Use a page like /contact or a full https:// link').default('');
const image = z.string().trim().max(600).refine((v) => v === '' || /^\/uploads\/[\w.-]+$/.test(v) || /^https:\/\/\S+$/.test(v), 'Choose an image from the library').default('');

const SCHEMAS = {
  general: z.object({ site_name: t(80), logo_url: image, logo_alt: t(120) }),
  footer: z.object({ subline: t(120), tagline: t(300), copyright: t(200), powered_by: t(120) }),
  socials: z.object({ instagram: url, facebook: url, whatsapp: url }),
  contact: z.object({
    address_title: t(200), address: t(400),
    emails: z.array(z.object({ label: t(200), mailto: t(200) })).max(6),
    phone_label: t(60), phone_href: link,
    hours: z.array(z.object({ day: t(60), time: t(60) })).max(10),
  }),
  home: z.object({
    meta_title: t(200), meta_description: t(400),
    hero_title: t(80), hero_title_accent: t(80), hero_text: t(500),
    primary_button: z.object({ label: t(60), href: link }),
    secondary_button: z.object({ label: t(60), href: link }),
    section_title: t(120), section_description: t(400),
    latest_count: z.coerce.number().int().min(0).max(12).default(2),
  }),
};

/** Recursively strip markup from every string in a settings document */
const scrub = (v) => (typeof v === 'string' ? cleanText(v) : Array.isArray(v) ? v.map(scrub) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, scrub(x)])) : v);

router.get('/settings', wrap(async (_req, res) => res.json(await getSettings())));

router.put('/settings/:key', wrap(async (req, res) => {
  const schema = SCHEMAS[req.params.key];
  if (!schema) throw new HttpError(404, 'Unknown settings group');
  const value = scrub(schema.parse(req.body));
  await query(
    `INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [req.params.key, JSON.stringify(value)]);
  res.json({ value });
}));

/* ───────────── editable pages (About / Contact banner) ───────────── */

const pageSchema = z.object({
  meta_title: t(200), meta_description: t(400), eyebrow: t(60), title: t(200), description: t(800),
  body: z.string().max(200_000).default(''),
});

router.get('/pages/:slug', wrap(async (req, res) => {
  const { rows: [p] } = await query('SELECT * FROM pages WHERE slug = $1', [req.params.slug]);
  if (!p) throw new HttpError(404, 'Page not found');
  res.json({ item: p });
}));

router.put('/pages/:slug', wrap(async (req, res) => {
  const d = pageSchema.parse(req.body);
  const { rows: [p] } = await query(
    `UPDATE pages SET meta_title=$2, meta_description=$3, eyebrow=$4, title=$5, description=$6, body=$7, updated_at=now()
      WHERE slug=$1 RETURNING *`,
    [req.params.slug, cleanText(d.meta_title), cleanText(d.meta_description), cleanText(d.eyebrow), cleanText(d.title), cleanText(d.description), cleanHtml(d.body)]);
  if (!p) throw new HttpError(404, 'Page not found');
  res.json({ item: p });
}));

/* ───────────── homepage mosaic ───────────── */

router.get('/home-featured', wrap(async (_req, res) => {
  const { rows } = await query(
    `SELECT hf.article_id, hf.size, a.title, a.status, COALESCE(a.card_image, a.cover_image) AS image, c.name AS category_name
       FROM home_featured hf JOIN articles a ON a.id = hf.article_id JOIN categories c ON c.id = a.category_id
      ORDER BY hf.position, hf.id`);
  res.json({ items: rows });
}));

router.put('/home-featured', wrap(async (req, res) => {
  const { items } = z.object({
    items: z.array(z.object({ article_id: z.number().int().positive(), size: z.enum(['lead', 'wide', 'normal']) })).max(12),
  }).parse(req.body);
  if (new Set(items.map((i) => i.article_id)).size !== items.length) throw new HttpError(400, 'Each article can only appear once.');
  await withTransaction(async (db) => {
    await db.query('DELETE FROM home_featured');
    for (const [i, it] of items.entries()) {
      await db.query('INSERT INTO home_featured (article_id, position, size) VALUES ($1,$2,$3)', [it.article_id, i + 1, it.size]);
    }
  });
  res.json({ ok: true });
}));

export default router;
