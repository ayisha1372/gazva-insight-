import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import { z } from 'zod';
import { config } from '../../config.js';
import { query } from '../../db/pool.js';
import { HttpError, wrap } from '../../middleware/errors.js';
import { finalizeUploads, uploadImages } from '../../middleware/upload.js';
import { cleanText } from '../../utils/sanitize.js';

const router = Router();

// How many places a file is referenced (article images, article/page bodies, settings such as the logo)
const USAGE_SQL = `(
  (SELECT count(*) FROM articles a WHERE a.cover_image = '/uploads/' || m.filename OR a.card_image = '/uploads/' || m.filename
      OR a.author_avatar = '/uploads/' || m.filename OR position('/uploads/' || m.filename in a.body) > 0)
  + (SELECT count(*) FROM pages p WHERE position('/uploads/' || m.filename in p.body) > 0)
  + (SELECT count(*) FROM settings s WHERE position('/uploads/' || m.filename in s.value::text) > 0)
)::int`;

const withUrl = (r) => ({ ...r, url: `/uploads/${r.filename}` });

router.get('/', wrap(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 24, 1), 100);
  const offset = (Math.max(parseInt(req.query.page, 10) || 1, 1) - 1) * limit;
  const params = [];
  let where = '';
  if (req.query.q) { params.push(`%${String(req.query.q).trim()}%`); where = `WHERE m.original_name ILIKE $1 OR m.alt ILIKE $1`; }
  const [items, total] = await Promise.all([
    query(`SELECT m.*, ${USAGE_SQL} AS used_in FROM media m ${where} ORDER BY m.created_at DESC, m.id DESC LIMIT ${limit} OFFSET ${offset}`, params),
    query(`SELECT count(*)::int AS n FROM media m ${where}`, params),
  ]);
  res.json({ items: items.rows.map(withUrl), total: total.rows[0].n, page: Math.floor(offset / limit) + 1, limit });
}));

router.post('/', uploadImages, wrap(async (req, res) => {
  const { ok, rejected } = finalizeUploads(req.files);
  if (!ok.length) throw new HttpError(400, rejected.length ? 'Those files are not valid PNG, JPG, GIF or WebP images.' : 'Choose at least one image.');
  const items = [];
  for (const f of ok) {
    const { rows: [row] } = await query(
      'INSERT INTO media (filename, original_name, mime, size) VALUES ($1,$2,$3,$4) RETURNING *', [f.filename, f.original_name, f.mime, f.size]);
    items.push(withUrl({ ...row, used_in: 0 }));
  }
  res.status(201).json({ items, rejected });
}));

router.patch('/:id', wrap(async (req, res) => {
  const { alt } = z.object({ alt: z.string().trim().max(300) }).parse(req.body);
  const { rows: [row] } = await query('UPDATE media SET alt = $2 WHERE id = $1 RETURNING *', [req.params.id, cleanText(alt)]);
  if (!row) throw new HttpError(404, 'Image not found');
  res.json({ item: withUrl(row) });
}));

router.delete('/:id', wrap(async (req, res) => {
  const { rows: [m] } = await query(`SELECT m.*, ${USAGE_SQL} AS used_in FROM media m WHERE m.id = $1`, [req.params.id]);
  if (!m) throw new HttpError(404, 'Image not found');
  if (m.used_in > 0 && req.query.force !== 'true') {
    throw new HttpError(409, `This image is used in ${m.used_in} place${m.used_in === 1 ? '' : 's'} on the site. Deleting it would leave broken images.`);
  }
  await query('DELETE FROM media WHERE id = $1', [m.id]);
  const file = path.join(config.uploadDir, path.basename(m.filename)); // basename: never escape the uploads folder
  fs.unlink(file, () => {});
  res.json({ ok: true });
}));

export default router;
