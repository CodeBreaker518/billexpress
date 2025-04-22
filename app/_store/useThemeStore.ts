"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ThemeState {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
}

// Definición más explícita del tipo de almacenamiento y opciones de persistencia
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      setTheme: (theme) => {
        set({ theme });
        if (typeof window !== 'undefined') {
          if (theme === 'system') {
            localStorage.removeItem('theme-storage');
          } else {
            localStorage.setItem('theme-storage', theme);
          }
        }
      },
      toggleTheme: () => {
        const current = get().theme;
        let next: 'light' | 'dark' | 'system';
        if (current === 'light') next = 'dark';
        else if (current === 'dark') next = 'light';
        else {
          // Si está en system, alternar según preferencia del sistema
          const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
          next = prefersDark ? 'light' : 'dark';
        }
        get().setTheme(next);
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
