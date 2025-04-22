"use client";

import { create } from 'zustand';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@bill/_firebase/config';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  initialized: boolean;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,
  isAdmin: false,
  initialized: false,
  logout: async () => {
    try {
      await signOut(auth);
      set({ user: null });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  },
}));

if (typeof window !== "undefined") {
  onAuthStateChanged(auth, (user) => {
    useAuthStore.setState({
      user,
      loading: false,
      initialized: true,
      isAdmin: user?.email === "admin@billexpress.com",
    });
  });
}