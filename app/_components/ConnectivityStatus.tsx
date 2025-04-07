'use client';

import { useEffect, useState } from 'react';
import { Badge } from './ui/badge';
import { Flex } from './ui/flex';
import { Text } from './ui/typography';
import { cn } from '../../app/_lib/utils';

/**
 * Componente que muestra el estado de la conexión a internet
 * y notifica si la aplicación está en modo offline
 */
export default function ConnectivityStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Función para actualizar el estado
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Verificar estado inicial
    updateOnlineStatus();

    // Añadir event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Cleanup
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
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

  if (isOnline) {
    return (
      <Flex alignItems="center" gap="2" className="py-1">
        <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">En línea</Badge>
        <Text className="text-xs">Sincronización automática activa</Text>
      </Flex>
    );
  }

  return (
    <Flex alignItems="center" gap="2" className="py-1">
      <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-200">Sin conexión</Badge>
      <Text className="text-xs">Los cambios se guardarán cuando vuelvas a estar en línea</Text>
    </Flex>
  );
} 