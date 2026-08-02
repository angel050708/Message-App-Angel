import { Moon, Sun } from '@phosphor-icons/react';
import { useTheme } from '../theme';

export default function ThemeToggle() {
  const { resolved, setTheme } = useTheme();
  const next = resolved === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      className="btn btn-ghost btn-icon"
      onClick={() => setTheme(next)}
      aria-label={next === 'dark' ? 'Activar tema oscuro' : 'Activar tema claro'}
      title={next === 'dark' ? 'Tema oscuro' : 'Tema claro'}
    >
      {resolved === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
