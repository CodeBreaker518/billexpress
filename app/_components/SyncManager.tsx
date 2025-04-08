'use client';

import { useEffect, useState, useRef } from 'react';
import { incomeService, expenseService } from '@bill/_firebase/financeService';
import { usePendingOperationsStore } from '@bill/_store/usePendingOperationsStore';
import { useAuthStore } from '@bill/_store/useAuthStore';
import { useAccountStore } from '@bill/_store/useAccountStore';

/**
 * Componente que maneja la sincronización automática de datos y resolución
 * de problemas sin intervención del usuario
 */
export default function SyncManager() {
  const { operations, cleanupInvalidOperations, clearAll } = usePendingOperationsStore();
  const { user } = useAuthStore();
  const { accounts } = useAccountStore();
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  
  // Referencias para controlar cuándo ejecutar ciertas funciones
  const lastSyncAttempt = useRef<number>(0);
  const syncInProgress = useRef<boolean>(false);
  const balanceUpdatedRef = useRef<boolean>(false);
  
  // Limpiar operaciones pendientes problemáticas al montar o cuando hay cambios
  useEffect(() => {
    console.log('SyncManager: Limpiando operaciones pendientes problemáticas');
    cleanupInvalidOperations();
    
    // Si hay muchas operaciones pendientes (más de 50), podría indicar un problema
    // Limpiar completamente para evitar que la app se vuelva inestable
    if (operations.length > 50) {
      console.warn('Demasiadas operaciones pendientes, limpiando completamente');
      clearAll();
    }
  }, [cleanupInvalidOperations, clearAll, operations.length]);

  // Recalcular saldos de cuentas periódicamente (una vez por sesión)
  useEffect(() => {
    const updateAccountBalances = async () => {
      if (user?.uid && accounts.length > 0 && !balanceUpdatedRef.current) {
        try {
          console.log('SyncManager: Recalculando saldos de cuentas automáticamente');
          const { updateAllAccountBalances } = await import('@bill/_firebase/accountService');
          await updateAllAccountBalances(user.uid);
          balanceUpdatedRef.current = true;
        } catch (error) {
          console.error('Error al actualizar saldos de cuentas:', error);
        }
      }
    };

    updateAccountBalances();
  }, [user, accounts]);

  // Monitorear los cambios en la conexión
  useEffect(() => {
    const handleOnline = () => {
      console.log('SyncManager: Conexión recuperada, iniciando sincronización');
      setIsOnline(true);
      syncData();
    };
    
    const handleOffline = () => {
      console.log('SyncManager: Conexión perdida');
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Verificar si hay operaciones pendientes al cargar
    if (isOnline && operations.length > 0) {
      syncData();
    }
    
    // Configurar sincronización periódica cada 5 minutos si hay operaciones pendientes
    const intervalId = setInterval(() => {
      if (isOnline && operations.length > 0 && !syncInProgress.current) {
        // Evitar sincronizaciones demasiado frecuentes
        const now = Date.now();
        if (now - lastSyncAttempt.current > 60000) { // Al menos 1 minuto entre intentos
          syncData();
        }
      }
    }, 300000); // 5 minutos
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [isOnline, operations]);

  // Sincronizar datos cuando cambia el usuario
  useEffect(() => {
    if (user && isOnline && operations.length > 0) {
      syncData();
    }
  }, [user]);

  // Función para sincronizar datos con manejo robusto de errores
  const syncData = async () => {
    if (!isOnline || syncInProgress.current) return;
    
    syncInProgress.current = true;
    lastSyncAttempt.current = Date.now();
    console.log(`SyncManager: Iniciando sincronización de ${operations.length} operaciones pendientes`);
    
    try {
      // Agrupar operaciones por tipo
      const hasIncomes = operations.some(op => op.collection === 'incomes');
      const hasExpenses = operations.some(op => op.collection === 'expenses');
      
      // Limpiar operaciones inválidas antes de sincronizar
      cleanupInvalidOperations();
      
      let syncSuccess = true;
      
      // Intentar sincronizar ingresos
      if (hasIncomes) {
        try {
          await incomeService.syncPendingItems();
        } catch (error) {
          console.error('Error sincronizando ingresos:', error);
          syncSuccess = false;
        }
      }
      
      // Intentar sincronizar gastos
      if (hasExpenses) {
        try {
          await expenseService.syncPendingItems();
        } catch (error) {
          console.error('Error sincronizando gastos:', error);
          syncSuccess = false;
        }
      }
      
      // Si hubo un fallo en alguna sincronización pero tenemos muchas operaciones pendientes
      // podría indicar un problema grave, limpiar todo para reiniciar el estado
      if (!syncSuccess && operations.length > 20) {
        console.warn('Múltiples fallos de sincronización con muchas operaciones pendientes, limpiando estado');
        clearAll();
      }
      
      // Después de sincronizar, recalcular los saldos para mantener la coherencia
      if (user?.uid && (hasIncomes || hasExpenses)) {
        try {
          const { updateAllAccountBalances } = await import('@bill/_firebase/accountService');
          await updateAllAccountBalances(user.uid);
        } catch (error) {
          console.error('Error al actualizar saldos después de sincronización:', error);
        }
      }
    } catch (error) {
      console.error('Error general durante sincronización:', error);
    } finally {
      syncInProgress.current = false;
    }
  };

  // No renderizamos nada, este componente solo gestiona la sincronización
  return null;
}