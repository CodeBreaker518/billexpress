"use client";

import { create } from "zustand";
import { Account } from "@bill/_firebase/accountService";

interface AccountStore {
  accounts: Account[];
  activeAccountId: string | null;
  loading: boolean;

  setAccounts: (accounts: Account[]) => void;
  setActiveAccountId: (id: string | null) => void;
  addAccount: (account: Account) => void;
  updateAccount: (account: Account) => void;
  deleteAccount: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useAccountStore = create<AccountStore>((set) => ({
  accounts: [],
  activeAccountId: null,
  loading: false,

  setAccounts: (accounts: Account[]) => {
    // Si hay cuentas, establecer la primera como activa por defecto si no hay ninguna seleccionada
    const defaultAccount = accounts.find((acc) => acc.isDefault);

    set((state) => ({
      accounts,
      activeAccountId: state.activeAccountId || (defaultAccount ? defaultAccount.id : accounts.length > 0 ? accounts[0].id : null),
    }));
  },

  setActiveAccountId: (id: string | null) => set({ activeAccountId: id }),

  addAccount: (account: Account) =>
    set((state) => ({
      accounts: [...state.accounts, account],
    })),

  updateAccount: (updatedAccount: Account) =>
    set((state) => ({
      accounts: state.accounts.map((account) => (account.id === updatedAccount.id ? updatedAccount : account)),
    })),

  deleteAccount: (id: string) =>
    set((state) => {
      const newAccounts = state.accounts.filter((account) => account.id !== id);
      const defaultAccount = newAccounts.find((acc) => acc.isDefault);

      return {
        accounts: newAccounts,
        activeAccountId: state.activeAccountId === id ? (defaultAccount ? defaultAccount.id : newAccounts.length > 0 ? newAccounts[0].id : null) : state.activeAccountId,
      };
    }),

  setLoading: (loading: boolean) => set({ loading }),
}));
