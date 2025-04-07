'use client';

import { create } from 'zustand';
import { FinanceItem } from '@bill/_firebase/financeService';

interface FinanceStore<T extends FinanceItem> {
  items: T[];
  loading: boolean;
  setItems: (items: T[]) => void;
  addItem: (item: T) => void;
  updateItem: (item: T) => void;
  deleteItem: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

// Factory para crear stores financieros (ingresos o gastos)
export const createFinanceStore = <T extends FinanceItem>(storeName: string) => 
  create<FinanceStore<T>>((set) => ({
    items: [],
    loading: false,
    
    setItems: (items: T[]) => set({ items }),
    
    addItem: (item: T) => set((state) => ({
      items: [...state.items, item]
    })),
    
    updateItem: (updatedItem: T) => set((state) => ({
      items: state.items.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      )
    })),
    
    deleteItem: (id: string) => set((state) => ({
      items: state.items.filter(item => item.id !== id)
    })),
    
    setLoading: (loading: boolean) => set({ loading })
  }));

// Tipos específicos para gastos e ingresos
export interface Expense extends FinanceItem {}
export interface Income extends FinanceItem {}

// Crear instancias de los stores
export const useExpenseStore = createFinanceStore<Expense>('expenses');
export const useIncomeStore = createFinanceStore<Income>('incomes');
