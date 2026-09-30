import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { config } from '../config.js';
import { HttpError } from './errors.js';

fs.mkdirSync(config.uploadDir, { recursive: true });

/** Detect the real image type from the file's first bytes; never trust the client-sent MIME type or extension. */
export function sniffImage(buf) {
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: 'image/png', ext: '.png' };
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: 'image/jpeg', ext: '.jpg' };
  if (buf.length >= 6 && ['GIF87a', 'GIF89a'].includes(buf.subarray(0, 6).toString('ascii'))) return { mime: 'image/gif', ext: '.gif' };
  if (buf.length >= 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return { mime: 'image/webp', ext: '.webp' };
  return null;
}

const upload = multer({
  storage: multer.diskStorage({
    destination: config.uploadDir,
    filename: (_req, _file, cb) => cb(null, `tmp-${crypto.randomUUID()}`),
  }),
  limits: { fileSize: config.maxUploadMb * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(png|jpe?g|gif|webp)$/.test(file.mimetype)) {
      return cb(new HttpError(400, 'Only PNG, JPG, GIF or WebP images are allowed.'));
    }
    cb(null, true);
  },
});

export const uploadImages = upload.array('files', 10);

/** After multer: verify magic bytes, give each file its final random name, return descriptors. */
export function finalizeUploads(files = []) {
  const ok = [];
  const rejected = [];
  for (const f of files) {
    const fd = fs.openSync(f.path, 'r');
    const head = Buffer.alloc(16);
    fs.readSync(fd, head, 0, 16, 0);
    fs.closeSync(fd);
    const type = sniffImage(head);
    if (!type) {
      fs.unlink(f.path, () => {});
      rejected.push(f.originalname);
      continue;
    }
    const base = path
      .parse(f.originalname)
      .name.normalize('NFKD')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()
      .slice(0, 40);
    const filename = `${base || 'image'}-${crypto.randomBytes(4).toString('hex')}${type.ext}`;
    fs.renameSync(f.path, path.join(config.uploadDir, filename));
    ok.push({ filename, original_name: f.originalname.slice(0, 200), mime: type.mime, size: f.size });
  }
  return { ok, rejected };
}
