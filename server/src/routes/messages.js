import { Router } from 'express';
import { many, one } from '../db.js';
import { HttpError, route } from '../errors.js';
import { publicPath, upload } from '../upload.js';

const router = Router({ mergeParams: true });

const SELECT_MESSAGE = `
  m.id, m.conversation_id AS "conversationId", m.sender_id AS "senderId",
  m.body, m.image_url AS "imageUrl", m.created_at AS "createdAt",
  u.display_name AS "senderName", u.avatar_url AS "senderAvatar"
`;

router.get(
  '/',
  route(async (req, res) => {
    const after = req.query.after ? new Date(req.query.after) : null;
    if (after && Number.isNaN(after.getTime())) throw new HttpError(422, 'Parámetro after inválido');
    const limit = Math.min(Number(req.query.limit) || 50, 100);

    const rows = await many(
      `SELECT * FROM (
         SELECT ${SELECT_MESSAGE}
         FROM messages m
         LEFT JOIN users u ON u.id = m.sender_id
         WHERE m.conversation_id = $1 AND ($2::timestamptz IS NULL OR m.created_at > $2)
         ORDER BY m.created_at DESC
         LIMIT $3
       ) page ORDER BY "createdAt"`,
      [req.params.id, after, limit]
    );
    res.json(rows);
  })
);

router.post(
  '/',
  upload.single('image'),
  route(async (req, res) => {
    const body = String(req.body.body ?? '').trim();
    const imageUrl = publicPath(req.file);

    if (!body && !imageUrl) throw new HttpError(422, 'El mensaje necesita texto o imagen');
    if (body.length > 4000) throw new HttpError(422, 'El mensaje no puede pasar de 4000 caracteres');

    const message = await one(
      `WITH nuevo AS (
         INSERT INTO messages (conversation_id, sender_id, body, image_url)
         VALUES ($1, $2, $3, $4)
         RETURNING *
       )
       SELECT ${SELECT_MESSAGE} FROM nuevo m JOIN users u ON u.id = m.sender_id`,
      [req.params.id, req.user.id, body, imageUrl]
    );
    res.status(201).json(message);
  })
);

export default router;
