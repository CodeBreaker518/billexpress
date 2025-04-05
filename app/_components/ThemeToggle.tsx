'use client';

import { useThemeStore } from '@bill/_store/useThemeStore';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useThemeStore();
  
  // Ya no necesitamos el useEffect aquí, eso lo maneja ThemeProvider
  
  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
      aria-label={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {isDarkMode ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </button>
  );
}
