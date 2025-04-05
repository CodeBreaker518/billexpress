'use client';

import { useEffect, useState } from 'react';
import { syncPendingIncomes } from '@bill/_firebase/incomeService';
import { syncPendingExpenses } from '@bill/_firebase/expenseService';
import { usePendingOperationsStore } from '@bill/_store/usePendingOperationsStore';
import { useAuthStore } from '@bill/_store/useAuthStore';

/**
 * Componente que maneja la sincronización automática de datos
 * cuando se recupera la conexión a internet
 */
export default function SyncManager() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const { user } = useAuthStore();
  const pendingOperations = usePendingOperationsStore(state => state.operations);
  
  // Almacenar el ID del usuario para recuperarlo en caso de reconexión
  useEffect(() => {
    if (user?.uid) {
      localStorage.setItem('current-user-id', user.uid);
    }
  }, [user]);
  
  // Sincronizar cuando se recupera la conexión
  useEffect(() => {
    // Estado inicial
    setIsOnline(navigator.onLine);
    
    const handleOnline = async () => {
      setIsOnline(true);
      
      if (pendingOperations.length > 0 && !isSyncing && user) {
        try {
          setIsSyncing(true);
          await syncData();
        } finally {
          setIsSyncing(false);
        }
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    // Agregar event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Limpiar event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingOperations.length, isSyncing, user]);
  
  // Función para sincronizar todos los tipos de datos
  const syncData = async () => {
    try {
      // Sincronizar ingresos pendientes
      await syncPendingIncomes();
      
      // Sincronizar gastos pendientes
      await syncPendingExpenses();
      
      console.log('Sincronización completada');
    } catch (error) {
      console.error('Error en sincronización:', error);
    }
  };
  
  // Este componente no renderiza nada visible
  return null;
} 