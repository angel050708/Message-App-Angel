import { fileUrl } from '../api';

export default function Avatar({ user, size = 40, online }) {
  const label = user?.displayName ?? '?';
  const style = { width: size, height: size, fontSize: Math.round(size * 0.36) };

  return (
    <span className="avatar-wrap" style={style}>
      {user?.avatarUrl ? (
        <img className="avatar" src={fileUrl(user.avatarUrl)} alt="" width={size} height={size} />
      ) : (
        <span className="avatar avatar-initials" aria-hidden="true">
          {label.slice(0, 2).toUpperCase()}
        </span>
      )}
      {online !== undefined && (
        <span
          className={online ? 'presence presence-on' : 'presence'}
          role="img"
          aria-label={online ? `${label} en línea` : `${label} desconectado`}
        />
      )}
    </span>
  );
}
