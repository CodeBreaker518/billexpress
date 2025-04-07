"use client";

import { useState, useEffect } from "react";

/**
 * Hook personalizado para monitorear el estado de la conexión a internet
 * @returns {boolean} Estado actual de la conexión (true: online, false: offline)
 */
export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Función para actualizar el estado cuando cambia la conexión
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Suscribirse a eventos de conexión
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Limpiar suscripciones al desmontar
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
