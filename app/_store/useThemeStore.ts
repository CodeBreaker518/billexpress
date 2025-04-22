"use client";

import { create } from "zustand";

export type ThemeType = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

function getInitialTheme(): ThemeType {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  return 'system';
}

function applyTheme(t: ThemeType) {
  if (t === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (t === 'light') {
    document.documentElement.classList.remove('dark');
  } else if (t === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: getInitialTheme(),
  setTheme: (theme) => {
    set({ theme });
    localStorage.setItem('theme', theme);
    applyTheme(theme);
  },
}));

// Sincronizar con cambios en otras pestañas
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'theme') {
      const theme = (e.newValue as ThemeType) || 'system';
      useThemeStore.setState({ theme });
      applyTheme(theme);
    }
  });
  // Aplicar el tema al cargar
  applyTheme(getInitialTheme());
}
