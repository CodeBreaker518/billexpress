'use client';

import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  // Estado para almacenar si la media query coincide
  const [matches, setMatches] = useState<boolean>(false);
  
  useEffect(() => {
    // Crear media query
    const media = window.matchMedia(query);
    
    // Función para actualizar el estado
    const updateMatches = () => {
      setMatches(media.matches);
    };
    
    // Configurar el listener y ejecutar la comprobación inicial
    updateMatches();
    media.addEventListener('change', updateMatches);
    
    // Limpiar al desmontar
    return () => {
      media.removeEventListener('change', updateMatches);
    };
  }, [query]);
  
  return matches;
}
