import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { HttpError } from './errors.js';

const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

export const UPLOAD_DIR = fileURLToPath(new URL('../uploads/', import.meta.url));
mkdirSync(UPLOAD_DIR, { recursive: true });

export const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => cb(null, randomUUID() + extname(file.originalname).toLowerCase()),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    ALLOWED.has(file.mimetype) ? cb(null, true) : cb(new HttpError(415, 'Formato de imagen no soportado')),
});

export const publicPath = (file) => (file ? `/uploads/${file.filename}` : null);
