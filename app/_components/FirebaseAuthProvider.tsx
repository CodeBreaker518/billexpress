'use client';

import { ReactNode, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@bill/_firebase/config';
import { useAuthStore } from '@bill/_store/useAuthStore';

interface FirebaseAuthProviderProps {
  children: ReactNode;
}

export default function FirebaseAuthProvider({ children }: FirebaseAuthProviderProps) {
  const { setUser, setLoading, setInitialized } = useAuthStore();

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
    
    // Suscribirse a cambios de autenticación
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Al cambiar el usuario, simplemente actualizar el estado
      setUser(user);
      setLoading(false);
      setInitialized(true);
    });

    return () => unsubscribe();
  }, [setUser, setLoading, setInitialized]);

  return <>{children}</>;
} 