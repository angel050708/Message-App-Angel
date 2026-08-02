import { Router } from 'express';
import { many, one, query } from '../db.js';
import { HttpError, route } from '../errors.js';
import { publicUser } from '../auth.js';
import { userFields } from '../sql.js';

const router = Router();

const SELECT_USER = userFields('u');

router.get(
  '/',
  route(async (req, res) => {
    const rows = await many(
      `SELECT ${SELECT_USER},
              f.status,
              f.requester_id = $1 AS sent_by_me
       FROM friendships f
       JOIN users u ON u.id = CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END
       WHERE f.requester_id = $1 OR f.addressee_id = $1
       ORDER BY online DESC, u.display_name`,
      [req.user.id]
    );

    res.json({
      friends: rows.filter((r) => r.status === 'accepted').map(publicUser),
      incoming: rows.filter((r) => r.status === 'pending' && !r.sent_by_me).map(publicUser),
      outgoing: rows.filter((r) => r.status === 'pending' && r.sent_by_me).map(publicUser),
    });
  })
);

router.post(
  '/:userId',
  route(async (req, res) => {
    const other = req.params.userId;
    if (other === req.user.id) throw new HttpError(422, 'No puedes agregarte a ti mismo');

    const exists = await one('SELECT 1 FROM users WHERE id = $1', [other]);
    if (!exists) throw new HttpError(404, 'Usuario no encontrado');

    const incoming = await one(
      `SELECT status FROM friendships WHERE requester_id = $1 AND addressee_id = $2`,
      [other, req.user.id]
    );
    if (incoming) {
      await query(
        `UPDATE friendships SET status = 'accepted' WHERE requester_id = $1 AND addressee_id = $2`,
        [other, req.user.id]
      );
      return res.json({ status: 'accepted' });
    }

    const inserted = await one(
      `INSERT INTO friendships (requester_id, addressee_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING
       RETURNING status`,
      [req.user.id, other]
    );
    if (!inserted) throw new HttpError(409, 'Ya existe una solicitud con ese usuario');
    res.json({ status: inserted.status });
  })
);

router.post(
  '/:userId/accept',
  route(async (req, res) => {
    const updated = await one(
      `UPDATE friendships SET status = 'accepted'
       WHERE requester_id = $1 AND addressee_id = $2 AND status = 'pending'
       RETURNING requester_id`,
      [req.params.userId, req.user.id]
    );
    if (!updated) throw new HttpError(404, 'No hay solicitud pendiente de ese usuario');
    res.json({ ok: true });
  })
);

router.delete(
  '/:userId',
  route(async (req, res) => {
    await query(
      `DELETE FROM friendships
       WHERE (requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1)`,
      [req.user.id, req.params.userId]
    );
    res.json({ ok: true });
  })
);

export default router;
