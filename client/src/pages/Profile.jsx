import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Camera, Check, WarningCircle } from '@phosphor-icons/react';
import { api } from '../api';
import { useAuth } from '../auth';
import Avatar from '../components/Avatar';
import ThemeToggle from '../components/ThemeToggle';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileInput = useRef(null);

  const dirty = displayName !== user.displayName || bio !== user.bio;

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setStatus('');
    try {
      setUser(await api.patch('/users/me', { displayName, bio }));
      setStatus('Perfil actualizado');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function uploadAvatar(e) {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setStatus('');
    const data = new FormData();
    data.append('image', file);
    try {
      const { avatarUrl } = await api.post('/users/me/avatar', data);
      setUser({ ...user, avatarUrl });
      setStatus('Avatar actualizado');
    } catch (err) {
      setError(err.message);
    } finally {
      fileInput.current.value = '';
    }
  }

  return (
    <div className="profile-page">
      <form className="profile-card" onSubmit={save}>
        <Link to="/" className="back-link">
          <ArrowLeft size={16} /> Volver al chat
        </Link>

        <div className="modal-header">
          <h1>Mi perfil</h1>
          <ThemeToggle />
        </div>

        <div className="avatar-edit">
          <Avatar user={user} size={72} />
          <div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileInput.current?.click()}>
              <Camera size={16} /> Cambiar avatar
            </button>
            <span className="helper">PNG, JPG, WEBP o GIF. Máximo 5 MB.</span>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={uploadAvatar}
            hidden
          />
        </div>

        <label className="field">
          <span>Usuario</span>
          <input className="input" value={`@${user.username}`} readOnly aria-readonly="true" />
          <span className="helper">El usuario no se puede cambiar.</span>
        </label>

        <label className="field">
          <span>Nombre visible</span>
          <input
            className="input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={40}
            required
          />
          <span className="count">{displayName.length}/40</span>
        </label>

        <label className="field">
          <span>Bio</span>
          <textarea
            className="textarea"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={300}
            rows={4}
            placeholder="Cuenta algo sobre ti"
          />
          <span className="count">{bio.length}/300</span>
        </label>

        {error && (
          <p className="error" role="alert">
            <WarningCircle size={16} weight="fill" /> {error}
          </p>
        )}
        {status && (
          <p className="success" role="status">
            <Check size={16} weight="bold" /> {status}
          </p>
        )}

        <button className="btn" disabled={busy || !dirty} style={{ width: '100%', marginTop: '0.5rem' }}>
          {busy ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}
