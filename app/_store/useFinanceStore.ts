'use client';

import { create } from 'zustand';
import { format } from 'date-fns';
import { useAuthStore } from './useAuthStore';
import { useExpenseStore } from './useExpenseStore';
import { useIncomeStore } from './useIncomeStore';
import { useAccountStore } from './useAccountStore';
import { getUserExpenses, addExpense, updateExpense, deleteExpense } from '@bill/_firebase/expenseService';
import { getUserIncomes, addIncome, updateIncome, deleteIncome } from '@bill/_firebase/incomeService';
import { getUserAccounts } from '@bill/_firebase/accountService';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, incomeCategories as defaultIncomeCategories, expenseCategories as defaultExpenseCategories } from '@bill/_lib/utils/categoryConfig';

// Usando las interfaces de los stores existentes
import { Income as IncomeStore } from './useIncomeStore';
import { Expense as ExpenseStore } from './useExpenseStore';

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
  formType: 'income' | 'expense';
  currentItem: EditingItem;
  isLoading: boolean;

  // Acciones
  setSearchTerm: (term: string) => void;
  handleNewExpense: () => void;
  handleNewIncome: () => void;
  handleEdit: (_item: IncomeStore | ExpenseStore, _type: 'income' | 'expense') => void;
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
  searchTerm: '',
  expensesByCategory: [],
  incomesByCategory: [],
  expenseCategoryColors: [],
  incomeCategoryColors: [],
  isFormOpen: false,
  isEditing: false,
  formType: 'income',
  isLoading: true,
  currentItem: {
    id: '',
    description: '',
    amount: 0,
    category: '',
    date: new Date(),
    time: format(new Date(), 'HH:mm'),
  },

  // Categorías
  expenseCategories: defaultExpenseCategories,
  incomeCategories: defaultIncomeCategories,

  // Formatear moneda
  formatCurrency: (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
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
      console.log(`Cargando datos financieros para usuario: ${user.uid}`);

      // Cargar gastos si no están ya cargados
      if (expenseStore.expenses.length === 0 && !expenseStore.loading) {
        const userExpenses = await getUserExpenses(user.uid);
        // SEGURIDAD: Filtrar explícitamente por userId
        const verifiedExpenses = userExpenses.filter((exp) => exp.userId === user.uid);

        if (verifiedExpenses.length !== userExpenses.length) {
          console.error(`¡ALERTA DE SEGURIDAD! Se detectaron ${userExpenses.length - verifiedExpenses.length} gastos que no pertenecen al usuario actual.`);
        }

        expenseStore.setExpenses(verifiedExpenses);
        console.log(`Cargados ${verifiedExpenses.length} gastos para el usuario ${user.uid}`);
      }

      // Cargar ingresos si no están ya cargados
      if (incomeStore.incomes.length === 0 && !incomeStore.loading) {
        const userIncomes = await getUserIncomes(user.uid);
        // SEGURIDAD: Filtrar explícitamente por userId
        const verifiedIncomes = userIncomes.filter((inc) => inc.userId === user.uid);

        if (verifiedIncomes.length !== userIncomes.length) {
          console.error(`¡ALERTA DE SEGURIDAD! Se detectaron ${userIncomes.length - verifiedIncomes.length} ingresos que no pertenecen al usuario actual.`);
        }

        incomeStore.setIncomes(verifiedIncomes);
        console.log(`Cargados ${verifiedIncomes.length} ingresos para el usuario ${user.uid}`);
      }

      // Cargar cuentas si no están ya cargadas
      if (accountStore.accounts.length === 0 && !accountStore.loading) {
        accountStore.setLoading(true);
        const userAccounts = await getUserAccounts(user.uid);
        // SEGURIDAD: Filtrar explícitamente por userId
        const verifiedAccounts = userAccounts.filter((acc) => acc.userId === user.uid);

        if (verifiedAccounts.length !== userAccounts.length) {
          console.error(`¡ALERTA DE SEGURIDAD! Se detectaron ${userAccounts.length - verifiedAccounts.length} cuentas que no pertenecen al usuario actual.`);
        }

        accountStore.setAccounts(verifiedAccounts);
        accountStore.setLoading(false);
        console.log(`Cargadas ${verifiedAccounts.length} cuentas para el usuario ${user.uid}`);
      }

      // Calcular estadísticas de categorías
      get().calculateCategoryStats();
    } catch (error) {
      console.error('Error al cargar datos financieros:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Calcular estadísticas por categoría
  calculateCategoryStats: () => {
    const { expenses } = useExpenseStore.getState();
    const { incomes } = useIncomeStore.getState();
    // Obtener las listas actualizadas desde el estado del store
    const currentExpenseCategories = get().expenseCategories;
    const currentIncomeCategories = get().incomeCategories;

    // Calcular gastos por categoría
    if (expenses.length > 0) {
      const expensesTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);

      const expenseStats = currentExpenseCategories
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
        const config = EXPENSE_CATEGORIES[item.category as keyof typeof EXPENSE_CATEGORIES] || EXPENSE_CATEGORIES['Otros'];
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

      const incomeStats = currentIncomeCategories
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
        const config = INCOME_CATEGORIES[item.category as keyof typeof INCOME_CATEGORIES] || INCOME_CATEGORIES['Otros'];
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
    // Asegurarse de usar la lista actualizada aquí también
    const defaultCategory = defaultExpenseCategories[0] || 'Otros';
    set({
      currentItem: {
        id: '',
        description: '',
        amount: 0,
        category: defaultCategory,
        date: now,
        time: format(now, 'HH:mm'),
      },
      formType: 'expense',
      isEditing: false,
      isFormOpen: true,
    });
  },

  // Abrir formulario para nuevo ingreso
  handleNewIncome: () => {
    const now = new Date();
    // Asegurarse de usar la lista actualizada aquí también
    const defaultCategory = defaultIncomeCategories[0] || 'Otros';
    set({
      currentItem: {
        id: '',
        description: '',
        amount: 0,
        category: defaultCategory, // <-- Usar la lista actualizada
        date: now,
        time: format(now, 'HH:mm'),
      },
      formType: 'income',
      isEditing: false,
      isFormOpen: true,
    });
  },

  // Editar un item (gasto o ingreso)
  handleEdit: (_item: IncomeStore | ExpenseStore, _type: 'income' | 'expense') => {
    // Obtener lista de cuentas actuales
    const { accounts } = useAccountStore.getState();
    // Si el movimiento es huérfano (accountId null/undefined o no existe en cuentas), no permitir edición
    if (!_item.accountId || !accounts.some(acc => acc.id === _item.accountId)) {
      alert('No puedes editar ni reasignar un movimiento asociado a una cuenta eliminada. El historial se conserva solo para consulta.');
      return;
    }
    const itemDate = new Date(_item.date);
    set({
      currentItem: {
        id: _item.id,
        description: _item.description,
        amount: _item.amount,
        category: _item.category,
        date: itemDate,
        time: format(itemDate, 'HH:mm'),
        accountId: 'accountId' in _item && typeof _item.accountId === 'string' ? _item.accountId : undefined,
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
      // Pasar el userId para verificación de seguridad
      await deleteExpense(_id, user.uid);
      deleteLocalExpense(_id);
      // Recalcular estadísticas
      get().calculateCategoryStats();
    } catch (error) {
      console.error('Error al eliminar gasto:', error);
    }
  },

  // Eliminar un ingreso
  handleDeleteIncome: async (_id: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const { deleteIncome: deleteLocalIncome } = useIncomeStore.getState();

    try {
      // Pasar el userId para verificación de seguridad
      await deleteIncome(_id, user.uid);
      deleteLocalIncome(_id);
      // Recalcular estadísticas
      get().calculateCategoryStats();
    } catch (error) {
      console.error('Error al eliminar ingreso:', error);
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
    const dateStr = format(currentItem.date, 'yyyy-MM-dd');
    const timeStr = currentItem.time || '00:00';
    const dateTimeStr = `${dateStr}T${timeStr}:00`;
    const completeDate = new Date(dateTimeStr);

    try {
      if (formType === 'income') {
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
