import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { query } from '../db/pool.js';

export const cookieOptions = () => ({
  httpOnly: true,
  secure: config.cookieSecure,
  sameSite: 'strict',
  path: '/',
});

export function signSession(admin) {
  return jwt.sign({ sub: admin.id, tv: admin.token_version }, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: `${config.jwtExpiresHours}h`,
  });
}

async function adminFromRequest(req) {
  const token = req.cookies?.[config.cookieName];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    const { rows } = await query('SELECT id, email, name, token_version FROM admins WHERE id = $1', [payload.sub]);
    const admin = rows[0];
    if (!admin || admin.token_version !== payload.tv) return null;
    return admin;
  } catch {
    return null;
  }
}

/** Blocks the request unless a valid admin session cookie is present. */
export async function requireAdmin(req, res, next) {
  const admin = await adminFromRequest(req);
  if (!admin) {
    res.clearCookie(config.cookieName, cookieOptions());
    return res.status(401).json({ error: 'Please sign in to continue.' });
  }
  req.admin = admin;
  next();
}

/** Attaches req.admin if signed in, but never blocks (used for draft previews on public routes). */
export async function optionalAdmin(req, _res, next) {
  req.admin = await adminFromRequest(req);
  next();
}

/**
 * CSRF defence for cookie auth, on top of SameSite=Strict:
 * state-changing requests must carry a custom header (which browsers will not send
 * cross-site without a CORS preflight, and this API does not allow any) and, if an
 * Origin header is present, it must match this host.
 */
export function csrfGuard(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('X-Requested-With') !== 'gazva-admin') {
    return res.status(403).json({ error: 'Blocked: missing request header.' });
  }
  const origin = req.get('Origin');
  if (origin) {
    let ok = false;
    try {
      const o = new URL(origin);
      ok = o.host === req.get('Host') || (config.clientOrigin && origin === config.clientOrigin);
    } catch { /* invalid origin -> not ok */ }
    if (!ok) return res.status(403).json({ error: 'Blocked: cross-origin request.' });
  }
  next();
}
