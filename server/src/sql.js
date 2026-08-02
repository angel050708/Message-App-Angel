export const ONLINE = `last_seen_at > now() - interval '2 minutes'`;

export const userFields = (alias = '') => {
  const p = alias ? `${alias}.` : '';
  return `${p}id, ${p}username, ${p}display_name, ${p}bio, ${p}avatar_url, ${p}created_at,
          ${p}${ONLINE} AS online`;
};

export const userJson = (alias) => `
  json_build_object(
    'id', ${alias}.id, 'username', ${alias}.username, 'displayName', ${alias}.display_name,
    'avatarUrl', ${alias}.avatar_url, 'online', ${alias}.${ONLINE}
  )
`;
