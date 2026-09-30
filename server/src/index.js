import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { pool } from './db/pool.js';
import { csrfGuard, requireAdmin } from './middleware/auth.js';
import { errorHandler, notFound, wrap } from './middleware/errors.js';
import publicRoutes from './routes/public.js';
import authRoutes from './routes/admin/auth.js';
import dashboardRoutes from './routes/admin/dashboard.js';
import articleRoutes from './routes/admin/articles.js';
import categoryRoutes from './routes/admin/categories.js';
import mediaRoutes from './routes/admin/media.js';
import messageRoutes from './routes/admin/messages.js';
import siteRoutes from './routes/admin/site.js';
import { loadIndexHtml, metaFor, renderIndex } from './utils/seo.js';

const app = express();
app.disable('x-powered-by');
if (config.trustProxy) app.set('trust proxy', config.trustProxy);

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
        'img-src': ["'self'", 'data:', 'https:'],
        'connect-src': ["'self'"],
        'frame-ancestors': ["'none'"],
        'object-src': ["'none'"],
        // only force https when cookies are secure, so a local production build still works over http
        'upgrade-insecure-requests': config.cookieSecure ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-site' },
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

// Uploaded images (random filenames → safe to cache for a year)
app.use('/uploads', express.static(config.uploadDir, { maxAge: '365d', immutable: true, index: false, dotfiles: 'ignore' }));

/* ─────────── API ─────────── */
app.get('/api/health', wrap(async (_req, res) => { await pool.query('SELECT 1'); res.json({ ok: true }); }));
app.use('/api/admin', csrfGuard);
app.use('/api/admin/auth', authRoutes);
app.use('/api/admin/dashboard', requireAdmin, dashboardRoutes);
app.use('/api/admin/articles', requireAdmin, articleRoutes);
app.use('/api/admin/categories', requireAdmin, categoryRoutes);
app.use('/api/admin/media', requireAdmin, mediaRoutes);
app.use('/api/admin/messages', requireAdmin, messageRoutes);
app.use('/api/admin/site', requireAdmin, siteRoutes);
app.use('/api', publicRoutes);
app.use('/api', notFound);

/* ─────────── Website (production: serve the React build) ─────────── */

// Old static URLs (e.g. /ahkaam/shaikhuna.html, /tadabbur.html, /index.html) keep working
app.get(/^\/(.*)\.html$/, (req, res) => {
  const target = '/' + req.params[0].replace(/^index$/, '');
  res.redirect(301, target === '/' ? '/' : target);
});

const hasBuild = fs.existsSync(path.join(config.clientDist, 'index.html'));
if (hasBuild) {
  app.use(express.static(config.clientDist, { index: false, maxAge: '1h', setHeaders: (res, p) => { if (/[\\/]assets[\\/]/.test(p)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); } }));
  loadIndexHtml();
  app.get('*', wrap(async (req, res) => {
    const origin = config.siteUrl || `${req.protocol}://${req.get('host')}`;
    const meta = await metaFor(req.path, origin).catch(() => null);
    res.type('html').send(meta ? renderIndex(meta) : loadIndexHtml());
  }));
} else {
  app.get('/', (_req, res) => res.type('text').send('GAZVA Insight API is running. In development open the Vite site (npm run dev) — for production run "npm run build" first.'));
}

app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`✔ GAZVA Insight ${config.isProd ? '(production)' : '(development)'} on http://localhost:${config.port}${hasBuild ? '' : '  — API only, no client build found'}`);
});

const shutdown = () => server.close(() => pool.end().then(() => process.exit(0)));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
