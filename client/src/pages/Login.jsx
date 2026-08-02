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

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(form);
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
          <GlassCardTitle>Entra a tu cuenta</GlassCardTitle>
          <GlassCardDescription>Escribe tu usuario y contraseña para continuar.</GlassCardDescription>
          <GlassCardAction>
            <Link to="/register" className="btn btn-ghost btn-sm">
              Crear cuenta
            </Link>
          </GlassCardAction>
        </GlassCardHeader>

        <GlassCardContent>
          <form id="login-form" onSubmit={submit}>
            <label className="field">
              <span>Usuario</span>
              <input
                className="input"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                autoComplete="username"
                autoFocus
                required
              />
            </label>

            <label className="field">
              <span>Contraseña</span>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
                required
              />
            </label>

            {error && (
              <p className="error" role="alert">
                <WarningCircle size={16} weight="fill" /> {error}
              </p>
            )}
          </form>
        </GlassCardContent>

        <GlassCardFooter>
          <button form="login-form" className="btn" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
          <p className="auth-alt">
            ¿Sin cuenta? <Link to="/register">Crear una</Link>
          </p>
        </GlassCardFooter>
      </GlassCard>
    </div>
  );
}
