import { create } from 'zustand';

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  userId: string;
}

interface ExpenseState {
  expenses: Expense[];
  loading: boolean;
  setExpenses: (expenses: Expense[]) => void;
  addExpense: (expense: Expense) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useExpenseStore = create<ExpenseState>((set) => ({
  expenses: [],
  loading: false,
  setExpenses: (expenses) => set({ expenses }),
  addExpense: (expense) => set((state) => ({ 
    expenses: [...state.expenses, expense] 
  })),
  updateExpense: (expense) => set((state) => ({
    expenses: state.expenses.map((e) => 
      e.id === expense.id ? expense : e
    )
  })),
  deleteExpense: (id) => set((state) => ({
    expenses: state.expenses.filter((e) => e.id !== id)
  })),
  setLoading: (loading) => set({ loading }),
}));