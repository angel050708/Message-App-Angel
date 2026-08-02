import { useEffect, useRef, useState } from 'react';
import { MagnifyingGlass, WarningCircle, X } from '@phosphor-icons/react';
import { api } from '../api';
import Avatar from './Avatar';

export default function NewChatDialog({ onClose, onCreated }) {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const searchInput = useRef(null);

  useEffect(() => {
    searchInput.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      api
        .get(`/users?search=${encodeURIComponent(search)}`)
        .then(setUsers)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  function toggle(user) {
    setSelected((prev) =>
      prev.some((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user]
    );
  }

  const isGroup = selected.length > 1;

  async function create() {
    setBusy(true);
    setError('');
    try {
      const conversation = isGroup
        ? await api.post('/conversations/group', {
            name: groupName.trim() || selected.map((u) => u.displayName).join(', ').slice(0, 60),
            memberIds: selected.map((u) => u.id),
          })
        : await api.post('/conversations/dm', { userId: selected[0].id });
      onCreated(conversation);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="scrim" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-chat-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h1 id="new-chat-title">Nuevo chat</h1>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <label className="field">
          <span>Buscar persona</span>
          <input
            ref={searchInput}
            className="input"
            placeholder="Nombre o usuario"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        <ul className="user-list">
          {loading &&
            [0, 1, 2].map((i) => (
              <li key={i} className="skeleton-conv" aria-hidden="true">
                <div className="skeleton skeleton-avatar" style={{ width: 32, height: 32 }} />
                <div className="skeleton-lines">
                  <div className="skeleton skeleton-line" style={{ width: '60%' }} />
                </div>
              </li>
            ))}

          {!loading && users.length === 0 && (
            <li className="state state-inline">
              <MagnifyingGlass size={32} weight="light" />
              <p>Nadie coincide con "{search}".</p>
            </li>
          )}

          {!loading &&
            users.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  className="user-row"
                  aria-pressed={selected.some((s) => s.id === u.id)}
                  onClick={() => toggle(u)}
                >
                  <Avatar user={u} size={32} online={u.online} />
                  <span className="user-name">
                    <strong>{u.displayName}</strong>
                    <small>@{u.username}</small>
                  </span>
                </button>
              </li>
            ))}
        </ul>

        {isGroup && (
          <label className="field">
            <span>Nombre del grupo</span>
            <input
              className="input"
              placeholder={selected.map((u) => u.displayName).join(', ').slice(0, 60)}
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={60}
            />
            <span className="helper">Opcional. Si lo dejas vacío usamos los nombres de los miembros.</span>
          </label>
        )}

        {error && (
          <p className="error" role="alert">
            <WarningCircle size={16} weight="fill" /> {error}
          </p>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn" disabled={selected.length === 0 || busy} onClick={create}>
            {isGroup ? `Crear grupo (${selected.length})` : 'Abrir chat'}
          </button>
        </div>
      </div>
    </div>
  );
}
