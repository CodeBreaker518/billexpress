'use client';

import { useEffect, useState } from 'react';
import { incomeService, expenseService } from '@bill/_firebase/financeService';
import { usePendingOperationsStore } from '@bill/_store/usePendingOperationsStore';
import { useAuthStore } from '@bill/_store/useAuthStore';

/**
 * Componente que maneja la sincronización automática de datos
 * cuando se recupera la conexión a internet
 */
export default function SyncManager() {
  const { operations } = usePendingOperationsStore();
  const { user } = useAuthStore();
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Monitorear los cambios en la conexión
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncData();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Verificar si hay operaciones pendientes al cargar
    if (isOnline && operations.length > 0) {
      syncData();
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline, operations]);

  // Sincronizar datos cuando cambia el usuario
  useEffect(() => {
    if (user && isOnline && operations.length > 0) {
      syncData();
    }
  }, [user]);

  // Función para sincronizar datos
  const syncData = async () => {
    if (!isOnline) return;
    
    // Agrupar operaciones por tipo
    const hasIncomes = operations.some(op => op.collection === 'incomes');
    const hasExpenses = operations.some(op => op.collection === 'expenses');
    
    try {
      if (hasIncomes) {
        await incomeService.syncPendingItems();
      }
      
      if (hasExpenses) {
        await expenseService.syncPendingItems();
      }
    } catch (error) {
      console.error('Error during sync:', error);
    }
  };

  // No renderizamos nada, este componente solo gestiona la sincronización
  return null;
}