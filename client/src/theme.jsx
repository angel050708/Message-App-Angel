import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);
const KEY = 'message-theme';
const media = () => window.matchMedia('(prefers-color-scheme: dark)');

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(() => localStorage.getItem(KEY) ?? 'system');
  const [systemDark, setSystemDark] = useState(() => media().matches);

  useEffect(() => {
    const mq = media();
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolved = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
  }, [resolved]);

  function setTheme(next) {
    setPreference(next);
    if (next === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, next);
  }

  return (
    <ThemeContext.Provider value={{ preference, resolved, setTheme }}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
