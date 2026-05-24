import { useCallback, useSyncExternalStore } from 'react';

type Theme = 'dark' | 'light';

const STORAGE_KEY = 'motor100-theme';

function getSnapshot(): Theme {
  return (localStorage.getItem(STORAGE_KEY) as Theme) ?? 'dark';
}

function getServerSnapshot(): Theme {
  return 'dark';
}

function subscribe(callback: () => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('dark', 'light');
  root.classList.add(theme);
}

let listeners: Array<() => void> = [];
let currentTheme: Theme = typeof window !== 'undefined' ? getSnapshot() : 'dark';

function subscribeInternal(cb: () => void) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

function getInternalSnapshot(): Theme {
  return currentTheme;
}

function setTheme(theme: Theme) {
  currentTheme = theme;
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
  listeners.forEach((l) => l());
}

if (typeof window !== 'undefined') {
  applyTheme(currentTheme);
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribeInternal, getInternalSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme]);

  return { theme, toggle, setTheme } as const;
}
