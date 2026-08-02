import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChatCircleDots, WarningCircle } from '@phosphor-icons/react';
import { api, fileUrl } from '../api';
import { useAuth } from '../auth';
import Avatar from './Avatar';
import MessageComposer from './MessageComposer';

const POLL_MS = 3000;
const GROUP_WINDOW_MS = 5 * 60 * 1000;

const hour = (iso) => new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });

function dayLabel(iso) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Hoy';
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
  return date.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
}

// El polling puede tener una petición en vuelo cuando el usuario envía: ese ciclo
// devolvería su propio mensaje otra vez, así que la lista se une por id.
function merge(prev, incoming) {
  const seen = new Set(prev.map((m) => m.id));
  const nuevos = incoming.filter((m) => !seen.has(m.id));
  return nuevos.length === 0 ? prev : [...prev, ...nuevos];
}

function isGrouped(message, previous) {
  if (!previous || previous.senderId !== message.senderId) return false;
  if (new Date(message.createdAt).toDateString() !== new Date(previous.createdAt).toDateString()) return false;
  return new Date(message.createdAt) - new Date(previous.createdAt) < GROUP_WINDOW_MS;
}

export default function MessageThread({ conversation, onActivity, onBack }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const bottom = useRef(null);
  const lastAt = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setMessages([]);
    setLoading(true);
    lastAt.current = null;

    async function poll() {
      try {
        const after = lastAt.current;
        const nuevos = await api.get(
          `/conversations/${conversation.id}/messages` + (after ? `?after=${encodeURIComponent(after)}` : '')
        );
        if (cancelled) return;

        setError('');
        setLoading(false);
        if (nuevos.length === 0) return;

        lastAt.current = nuevos[nuevos.length - 1].createdAt;
        setMessages((prev) => merge(prev, nuevos));
        api.post(`/conversations/${conversation.id}/read`).then(onActivity).catch(() => {});
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    poll();
    const timer = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [conversation.id, onActivity]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  function appendOwn(message) {
    lastAt.current = message.createdAt;
    setMessages((prev) => merge(prev, [message]));
    onActivity();
  }

  const heading = conversation.isGroup ? conversation.name : conversation.other?.displayName;
  const subtitle = conversation.isGroup
    ? `${conversation.members?.length ?? 0} miembros`
    : conversation.other?.online
      ? 'En línea'
      : 'Desconectado';

  return (
    <section className="thread">
      <header className="thread-header">
        <button type="button" className="btn btn-ghost btn-icon sidebar-back" onClick={onBack} aria-label="Volver a la lista">
          <ArrowLeft size={20} />
        </button>
        <Avatar
          user={conversation.isGroup ? { displayName: conversation.name } : conversation.other}
          online={conversation.isGroup ? undefined : conversation.other?.online}
        />
        <div>
          <h2>{heading}</h2>
          <p>{subtitle}</p>
        </div>
      </header>

      <div className="messages" role="log" aria-label={`Mensajes con ${heading}`} aria-live="polite">
        {error && (
          <p className="error" role="alert">
            <WarningCircle size={16} weight="fill" /> {error}
          </p>
        )}

        {!loading && messages.length === 0 && !error && (
          <div className="state">
            <ChatCircleDots size={40} weight="light" />
            <h2>Aún no hay mensajes</h2>
            <p>Escribe abajo para empezar la conversación.</p>
          </div>
        )}

        {messages.map((m, i) => {
          const previous = messages[i - 1];
          const grouped = isGrouped(m, previous);
          const mine = m.senderId === user.id;
          const newDay =
            !previous || new Date(m.createdAt).toDateString() !== new Date(previous.createdAt).toDateString();

          return (
            <div key={m.id}>
              {newDay && <p className="day-sep">{dayLabel(m.createdAt)}</p>}
              <div className={`msg-row${mine ? ' mine' : ''}${grouped ? ' grouped' : ''}`}>
                <span className="msg-slot">
                  {!mine && !grouped && (
                    <Avatar user={{ displayName: m.senderName, avatarUrl: m.senderAvatar }} size={28} />
                  )}
                </span>
                <article className="bubble">
                  {conversation.isGroup && !mine && !grouped && <p className="bubble-sender">{m.senderName}</p>}
                  {m.imageUrl && (
                    <img
                      className="bubble-image"
                      src={fileUrl(m.imageUrl)}
                      alt={`Imagen enviada por ${mine ? 'ti' : m.senderName}`}
                      loading="lazy"
                    />
                  )}
                  {m.body && <p className="bubble-body">{m.body}</p>}
                  <time className="bubble-time" dateTime={m.createdAt}>
                    {hour(m.createdAt)}
                  </time>
                </article>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>

      <MessageComposer conversationId={conversation.id} onSent={appendOwn} />
    </section>
  );
}
