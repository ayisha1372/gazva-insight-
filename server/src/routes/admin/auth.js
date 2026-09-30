import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { config } from '../../config.js';
import { query } from '../../db/pool.js';
import { cookieOptions, requireAdmin, signSession } from '../../middleware/auth.js';
import { HttpError, wrap } from '../../middleware/errors.js';

const router = Router();

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;
// Used to burn the same bcrypt time when the email doesn't exist, so response time doesn't reveal valid emails.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many sign-in attempts. Please wait a few minutes and try again.' },
});

const setSession = (res, admin) =>
  res.cookie(config.cookieName, signSession(admin), { ...cookieOptions(), maxAge: config.jwtExpiresHours * 3600 * 1000 });

const publicAdmin = (a) => ({ id: a.id, email: a.email, name: a.name });

router.post('/login', loginLimiter, wrap(async (req, res) => {
  const { email, password } = z.object({ email: z.string().trim().min(1).max(200), password: z.string().min(1).max(200) }).parse(req.body);
  const { rows: [admin] } = await query('SELECT * FROM admins WHERE lower(email) = lower($1)', [email]);

  if (admin?.locked_until && new Date(admin.locked_until) > new Date()) {
    const mins = Math.ceil((new Date(admin.locked_until) - new Date()) / 60000);
    throw new HttpError(429, `Too many failed attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}.`);
  }

  const ok = await bcrypt.compare(password, admin?.password_hash || DUMMY_HASH);
  if (!admin || !ok) {
    if (admin) {
      const attempts = admin.failed_attempts + 1;
      const lock = attempts >= MAX_FAILED;
      await query('UPDATE admins SET failed_attempts = $2, locked_until = $3 WHERE id = $1', [
        admin.id,
        lock ? 0 : attempts, // counter restarts once the lock is applied
        lock ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
      ]);
    }
    throw new HttpError(401, 'Incorrect email or password.');
  }

  await query('UPDATE admins SET failed_attempts = 0, locked_until = NULL, last_login_at = now() WHERE id = $1', [admin.id]);
  setSession(res, admin);
  res.json({ admin: publicAdmin(admin) });
}));

router.post('/logout', (_req, res) => {
  res.clearCookie(config.cookieName, cookieOptions());
  res.json({ ok: true });
});

router.get('/me', requireAdmin, (req, res) => res.json({ admin: publicAdmin(req.admin) }));

router.patch('/me', requireAdmin, wrap(async (req, res) => {
  const { name } = z.object({ name: z.string().trim().min(1, 'Name is required').max(80) }).parse(req.body);
  await query('UPDATE admins SET name = $2 WHERE id = $1', [req.admin.id, name]);
  res.json({ admin: publicAdmin({ ...req.admin, name }) });
}));

router.post('/change-password', requireAdmin, wrap(async (req, res) => {
  const { current, next } = z.object({
    current: z.string().min(1, 'Enter your current password'),
    next: z.string().min(10, 'New password must be at least 10 characters').max(200),
  }).parse(req.body);

  const { rows: [admin] } = await query('SELECT * FROM admins WHERE id = $1', [req.admin.id]);
  if (!(await bcrypt.compare(current, admin.password_hash))) throw new HttpError(400, 'Current password is incorrect.', { current: 'Current password is incorrect.' });
  if (current === next) throw new HttpError(400, 'Choose a different password.', { next: 'Choose a different password.' });

  const hash = await bcrypt.hash(next, 12);
  // bumping token_version signs out every other session; this one gets a fresh cookie
  const { rows: [updated] } = await query('UPDATE admins SET password_hash = $2, token_version = token_version + 1 WHERE id = $1 RETURNING *', [admin.id, hash]);
  setSession(res, updated);
  res.json({ ok: true });
}));

export default router;
