import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChatCircleDots, Plus, SignOut } from '@phosphor-icons/react';
import { api } from '../api';
import { useAuth } from '../auth';
import Avatar from '../components/Avatar';
import ConversationList from '../components/ConversationList';
import FriendsPanel from '../components/FriendsPanel';
import MessageThread from '../components/MessageThread';
import NewChatDialog from '../components/NewChatDialog';
import ThemeToggle from '../components/ThemeToggle';

const POLL_MS = 5000;

export default function Chat() {
  const { user, logout } = useAuth();
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('chats');
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(
    () =>
      api
        .get('/conversations')
        .then(setConversations)
        .catch(() => {})
        .finally(() => setLoading(false)),
    []
  );

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const active = conversations.find((c) => c.id === conversationId);

  function openConversation(conversation) {
    setConversations((prev) => (prev.some((c) => c.id === conversation.id) ? prev : [conversation, ...prev]));
    setDialogOpen(false);
    setTab('chats');
    navigate(`/c/${conversation.id}`);
  }

  const openDm = (other) => api.post('/conversations/dm', { userId: other.id }).then(openConversation);

  return (
    <div className="layout" data-view={conversationId ? 'thread' : 'list'}>
      <aside className="sidebar">
        <header className="sidebar-header">
          <Link to="/perfil" className="me">
            <Avatar user={user} size={36} online />
            <span>{user.displayName}</span>
          </Link>
          <ThemeToggle />
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={logout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <SignOut size={20} />
          </button>
        </header>

        <div className="tabs" role="tablist">
          <button
            type="button"
            role="tab"
            className="tab"
            aria-selected={tab === 'chats'}
            onClick={() => setTab('chats')}
          >
            Chats
          </button>
          <button
            type="button"
            role="tab"
            className="tab"
            aria-selected={tab === 'amigos'}
            onClick={() => setTab('amigos')}
          >
            Amigos
          </button>
        </div>

        {tab === 'chats' && (
          <div className="sidebar-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setDialogOpen(true)}>
              <Plus size={18} /> Nuevo chat
            </button>
          </div>
        )}

        <div className="sidebar-scroll">
          {tab === 'chats' ? (
            <ConversationList conversations={conversations} loading={loading} />
          ) : (
            <FriendsPanel onOpenChat={openDm} />
          )}
        </div>
      </aside>

      {active ? (
        <MessageThread conversation={active} onActivity={load} onBack={() => navigate('/')} />
      ) : (
        <section className="thread">
          <div className="state">
            <ChatCircleDots size={48} weight="light" />
            <h2>Elige una conversación</h2>
            <p>Selecciona un chat de la izquierda, o crea uno nuevo para empezar a escribir.</p>
          </div>
        </section>
      )}

      {dialogOpen && <NewChatDialog onClose={() => setDialogOpen(false)} onCreated={openConversation} />}
    </div>
  );
}
