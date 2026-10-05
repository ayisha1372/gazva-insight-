
import crypto from 'node:crypto';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

import { config } from '../config.js';
import { HttpError } from './errors.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Detect the real image type from the file's first bytes.
 * Never trust the client-sent MIME type or extension.
 */
export function sniffImage(buf) {
  if (
    buf.length >= 8 &&
    buf.subarray(0, 8).equals(
      Buffer.from([
        0x89, 0x50, 0x4e, 0x47,
        0x0d, 0x0a, 0x1a, 0x0a,
      ])
    )
  ) {
    return { mime: 'image/png', ext: '.png' };
  }

  if (
    buf.length >= 3 &&
    buf[0] === 0xff &&
    buf[1] === 0xd8 &&
    buf[2] === 0xff
  ) {
    return { mime: 'image/jpeg', ext: '.jpg' };
  }

  if (
    buf.length >= 6 &&
    ['GIF87a', 'GIF89a'].includes(
      buf.subarray(0, 6).toString('ascii')
    )
  ) {
    return { mime: 'image/gif', ext: '.gif' };
  }

  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { mime: 'image/webp', ext: '.webp' };
  }

  return null;
}

/**
 * Keep uploaded files in memory temporarily.
 * They are sent to Cloudinary and are not stored on Render's disk.
 */
const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: config.maxUploadMb * 1024 * 1024,
    files: 10,
  },

  fileFilter: (_req, file, cb) => {
    if (!/^image\/(png|jpe?g|gif|webp)$/.test(file.mimetype)) {
      return cb(
        new HttpError(
          400,
          'Only PNG, JPG, GIF or WebP images are allowed.'
        )
      );
    }

    cb(null, true);
  },
});

export const uploadImages = upload.array('files', 10);

/**
 * Upload validated images to Cloudinary.
 */
export async function finalizeUploads(files = []) {
  const ok = [];
  const rejected = [];

  for (const f of files) {
    const type = sniffImage(f.buffer);

    if (!type) {
      rejected.push(f.originalname);
      continue;
    }

    const base = crypto
      .randomUUID()
      .replace(/-/g, '');

    try {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'gazva-insight',
            public_id: base,
            resource_type: 'image',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        stream.end(f.buffer);
      });

      ok.push({
        filename: result.public_id,
        original_name: f.originalname.slice(0, 200),
        mime: type.mime,
        size: f.size,
        url: result.secure_url,
      });
    } catch (error) {
      console.error('Cloudinary upload failed:', error);
      throw new HttpError(500, 'Image upload failed.');
    }
  }

  return { ok, rejected };
}