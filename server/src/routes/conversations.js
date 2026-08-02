import { Router } from 'express';
import { many, one, query, transaction } from '../db.js';
import { HttpError, route } from '../errors.js';
import { requireMember } from '../auth.js';
import { userJson } from '../sql.js';
import messages from './messages.js';

const router = Router();

const MEMBER_JSON = userJson('u');

const dmKey = (a, b) => (a < b ? `${a}:${b}` : `${b}:${a}`);

const shape = (row) => ({
  id: row.id,
  isGroup: row.is_group,
  name: row.name,
  other: row.other,
  members: row.members,
  lastMessage: row.last_message,
  unread: Number(row.unread ?? 0),
});

async function loadConversation(conversationId, userId) {
  return one(
    `SELECT c.id, c.is_group, c.name,
            (SELECT ${MEMBER_JSON} FROM conversation_members om
               JOIN users u ON u.id = om.user_id
              WHERE om.conversation_id = c.id AND om.user_id <> $2
              LIMIT 1) AS other,
            (SELECT json_agg(${MEMBER_JSON} ORDER BY u.display_name) FROM conversation_members om
               JOIN users u ON u.id = om.user_id
              WHERE om.conversation_id = c.id) AS members
     FROM conversations c
     WHERE c.id = $1`,
    [conversationId, userId]
  );
}

router.get(
  '/',
  route(async (req, res) => {
    const rows = await many(
      `SELECT c.id, c.is_group, c.name,
              CASE WHEN last.id IS NULL THEN NULL
                   ELSE to_jsonb(last) - 'conversation_id' END AS last_message,
              (SELECT count(*) FROM messages m
                WHERE m.conversation_id = c.id AND m.sender_id <> $1 AND m.created_at > me.last_read_at) AS unread,
              (SELECT ${MEMBER_JSON} FROM conversation_members om
                 JOIN users u ON u.id = om.user_id
                WHERE om.conversation_id = c.id AND om.user_id <> $1
                LIMIT 1) AS other,
              (SELECT json_agg(${MEMBER_JSON} ORDER BY u.display_name) FROM conversation_members om
                 JOIN users u ON u.id = om.user_id
                WHERE om.conversation_id = c.id) AS members
       FROM conversations c
       JOIN conversation_members me ON me.conversation_id = c.id AND me.user_id = $1
       LEFT JOIN LATERAL (
         SELECT m.id, m.conversation_id, m.sender_id AS "senderId", m.body,
                m.image_url AS "imageUrl", m.created_at AS "createdAt"
         FROM messages m WHERE m.conversation_id = c.id
         ORDER BY m.created_at DESC LIMIT 1
       ) last ON true
       ORDER BY COALESCE(last."createdAt", c.created_at) DESC`,
      [req.user.id]
    );
    res.json(rows.map(shape));
  })
);

router.post(
  '/dm',
  route(async (req, res) => {
    const { userId } = req.body;
    if (userId === req.user.id) throw new HttpError(422, 'No puedes abrir un chat contigo mismo');

    const other = await one('SELECT id FROM users WHERE id = $1', [userId]);
    if (!other) throw new HttpError(404, 'Usuario no encontrado');

    const key = dmKey(req.user.id, userId);
    const existing = await one('SELECT id FROM conversations WHERE dm_key = $1 AND NOT is_group', [key]);
    if (existing) return res.json(shape(await loadConversation(existing.id, req.user.id)));

    const id = await transaction(async (client) => {
      const { rows } = await client.query(
        'INSERT INTO conversations (is_group, dm_key, created_by) VALUES (false, $1, $2) RETURNING id',
        [key, req.user.id]
      );
      await client.query(
        'INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1, $2), ($1, $3)',
        [rows[0].id, req.user.id, userId]
      );
      return rows[0].id;
    });

    res.status(201).json(shape(await loadConversation(id, req.user.id)));
  })
);

router.post(
  '/group',
  route(async (req, res) => {
    const name = String(req.body.name ?? '').trim();
    const memberIds = [...new Set(req.body.memberIds ?? [])].filter((id) => id !== req.user.id);

    if (!name || name.length > 60) throw new HttpError(422, 'El nombre del grupo debe tener entre 1 y 60 caracteres');
    if (memberIds.length === 0) throw new HttpError(422, 'Un grupo necesita al menos otro miembro');

    const found = await many('SELECT id FROM users WHERE id = ANY($1::uuid[])', [memberIds]);
    if (found.length !== memberIds.length) throw new HttpError(422, 'Alguno de los usuarios no existe');

    const id = await transaction(async (client) => {
      const { rows } = await client.query(
        'INSERT INTO conversations (is_group, name, created_by) VALUES (true, $1, $2) RETURNING id',
        [name, req.user.id]
      );
      await client.query(
        `INSERT INTO conversation_members (conversation_id, user_id) SELECT $1, unnest($2::uuid[])`,
        [rows[0].id, [req.user.id, ...memberIds]]
      );
      return rows[0].id;
    });

    res.status(201).json(shape(await loadConversation(id, req.user.id)));
  })
);

router.get(
  '/:id',
  requireMember,
  route(async (req, res) => {
    res.json(shape(await loadConversation(req.params.id, req.user.id)));
  })
);

router.post(
  '/:id/members',
  requireMember,
  route(async (req, res) => {
    if (!req.conversation.is_group) throw new HttpError(403, 'Un chat directo no admite más miembros');

    const exists = await one('SELECT 1 FROM users WHERE id = $1', [req.body.userId]);
    if (!exists) throw new HttpError(404, 'Usuario no encontrado');

    const added = await one(
      `INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING RETURNING user_id`,
      [req.params.id, req.body.userId]
    );
    if (!added) throw new HttpError(409, 'Ese usuario ya está en el grupo');
    res.json({ ok: true });
  })
);

router.post(
  '/:id/read',
  requireMember,
  route(async (req, res) => {
    await query(
      'UPDATE conversation_members SET last_read_at = now() WHERE conversation_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ ok: true });
  })
);

router.use('/:id/messages', requireMember, messages);

export default router;
