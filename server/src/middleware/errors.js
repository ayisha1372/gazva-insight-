import multer from 'multer';
import { ZodError } from 'zod';
import { config } from '../config.js';

export class HttpError extends Error {
  constructor(status, message, fields) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

/** Wrap async route handlers so rejected promises reach the error middleware (Express 4). */
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function notFound(_req, res) {
  res.status(404).json({ error: 'Not found' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError) {
    const fields = {};
    for (const issue of err.issues) fields[issue.path.join('.') || '_'] ??= issue.message;
    return res.status(400).json({ error: 'Please check the highlighted fields.', fields });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, fields: err.fields });
  }
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? `Image is larger than ${config.maxUploadMb} MB.` : err.message;
    return res.status(400).json({ error: msg });
  }
  if (err?.code === '23505') return res.status(409).json({ error: 'That value is already in use (duplicate slug or email).' });
  if (err?.code === '23503') return res.status(409).json({ error: 'This item is still referenced by other content.' });
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON.' });
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Request is too large.' });

  console.error('[error]', req.method, req.originalUrl, err);
  res.status(500).json({ error: config.isProd ? 'Something went wrong on our side.' : err.message });
}
