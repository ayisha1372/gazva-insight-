import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { query } from '../db/pool.js';
import { getSettings } from '../routes/public.js';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

let indexHtml = null;
export function loadIndexHtml() {
  if (!indexHtml) indexHtml = fs.readFileSync(path.join(config.clientDist, 'index.html'), 'utf8');
  return indexHtml;
}

const abs = (origin, p) => (!p ? '' : /^https?:\/\//.test(p) ? p : origin + p);

/**
 * The React app sets titles itself, but link scrapers (WhatsApp, Facebook, search bots) don't run JS.
 * So the server writes the right <title>/description/Open Graph tags into index.html for public pages.
 */
export async function metaFor(pathname, origin) {
  const settings = await getSettings();
  let meta = { title: settings.home.meta_title, description: settings.home.meta_description, image: settings.general.logo_url, type: 'website' };
  const parts = pathname.split('/').filter(Boolean).map(decodeURIComponent);

  if (parts.length === 1 && ['about', 'contact'].includes(parts[0])) {
    const { rows: [p] } = await query('SELECT meta_title, meta_description FROM pages WHERE slug = $1', [parts[0]]);
    if (p) meta = { ...meta, title: p.meta_title || meta.title, description: p.meta_description || meta.description };
  } else if (parts.length === 1) {
    const { rows: [c] } = await query('SELECT name, meta_description FROM categories WHERE slug = $1', [parts[0]]);
    if (c) meta = { ...meta, title: `${c.name} — Gazva Insights`, description: c.meta_description || meta.description };
  } else if (parts.length === 2) {
    const { rows: [a] } = await query(
      `SELECT a.title, a.excerpt, a.meta_description, COALESCE(a.cover_image, a.card_image) AS image
         FROM articles a JOIN categories c ON c.id = a.category_id
        WHERE c.slug = $1 AND a.slug = $2 AND a.status = 'published'`, parts);
    if (a) {
      const excerpt = a.excerpt.length > 200 ? a.excerpt.slice(0, 199) + '…' : a.excerpt;
      meta = { title: `${a.title} — Gazva Insights`, description: a.meta_description || excerpt || meta.description, image: a.image || meta.image, type: 'article' };
    }
  }
  return { ...meta, image: abs(origin, meta.image), url: origin + pathname };
}

export function renderIndex(meta) {
  const tags = [
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<meta property="og:site_name" content="GAZVA Insight" />`,
    `<meta property="og:type" content="${meta.type}" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:url" content="${esc(meta.url)}" />`,
    meta.image ? `<meta property="og:image" content="${esc(meta.image)}" />` : '',
    `<meta name="twitter:card" content="${meta.image ? 'summary_large_image' : 'summary'}" />`,
  ].filter(Boolean).join('\n    ');
  return loadIndexHtml()
    .replace(/<title>.*?<\/title>/s, `<title>${esc(meta.title)}</title>`)
    .replace('<!--app-meta-->', tags);
}
