import { useSyncExternalStore, useCallback } from 'react';

const STORAGE_KEY = 'motor100-theme';
type Theme = 'dark' | 'light';

let listeners: Array<() => void> = [];

function getSnapshot(): Theme {
  return (localStorage.getItem(STORAGE_KEY) as Theme) ?? 'dark';
}

function getServerSnapshot(): Theme {
  return 'dark';
}

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('dark', 'light');
  root.classList.add(theme);
}

// Apply on load
if (typeof document !== 'undefined') {
  applyTheme(getSnapshot());
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleTheme = useCallback(() => {
    const next: Theme = getSnapshot() === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
    listeners.forEach((l) => l());
  }, []);

  return { theme, toggleTheme };
}
