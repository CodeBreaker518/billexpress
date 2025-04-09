"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setDarkMode: (isDark: boolean) => void;
}

// Definición más explícita del tipo de almacenamiento y opciones de persistencia
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDarkMode: false,
      toggleTheme: () =>
        set((state) => {
          return { isDarkMode: !state.isDarkMode };
        }),
      setDarkMode: (isDark: boolean) => set({ isDarkMode: isDark }),
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ isDarkMode: state.isDarkMode }),
    }
  )
);
