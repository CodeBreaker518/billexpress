"use client";

import { ReactNode } from "react";

interface TranslationProps {
  children: ReactNode;
}

/**
 * Componente de traducción simple.
 * En una implementación más avanzada, podría usar un sistema de i18n,
 * pero por ahora simplemente muestra el texto proporcionado en español.
 */
export function t({ children }: TranslationProps) {
  return <>{children}</>;
}

/**
 * Función de traducción para usar con strings.
 * Permite el uso directo como: t("texto a traducir")
 */
export const translate = (text: string): string => {
  return text;
};
