'use client';

import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  // Estado para almacenar si la media query coincide
  const [matches, setMatches] = useState<boolean>(false);
  
  useEffect(() => {
    // Crear media query
    const media = window.matchMedia(query);
    
    // Verificar coincidencia inicial
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    // Callback para actualizar el estado cuando cambia la media query
    const listener = () => setMatches(media.matches);
    
    // Agregar el evento listener
    media.addEventListener('change', listener);
    
    // Limpiar el listener cuando el componente se desmonta
    return () => media.removeEventListener('change', listener);
  }, [query, matches]);
  
  return matches;
}
