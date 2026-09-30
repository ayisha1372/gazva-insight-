import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SERVER_ROOT = path.resolve(__dirname, '..');
export const PROJECT_ROOT = path.resolve(SERVER_ROOT, '..');

const env = process.env;
const isProd = env.NODE_ENV === 'production';

function fail(msg) {
  console.error(`\n[config] ${msg}\n`);
  process.exit(1);
}

const jwtSecret = env.JWT_SECRET || '';
if (!jwtSecret || jwtSecret.length < 32 || /change[-_ ]?me/i.test(jwtSecret)) {
  fail(
    'JWT_SECRET is missing, too short (min 32 chars) or still the placeholder.\n' +
      'Generate one with:  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"\n' +
      'and put it in server/.env'
  );
}

const hasDbUrl = !!env.DATABASE_URL;
if (!hasDbUrl && !(env.DB_NAME && env.DB_USER)) {
  fail('Database is not configured. Set DATABASE_URL, or DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD in server/.env');
}

export const config = {
  isProd,
  port: Number(env.PORT || 5000),
  trustProxy: env.TRUST_PROXY ? Number(env.TRUST_PROXY) || env.TRUST_PROXY : false,
  clientOrigin: env.CLIENT_ORIGIN || '',
  siteUrl: (env.SITE_URL || '').replace(/\/$/, ''),

  db: hasDbUrl
    ? { connectionString: env.DATABASE_URL }
    : {
        host: env.DB_HOST || 'localhost',
        port: Number(env.DB_PORT || 5432),
        database: env.DB_NAME,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
      },
  dbSsl: env.DB_SSL === 'true',

  jwtSecret,
  jwtExpiresHours: Number(env.JWT_EXPIRES_HOURS || 12),
  cookieName: 'gazva_admin',
  cookieSecure: env.COOKIE_SECURE ? env.COOKIE_SECURE === 'true' : isProd,

  uploadDir: path.resolve(SERVER_ROOT, env.UPLOAD_DIR || 'uploads'),
  maxUploadMb: Number(env.MAX_UPLOAD_MB || 8),

  clientDist: path.resolve(PROJECT_ROOT, 'client', 'dist'),

  seedAdmin: { email: env.ADMIN_EMAIL || '', password: env.ADMIN_PASSWORD || '', name: env.ADMIN_NAME || 'Admin' },

  smtp: {
    host: env.SMTP_HOST || '',
    port: Number(env.SMTP_PORT || 587),
    secure: env.SMTP_SECURE === 'true',
    user: env.SMTP_USER || '',
    pass: env.SMTP_PASS || '',
    from: env.SMTP_FROM || env.SMTP_USER || '',
    notifyTo: env.NOTIFY_EMAIL || '',
  },
};
