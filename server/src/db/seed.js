/**
 * Seeds the database with the content of the original static site.
 * Safe to re-run: it only inserts what is missing and never overwrites edits made in the admin panel.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { config, SERVER_ROOT } from '../config.js';
import { pool, withTransaction } from './pool.js';
import { SETTING_DEFAULTS } from './defaults.js';
import { cleanHtml } from '../utils/sanitize.js';
import { sniffImage } from '../middleware/upload.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const content = JSON.parse(fs.readFileSync(path.join(SERVER_ROOT, 'seed-data', 'content.json'), 'utf8'));
const assetsDir = path.join(SERVER_ROOT, 'seed-assets');

const asUpload = (v) => (v && !/^https?:\/\//.test(v) ? `/uploads/${v}` : v || null);

try {
  await withTransaction(async (db) => {
    // ── images → uploads folder + media library ──
    fs.mkdirSync(config.uploadDir, { recursive: true });
    for (const file of fs.readdirSync(assetsDir)) {
      const src = path.join(assetsDir, file);
      const dest = path.join(config.uploadDir, file);
      if (!fs.existsSync(dest)) fs.copyFileSync(src, dest);
      const stat = fs.statSync(src);
      const type = sniffImage(fs.readFileSync(src).subarray(0, 16));
      await db.query(
        `INSERT INTO media (filename, original_name, mime, size, alt) VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (filename) DO NOTHING`,
        [file, file, type?.mime || 'image/png', stat.size, file.startsWith('logo') ? SETTING_DEFAULTS.general.logo_alt : '']
      );
    }

    // ── categories ──
    for (const c of content.categories) {
      await db.query(
        `INSERT INTO categories (slug, name, banner_title, banner_description, meta_description, sort_order, show_in_nav)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (slug) DO NOTHING`,
        [c.slug, c.name, c.banner_title, c.banner_description, c.meta_description, c.sort_order, c.show_in_nav]
      );
    }
    const cats = Object.fromEntries((await db.query('SELECT id, slug FROM categories')).rows.map((r) => [r.slug, r.id]));

    // ── articles ──
    for (const a of content.articles) {
      await db.query(
        `INSERT INTO articles (category_id, slug, title, excerpt, body, cover_image, cover_alt, card_image,
           author_name, author_role, author_avatar, label, style, show_share, read_time, meta_description, status, published_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
         ON CONFLICT (category_id, slug) DO NOTHING`,
        [
          cats[a.category], a.slug, a.title, a.excerpt, cleanHtml(a.body),
          asUpload(a.cover_image), a.cover_alt, asUpload(a.card_image),
          a.author_name, a.author_role, a.author_avatar, a.label, a.style, a.show_share,
          a.read_time, a.meta_description, a.status, a.published_at,
        ]
      );
    }

    // ── homepage mosaic: same three real cards the original home page linked to ──
    const { rows: [{ n }] } = await db.query('SELECT count(*)::int AS n FROM home_featured');
    if (n === 0) {
      const order = [['samastha', 'siyar', 'lead'], ['shaikhuna', 'ahkaam', 'wide'], ['arbmlm', 'meetthescholar', 'normal']];
      let pos = 1;
      for (const [slug, cat, size] of order) {
        await db.query(
          `INSERT INTO home_featured (article_id, position, size)
           SELECT id, $1, $2 FROM articles WHERE slug = $3 AND category_id = $4 ON CONFLICT DO NOTHING`,
          [pos++, size, slug, cats[cat]]
        );
      }
    }

    // ── settings + pages ──
    for (const [key, value] of Object.entries(SETTING_DEFAULTS)) {
      await db.query('INSERT INTO settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO NOTHING', [key, JSON.stringify(value)]);
    }
    for (const p of content.pages) {
      await db.query(
        `INSERT INTO pages (slug, meta_title, meta_description, eyebrow, title, description, body)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (slug) DO NOTHING`,
        [p.slug, p.meta_title, p.meta_description, p.eyebrow, p.title, p.description, cleanHtml(p.body)]
      );
    }
  });
  console.log('✔ Content seeded (categories, articles, images, homepage, settings, pages).');

  // ── first admin, from .env (never a default password) ──
  const { rows: [{ count }] } = await pool.query('SELECT count(*)::int AS count FROM admins');
  if (count === 0) {
    const { email, password, name } = config.seedAdmin;
    if (!email || !password) {
      console.log('ℹ No admin created: set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env and run "npm run db:seed" again,\n  or run "npm run admin:create".');
    } else if (password.length < 10) {
      console.error('✖ ADMIN_PASSWORD must be at least 10 characters. Admin not created.');
      process.exitCode = 1;
    } else {
      const hash = await bcrypt.hash(password, 12);
      await pool.query('INSERT INTO admins (email, name, password_hash) VALUES ($1,$2,$3)', [email.trim().toLowerCase(), name, hash]);
      console.log(`✔ Admin created: ${email}   (remove ADMIN_PASSWORD from .env now)`);
    }
  } else {
    console.log('ℹ An admin already exists — left unchanged.');
  }
} catch (err) {
  console.error('✖ Seeding failed:', err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
