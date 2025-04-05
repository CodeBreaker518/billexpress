'use client';

import { useState, useEffect } from 'react';
import { Flex, Badge, Text } from '@tremor/react';
import { Wifi, WifiOff } from 'lucide-react';

/**
 * Componente que muestra el estado de la conexión a internet
 * y notifica si la aplicación está en modo offline
 */
export default function ConnectivityStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Estado inicial basado en navigator.onLine
    setIsOnline(navigator.onLine);
    
    // Manejar cambios de estado de conexión
    const handleOnline = () => {
      setIsOnline(true);
      setLastSyncTime(new Date());
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    // Agregar event listeners para detectar cambios de conectividad
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Establecer la hora inicial de sincronización si estamos online
    if (isOnline) {
      setLastSyncTime(new Date());
    }
    
    // Limpiar event listeners al desmontar
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Formatear la hora de última sincronización
  const formatLastSync = () => {
    if (!lastSyncTime) return 'Nunca';
    
    return lastSyncTime.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="relative">
      <div 
        className="cursor-pointer" 
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Flex justifyContent="start" alignItems="center" className="gap-2">
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              <Badge color="green" size="xs">Online</Badge>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-amber-500" />
              <Badge color="amber" size="xs">Offline</Badge>
            </>
          )}
        </Flex>
      </div>
      
      {showTooltip && (
        <div className="absolute z-50 p-2 bg-gray-800 text-white text-xs rounded shadow-lg mt-1 w-52">
          {isOnline 
            ? `Última sincronización: ${formatLastSync()}` 
            : "Modo offline - Los cambios se guardarán cuando recuperes conexión"}
        </div>
      )}
    </div>
  );
} 