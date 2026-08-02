import { Router } from 'express';
import { many, one } from '../db.js';
import { HttpError, route } from '../errors.js';
import { publicUser } from '../auth.js';
import { publicPath, upload } from '../upload.js';
import { userFields } from '../sql.js';

const router = Router();

const SELECT_USER = userFields();

router.get(
  '/',
  route(async (req, res) => {
    const search = (req.query.search ?? '').trim();
    const rows = await many(
      `SELECT ${SELECT_USER} FROM users
       WHERE id <> $1 AND ($2 = '' OR username ILIKE '%' || $2 || '%' OR display_name ILIKE '%' || $2 || '%')
       ORDER BY online DESC, display_name
       LIMIT 30`,
      [req.user.id, search]
    );
    res.json(rows.map(publicUser));
  })
);

router.patch(
  '/me',
  route(async (req, res) => {
    const { displayName, bio } = req.body;

    if (displayName !== undefined) {
      const name = String(displayName).trim();
      if (!name || name.length > 40) throw new HttpError(422, 'El nombre visible debe tener entre 1 y 40 caracteres');
    }
    if (bio !== undefined && String(bio).length > 300) {
      throw new HttpError(422, 'La bio no puede pasar de 300 caracteres');
    }

    const user = await one(
      `UPDATE users
       SET display_name = COALESCE($2, display_name),
           bio = COALESCE($3, bio)
       WHERE id = $1
       RETURNING ${SELECT_USER}`,
      [req.user.id, displayName === undefined ? null : String(displayName).trim(), bio === undefined ? null : String(bio)]
    );
    res.json(publicUser(user));
  })
);

router.post(
  '/me/avatar',
  upload.single('image'),
  route(async (req, res) => {
    if (!req.file) throw new HttpError(422, 'Falta el archivo de imagen');
    const avatarUrl = publicPath(req.file);
    await one('UPDATE users SET avatar_url = $2 WHERE id = $1 RETURNING id', [req.user.id, avatarUrl]);
    res.json({ avatarUrl });
  })
);

router.get(
  '/:id',
  route(async (req, res) => {
    const user = await one(`SELECT ${SELECT_USER} FROM users WHERE id = $1`, [req.params.id]);
    if (!user) throw new HttpError(404, 'Usuario no encontrado');
    res.json(publicUser(user));
  })
);

export default router;
