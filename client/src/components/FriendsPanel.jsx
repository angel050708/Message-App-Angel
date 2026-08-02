import { useCallback, useEffect, useState } from 'react';
import { Check, ChatCircle, UserPlus, Users, WarningCircle, X } from '@phosphor-icons/react';
import { api } from '../api';
import Avatar from './Avatar';

const POLL_MS = 15000;

export default function FriendsPanel({ onOpenChat }) {
  const [data, setData] = useState({ friends: [], incoming: [], outgoing: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [found, setFound] = useState([]);
  const [error, setError] = useState('');

  const load = useCallback(
    () =>
      api
        .get('/friends')
        .then(setData)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false)),
    []
  );

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!search.trim()) {
      setFound([]);
      return;
    }
    const timer = setTimeout(() => {
      api.get(`/users?search=${encodeURIComponent(search)}`).then(setFound).catch((err) => setError(err.message));
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  async function act(promise) {
    setError('');
    try {
      await promise;
      await load();
      setSearch('');
    } catch (err) {
      setError(err.message);
    }
  }

  const known = new Set([...data.friends, ...data.incoming, ...data.outgoing].map((u) => u.id));

  return (
    <div className="panel">
      {error && (
        <p className="error" role="alert">
          <WarningCircle size={16} weight="fill" /> {error}
        </p>
      )}

      <label className="field">
        <span>Agregar amigo</span>
        <input
          className="input"
          placeholder="Buscar por nombre o usuario"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>

      {found.length > 0 && (
        <>
          <h3>Resultados</h3>
          <ul className="user-list">
            {found.map((u) => (
              <li key={u.id} className="user-row">
                <Avatar user={u} size={32} online={u.online} />
                <span className="user-name">
                  <strong>{u.displayName}</strong>
                  <small>@{u.username}</small>
                </span>
                {known.has(u.id) ? (
                  <span className="helper">Ya agregado</span>
                ) : (
                  <button className="btn btn-secondary btn-sm" onClick={() => act(api.post(`/friends/${u.id}`))}>
                    <UserPlus size={16} /> Agregar
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {data.incoming.length > 0 && (
        <>
          <h3>Solicitudes recibidas</h3>
          <ul className="user-list">
            {data.incoming.map((u) => (
              <li key={u.id} className="user-row">
                <Avatar user={u} size={32} online={u.online} />
                <span className="user-name">
                  <strong>{u.displayName}</strong>
                  <small>@{u.username}</small>
                </span>
                <button
                  className="btn btn-sm btn-icon"
                  onClick={() => act(api.post(`/friends/${u.id}/accept`))}
                  aria-label={`Aceptar a ${u.displayName}`}
                >
                  <Check size={16} />
                </button>
                <button
                  className="btn btn-ghost btn-sm btn-icon"
                  onClick={() => act(api.del(`/friends/${u.id}`))}
                  aria-label={`Rechazar a ${u.displayName}`}
                >
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <h3>Amigos</h3>
      {loading && (
        <div className="skeleton-conv" aria-hidden="true">
          <div className="skeleton skeleton-avatar" style={{ width: 32, height: 32 }} />
          <div className="skeleton-lines">
            <div className="skeleton skeleton-line" style={{ width: '55%' }} />
          </div>
        </div>
      )}

      {!loading && data.friends.length === 0 && (
        <div className="state state-inline">
          <Users size={40} weight="light" />
          <p>Todavía no tienes amigos. Búscalos arriba para agregarlos.</p>
        </div>
      )}

      <ul className="user-list">
        {data.friends.map((u) => (
          <li key={u.id} className="user-row">
            <Avatar user={u} size={32} online={u.online} />
            <span className="user-name">
              <strong>{u.displayName}</strong>
              <small>{u.online ? 'En línea' : 'Desconectado'}</small>
            </span>
            <button
              className="btn btn-secondary btn-sm btn-icon"
              onClick={() => onOpenChat(u)}
              aria-label={`Abrir chat con ${u.displayName}`}
            >
              <ChatCircle size={16} />
            </button>
            <button
              className="btn btn-danger btn-sm btn-icon"
              onClick={() => act(api.del(`/friends/${u.id}`))}
              aria-label={`Quitar a ${u.displayName}`}
            >
              <X size={16} />
            </button>
          </li>
        ))}
      </ul>

      {data.outgoing.length > 0 && (
        <>
          <h3>Solicitudes enviadas</h3>
          <ul className="user-list">
            {data.outgoing.map((u) => (
              <li key={u.id} className="user-row">
                <Avatar user={u} size={32} online={u.online} />
                <span className="user-name">
                  <strong>{u.displayName}</strong>
                  <small>Pendiente</small>
                </span>
                <button
                  className="btn btn-ghost btn-sm btn-icon"
                  onClick={() => act(api.del(`/friends/${u.id}`))}
                  aria-label={`Cancelar solicitud a ${u.displayName}`}
                >
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
