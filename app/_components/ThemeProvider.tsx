'use client';

import { useEffect } from "react";
import { useThemeStore } from "@bill/_store/useThemeStore";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isDarkMode, setDarkMode } = useThemeStore();

  // Detectar preferencia del sistema al cargar - solo se ejecuta una vez
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const userPrefersDark = mediaQuery.matches;
    
    // Aplicar el tema del sistema si no hay preferencia guardada
    if (typeof window !== 'undefined' && !localStorage.getItem('theme-storage')) {
      setDarkMode(userPrefersDark);
    }
    
    // Escuchar cambios en la preferencia del sistema
    const handleChange = (e: MediaQueryListEvent) => {
      // Solo actualizamos si no hay preferencia guardada
      if (!localStorage.getItem('theme-storage')) {
        setDarkMode(e.matches);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [setDarkMode]);
  
  // Aplicar clase dark al html cuando cambia isDarkMode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return <>{children}</>;
}
