import { NavLink } from 'react-router-dom';
import { ChatsCircle, ImageSquare } from '@phosphor-icons/react';
import Avatar from './Avatar';

const title = (c) => (c.isGroup ? c.name : (c.other?.displayName ?? 'Usuario eliminado'));

function relativeTime(iso) {
  const then = new Date(iso);
  const minutes = Math.round((Date.now() - then.getTime()) / 60000);
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} h`;
  return then.toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

function Skeletons() {
  return (
    <div aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="skeleton-conv">
          <div className="skeleton skeleton-avatar" />
          <div className="skeleton-lines">
            <div className="skeleton skeleton-line" style={{ width: '52%' }} />
            <div className="skeleton skeleton-line" style={{ width: '78%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ConversationList({ conversations, loading, onNavigate }) {
  if (loading) return <Skeletons />;

  if (conversations.length === 0) {
    return (
      <div className="state state-inline">
        <ChatsCircle size={40} weight="light" />
        <h2>Sin conversaciones</h2>
        <p>Usa "Nuevo chat" para escribirle a alguien por primera vez.</p>
      </div>
    );
  }

  return (
    <ul className="conv-list">
      {conversations.map((c) => (
        <li key={c.id}>
          <NavLink to={`/c/${c.id}`} className="conv" onClick={onNavigate}>
            <Avatar
              user={c.isGroup ? { displayName: c.name } : c.other}
              online={c.isGroup ? undefined : c.other?.online}
            />
            <span className="conv-text">
              <span className="conv-top">
                <span className="conv-title">{title(c)}</span>
                {c.lastMessage && <span className="conv-time">{relativeTime(c.lastMessage.createdAt)}</span>}
              </span>
              <span className="conv-preview">
                {c.lastMessage?.imageUrl && !c.lastMessage.body && (
                  <>
                    <ImageSquare size={14} /> Imagen
                  </>
                )}
                {c.lastMessage?.body || (!c.lastMessage && 'Sin mensajes todavía')}
              </span>
            </span>
            {c.unread > 0 && (
              <span className="badge" aria-label={`${c.unread} mensajes sin leer`}>
                {c.unread}
              </span>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}
