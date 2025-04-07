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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      setInitialized(true);
    });

    return () => unsubscribe();
  }, [setUser, setLoading, setInitialized]);

  return <>{children}</>;
} 