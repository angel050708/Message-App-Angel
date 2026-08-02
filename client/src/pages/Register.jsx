import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChatTeardropDots, WarningCircle } from '@phosphor-icons/react';
import { useAuth } from '../auth';
import {
  GlassCard,
  GlassCardAction,
  GlassCardContent,
  GlassCardDescription,
  GlassCardFooter,
  GlassCardHeader,
  GlassCardTitle,
} from '../components/GlassCard';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', displayName: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register(form);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <GlassCard>
        <div className="brand">
          <ChatTeardropDots size={22} weight="fill" />
          Message
        </div>

        <GlassCardHeader>
          <GlassCardTitle>Crear cuenta</GlassCardTitle>
          <GlassCardDescription>Cuatro campos y ya puedes escribirle a alguien.</GlassCardDescription>
          <GlassCardAction>
            <Link to="/login" className="btn btn-ghost btn-sm">
              Entrar
            </Link>
          </GlassCardAction>
        </GlassCardHeader>

        <GlassCardContent>
          <form id="register-form" onSubmit={submit}>
            <label className="field">
              <span>Usuario</span>
              <input
                className="input"
                value={form.username}
                onChange={update('username')}
                autoComplete="username"
                pattern="[a-zA-Z0-9_]{3,20}"
                autoFocus
                required
              />
              <span className="helper">3 a 20 caracteres: letras, números o guion bajo.</span>
            </label>

            <label className="field">
              <span>Nombre visible</span>
              <input
                className="input"
                value={form.displayName}
                onChange={update('displayName')}
                autoComplete="name"
                maxLength={40}
                required
              />
            </label>

            <label className="field">
              <span>Correo</span>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={update('email')}
                autoComplete="email"
                required
              />
            </label>

            <label className="field">
              <span>Contraseña</span>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={update('password')}
                autoComplete="new-password"
                minLength={8}
                required
              />
              <span className="helper">Mínimo 8 caracteres.</span>
            </label>

            {error && (
              <p className="error" role="alert">
                <WarningCircle size={16} weight="fill" /> {error}
              </p>
            )}
          </form>
        </GlassCardContent>

        <GlassCardFooter>
          <button form="register-form" className="btn" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'Creando…' : 'Crear cuenta'}
          </button>
          <p className="auth-alt">
            ¿Ya tienes cuenta? <Link to="/login">Entrar</Link>
          </p>
        </GlassCardFooter>
      </GlassCard>
    </div>
  );
}
