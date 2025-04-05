import { create } from 'zustand';

export interface Income {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  userId: string;
}

interface IncomeState {
  incomes: Income[];
  loading: boolean;
  setIncomes: (incomes: Income[]) => void;
  addIncome: (income: Income) => void;
  updateIncome: (income: Income) => void;
  deleteIncome: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useIncomeStore = create<IncomeState>((set) => ({
  incomes: [],
  loading: false,
  setIncomes: (incomes) => set({ incomes }),
  addIncome: (income) => set((state) => ({ 
    incomes: [...state.incomes, income] 
  })),
  updateIncome: (income) => set((state) => ({
    incomes: state.incomes.map((e) => 
      e.id === income.id ? income : e
    )
  })),
  deleteIncome: (id) => set((state) => ({
    incomes: state.incomes.filter((e) => e.id !== id)
  })),
  setLoading: (loading) => set({ loading }),
}));
