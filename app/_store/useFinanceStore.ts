"use client";

import { create } from "zustand";
import { format } from "date-fns";
import { useAuthStore } from "./useAuthStore";
import { useExpenseStore } from "./useExpenseStore";
import { useIncomeStore } from "./useIncomeStore";
import { useAccountStore } from "./useAccountStore";
import { getUserExpenses, addExpense, updateExpense, deleteExpense } from "@bill/_firebase/expenseService";
import { getUserIncomes, addIncome, updateIncome, deleteIncome } from "@bill/_firebase/incomeService";
import { getUserAccounts } from "@bill/_firebase/accountService";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "@bill/_lib/utils/categoryConfig";

// Usando las interfaces de los stores existentes
import { Income as IncomeStore } from "./useIncomeStore";
import { Expense as ExpenseStore } from "./useExpenseStore";

// Define categorías
const expenseCategories = ["Comida", "Transporte", "Entretenimiento", "Servicios", "Compras", "Salud", "Educación", "Vivienda", "Otros"];
const incomeCategories = ["Salario", "Freelance", "Inversiones", "Ventas", "Regalos", "Reembolsos", "Otros"];

// Tipo para el ítem en edición
interface EditingItem {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
  time?: string;
  accountId?: string;
}

// Tipo para estadísticas de categoría
export interface CategoryStat {
  category: string;
  amount: number;
  percentage: number;
  [key: string]: string | number; // Para compatibilidad con ChartData
}

// Tipo para el estado de finanzas
interface FinanceState {
  // Estados
  searchTerm: string;
  expensesByCategory: CategoryStat[];
  incomesByCategory: CategoryStat[];
  expenseCategoryColors: string[];
  incomeCategoryColors: string[];
  isFormOpen: boolean;
  isEditing: boolean;
  formType: "income" | "expense";
  currentItem: EditingItem;
  isLoading: boolean;

  // Acciones
  setSearchTerm: (term: string) => void;
  handleNewExpense: () => void;
  handleNewIncome: () => void;
  handleEdit: (_item: IncomeStore | ExpenseStore, _type: "income" | "expense") => void;
  handleDeleteExpense: (_id: string) => Promise<void>;
  handleDeleteIncome: (_id: string) => Promise<void>;
  handleCancel: () => void;
  handleSave: () => Promise<void>;
  handleFormChange: (field: string, value: unknown) => void;
  formatCurrency: (amount: number) => string;
  loadFinanceData: () => Promise<void>;
  calculateCategoryStats: () => void;
  setLoading: (loading: boolean) => void;

  // Constantes
  expenseCategories: string[];
  incomeCategories: string[];
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  // Estados iniciales
  searchTerm: "",
  expensesByCategory: [],
  incomesByCategory: [],
  expenseCategoryColors: [],
  incomeCategoryColors: [],
  isFormOpen: false,
  isEditing: false,
  formType: "income",
  isLoading: true,
  currentItem: {
    id: "",
    description: "",
    amount: 0,
    category: "",
    date: new Date(),
    time: format(new Date(), "HH:mm"),
  },

  // Categorías
  expenseCategories,
  incomeCategories,

  // Formatear moneda
  formatCurrency: (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  },

  // Establecer término de búsqueda
  setSearchTerm: (term: string) => {
    set({ searchTerm: term });
  },

  // Cargar datos de finanzas
  loadFinanceData: async () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ isLoading: false });
      return;
    }

    set({ isLoading: true });
    const expenseStore = useExpenseStore.getState();
    const incomeStore = useIncomeStore.getState();
    const accountStore = useAccountStore.getState();

    try {
      // Cargar gastos si no están ya cargados
      if (expenseStore.expenses.length === 0 && !expenseStore.loading) {
        const userExpenses = await getUserExpenses(user.uid);
        expenseStore.setExpenses(userExpenses);
      }

      // Cargar ingresos si no están ya cargados
      if (incomeStore.incomes.length === 0 && !incomeStore.loading) {
        const userIncomes = await getUserIncomes(user.uid);
        incomeStore.setIncomes(userIncomes);
      }

      // Cargar cuentas si no están ya cargadas
      if (accountStore.accounts.length === 0 && !accountStore.loading) {
        accountStore.setLoading(true);
        const userAccounts = await getUserAccounts(user.uid);
        accountStore.setAccounts(userAccounts);
        accountStore.setLoading(false);
      }

      // Calcular estadísticas de categorías
      get().calculateCategoryStats();
    } catch (error) {
      console.error("Error al cargar datos financieros:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Calcular estadísticas por categoría
  calculateCategoryStats: () => {
    const { expenses } = useExpenseStore.getState();
    const { incomes } = useIncomeStore.getState();

    // Calcular gastos por categoría
    if (expenses.length > 0) {
      const expensesTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);

      const expenseStats = expenseCategories
        .map((category) => {
          const categoryExpenses = expenses.filter((e) => e.category === category);
          const total = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
          const percentage = expensesTotal > 0 ? Math.round((total / expensesTotal) * 100) : 0;

          return {
            category,
            amount: total,
            percentage,
          };
        })
        .filter((cat) => cat.amount > 0)
        .sort((a, b) => b.amount - a.amount);

      // Asignar colores a categorías de gastos
      const expenseCategoryColors = expenseStats.map((item) => {
        const config = EXPENSE_CATEGORIES[item.category as keyof typeof EXPENSE_CATEGORIES] || EXPENSE_CATEGORIES["Otros"];
        return config.color;
      });

      set({
        expensesByCategory: expenseStats,
        expenseCategoryColors,
      });
    } else {
      set({
        expensesByCategory: [],
        expenseCategoryColors: [],
      });
    }

    // Calcular ingresos por categoría
    if (incomes.length > 0) {
      const incomesTotal = incomes.reduce((sum, income) => sum + income.amount, 0);

      const incomeStats = incomeCategories
        .map((category) => {
          const categoryIncomes = incomes.filter((i) => i.category === category);
          const total = categoryIncomes.reduce((sum, i) => sum + i.amount, 0);
          const percentage = incomesTotal > 0 ? Math.round((total / incomesTotal) * 100) : 0;

          return {
            category,
            amount: total,
            percentage,
          };
        })
        .filter((cat) => cat.amount > 0)
        .sort((a, b) => b.amount - a.amount);

      // Asignar colores a categorías de ingresos
      const incomeCategoryColors = incomeStats.map((item) => {
        const config = INCOME_CATEGORIES[item.category as keyof typeof INCOME_CATEGORIES] || INCOME_CATEGORIES["Otros"];
        return config.color;
      });

      set({
        incomesByCategory: incomeStats,
        incomeCategoryColors,
      });
    } else {
      set({
        incomesByCategory: [],
        incomeCategoryColors: [],
      });
    }
  },

  // Abrir formulario para nuevo gasto
  handleNewExpense: () => {
    const now = new Date();
    set({
      currentItem: {
        id: "",
        description: "",
        amount: 0,
        category: "Otros",
        date: now,
        time: format(now, "HH:mm"),
      },
      formType: "expense",
      isEditing: false,
      isFormOpen: true,
    });
  },

  // Abrir formulario para nuevo ingreso
  handleNewIncome: () => {
    const now = new Date();
    set({
      currentItem: {
        id: "",
        description: "",
        amount: 0,
        category: "Salario",
        date: now,
        time: format(now, "HH:mm"),
      },
      formType: "income",
      isEditing: false,
      isFormOpen: true,
    });
  },

  // Editar un item (gasto o ingreso)
  handleEdit: (_item: IncomeStore | ExpenseStore, _type: "income" | "expense") => {
    const itemDate = new Date(_item.date);
    set({
      currentItem: {
        id: _item.id,
        description: _item.description,
        amount: _item.amount,
        category: _item.category,
        date: itemDate,
        time: format(itemDate, "HH:mm"),
        accountId: "accountId" in _item && typeof _item.accountId === "string" ? _item.accountId : undefined,
      },
      formType: _type,
      isEditing: true,
      isFormOpen: true,
    });
  },

  // Eliminar un gasto
  handleDeleteExpense: async (_id: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const { deleteExpense: deleteLocalExpense } = useExpenseStore.getState();

    try {
      await deleteExpense(_id);
      deleteLocalExpense(_id);
      // Recalcular estadísticas
      get().calculateCategoryStats();
    } catch (error) {
      console.error("Error al eliminar gasto:", error);
    }
  },

  // Eliminar un ingreso
  handleDeleteIncome: async (_id: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const { deleteIncome: deleteLocalIncome } = useIncomeStore.getState();

    try {
      await deleteIncome(_id);
      deleteLocalIncome(_id);
      // Recalcular estadísticas
      get().calculateCategoryStats();
    } catch (error) {
      console.error("Error al eliminar ingreso:", error);
    }
  },

  // Cerrar formulario
  handleCancel: () => {
    set({ isFormOpen: false });
  },

  // Guardar (crear o actualizar)
  handleSave: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const { currentItem, formType, isEditing } = get();
    const incomeStore = useIncomeStore.getState();
    const expenseStore = useExpenseStore.getState();

    // Crear la fecha completa combinando fecha y hora
    const dateStr = format(currentItem.date, "yyyy-MM-dd");
    const timeStr = currentItem.time || "00:00";
    const dateTimeStr = `${dateStr}T${timeStr}:00`;
    const completeDate = new Date(dateTimeStr);

    try {
      if (formType === "income") {
        if (isEditing) {
          // Actualizar ingreso existente
          const updatedIncome: IncomeStore = {
            id: currentItem.id,
            description: currentItem.description,
            amount: currentItem.amount,
            category: currentItem.category,
            date: completeDate,
            userId: user.uid,
            accountId: currentItem.accountId,
          };

          await updateIncome(updatedIncome);
          incomeStore.updateIncome(updatedIncome);
        } else {
          // Crear nuevo ingreso
          const newIncomeData = {
            description: currentItem.description,
            amount: currentItem.amount,
            category: currentItem.category,
            date: completeDate,
            userId: user.uid,
            accountId: currentItem.accountId,
          };

          const newIncome = await addIncome(newIncomeData);
          if (newIncome) {
            incomeStore.addIncome(newIncome as IncomeStore);
          }
        }
      } else {
        if (isEditing) {
          // Actualizar gasto existente
          const updatedExpense: ExpenseStore = {
            id: currentItem.id,
            description: currentItem.description,
            amount: currentItem.amount,
            category: currentItem.category,
            date: completeDate,
            userId: user.uid,
            accountId: currentItem.accountId,
          };

          await updateExpense(updatedExpense);
          expenseStore.updateExpense(updatedExpense);
        } else {
          // Crear nuevo gasto
          const newExpenseData = {
            description: currentItem.description,
            amount: currentItem.amount,
            category: currentItem.category,
            date: completeDate,
            userId: user.uid,
            accountId: currentItem.accountId,
          };

          const newExpense = await addExpense(newExpenseData);
          if (newExpense) {
            expenseStore.addExpense(newExpense as ExpenseStore);
          }
        }
      }

      // Cerrar formulario tras éxito
      set({ isFormOpen: false });

      // Recalcular estadísticas
      get().calculateCategoryStats();
    } catch (error) {
      console.error(`Error al guardar ${formType}:`, error);
    }
  },

  // Manejar cambios en el formulario
  handleFormChange: (field: string, value: unknown) => {
    const { currentItem } = get();
    set({
      currentItem: { ...currentItem, [field]: value },
    });
  },

  // Nueva acción para controlar el estado de carga
  setLoading: (loading: boolean) => set({ isLoading: loading }),
}));
