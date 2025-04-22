"use client";

import { useThemeStore } from "@bill/_store/useThemeStore";
import { Sun, Moon } from "lucide-react";
import { cn } from "../_lib/utils";

interface ThemeToggleProps {
  variant?: "default" | "landing";
  className?: string;
}

export default function ThemeToggle({ variant = "default", className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeStore();
  // Determinar si el tema efectivo es dark
  let isDark = false;
  if (theme === 'dark') isDark = true;
  else if (theme === 'system') {
    if (typeof window !== 'undefined') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  }

  // Ya no necesitamos el useEffect aquí, eso lo maneja ThemeProvider

  const baseButtonClasses =
    variant === "landing"
      ? "flex items-center justify-center w-9 h-9 rounded-full bg-gray-100/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 backdrop-blur-sm"
      : "flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200";

  return (
    <button onClick={toggleTheme} className={cn(baseButtonClasses, className, 'relative overflow-hidden')} aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}>
      <span className="absolute inset-0 flex items-center justify-center transition-all duration-300" style={{ opacity: isDark ? 1 : 0, transform: isDark ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
        <Moon className="w-5 h-5" />
      </span>
      <span className="absolute inset-0 flex items-center justify-center transition-all duration-300" style={{ opacity: isDark ? 0 : 1, transform: isDark ? 'rotate(90deg)' : 'rotate(0deg)' }}>
        <Sun className="w-5 h-5" />
      </span>
    </button>
  );
}
