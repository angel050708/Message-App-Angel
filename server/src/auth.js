import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { one } from './db.js';
import { HttpError } from './errors.js';

const COOKIE = 'token';
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export const hashPassword = (plain) => bcrypt.hash(plain, 12);
export const checkPassword = (plain, hash) => bcrypt.compare(plain, hash);

export function setSession(res, userId) {
  const token = jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', maxAge: MAX_AGE });
}

export function clearSession(res) {
  res.clearCookie(COOKIE);
}

export const publicUser = (row) => ({
  id: row.id,
  username: row.username,
  displayName: row.display_name,
  bio: row.bio,
  avatarUrl: row.avatar_url,
  online: row.online ?? null,
  createdAt: row.created_at,
});

export async function requireAuth(req, res, next) {
  const token = req.cookies[COOKIE];
  if (!token) return next(new HttpError(401, 'No autenticado'));

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    clearSession(res);
    return next(new HttpError(401, 'Sesión inválida'));
  }

  const user = await one(
    `UPDATE users SET last_seen_at = now()
     WHERE id = $1
     RETURNING id, username, email, display_name, bio, avatar_url, created_at, true AS online`,
    [payload.sub]
  );
  if (!user) {
    clearSession(res);
    return next(new HttpError(401, 'Sesión inválida'));
  }

  req.user = user;
  next();
}

export async function requireMember(req, res, next) {
  const member = await one(
    `SELECT c.id, c.is_group
     FROM conversations c
     JOIN conversation_members m ON m.conversation_id = c.id AND m.user_id = $2
     WHERE c.id = $1`,
    [req.params.id, req.user.id]
  );
  if (!member) return next(new HttpError(403, 'No perteneces a esta conversación'));
  req.conversation = member;
  next();
}
