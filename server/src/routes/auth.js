import { Router } from 'express';
import { one } from '../db.js';
import { HttpError, route } from '../errors.js';
import { checkPassword, clearSession, hashPassword, publicUser, requireAuth, setSession } from '../auth.js';

const router = Router();

router.post(
  '/register',
  route(async (req, res) => {
    const { username, email, password, displayName } = req.body;

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username ?? '')) {
      throw new HttpError(422, 'El usuario debe tener 3-20 caracteres: letras, números o guion bajo');
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email ?? '')) throw new HttpError(422, 'Correo inválido');
    if ((password ?? '').length < 8) throw new HttpError(422, 'La contraseña necesita al menos 8 caracteres');

    const name = (displayName ?? username).trim();
    if (!name || name.length > 40) throw new HttpError(422, 'El nombre visible debe tener entre 1 y 40 caracteres');

    const taken = await one('SELECT 1 FROM users WHERE username = $1 OR email = $2', [username, email]);
    if (taken) throw new HttpError(409, 'Ese usuario o correo ya está registrado');

    const user = await one(
      `INSERT INTO users (username, email, password_hash, display_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, display_name, bio, avatar_url, created_at, true AS online`,
      [username, email, await hashPassword(password), name]
    );

    setSession(res, user.id);
    res.status(201).json(publicUser(user));
  })
);

router.post(
  '/login',
  route(async (req, res) => {
    const { username, password } = req.body;
    const user = await one(
      `SELECT id, username, password_hash, display_name, bio, avatar_url, created_at
       FROM users WHERE username = $1`,
      [username ?? '']
    );

    if (!user || !(await checkPassword(password ?? '', user.password_hash))) {
      throw new HttpError(401, 'Usuario o contraseña incorrectos');
    }

    setSession(res, user.id);
    res.json(publicUser({ ...user, online: true }));
  })
);

router.post('/logout', (req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => res.json(publicUser(req.user)));

export default router;
