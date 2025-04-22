'use client';

import { ReactNode, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@bill/_firebase/config';
import { useAuthStore } from '@bill/_store/useAuthStore';

interface FirebaseAuthProviderProps {
  children: ReactNode;
}

export default function FirebaseAuthProvider({ children }: FirebaseAuthProviderProps) {
  useEffect(() => {
    // Limpiar estado cuando se monta el componente (inicio de aplicación)
    const clearStores = async () => {
      try {
        const { useAccountStore } = await import("@bill/_store/useAccountStore");
        const { useIncomeStore } = await import("@bill/_store/useIncomeStore");
        const { useExpenseStore } = await import("@bill/_store/useExpenseStore");
        
        useAccountStore.getState().setAccounts([]);
        useIncomeStore.getState().setIncomes([]);
        useExpenseStore.getState().setExpenses([]);
      } catch (error) {
        console.error("Error al limpiar stores:", error);
      }
    };
    
    clearStores();
  }, []);

  return <>{children}</>;
} 