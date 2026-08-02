import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import multer from 'multer';
import { requireAuth } from './auth.js';
import { HttpError } from './errors.js';
import { UPLOAD_DIR } from './upload.js';
import auth from './routes/auth.js';
import users from './routes/users.js';
import conversations from './routes/conversations.js';
import friends from './routes/friends.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(UPLOAD_DIR));

app.use('/api/auth', auth);
app.use('/api/users', requireAuth, users);
app.use('/api/conversations', requireAuth, conversations);
app.use('/api/friends', requireAuth, friends);

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 422;
    return res.status(status).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'La imagen supera 5 MB' : err.message });
  }
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });

  console.error(err);
  res.status(500).json({ error: 'Error interno' });
});

app.listen(process.env.PORT, () => console.log(`API en http://localhost:${process.env.PORT}`));
