"use client";

import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, Timestamp, serverTimestamp } from "firebase/firestore";
import { db } from "./config";
import { usePendingOperationsStore } from "@bill/_store/usePendingOperationsStore";
import { useAccountStore } from "@bill/_store/useAccountStore";
import { Account, updateAccount } from "./accountService";

// Definición de tipos para elementos financieros
export interface FinanceItem {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
  userId: string;
  accountId?: string;
}

// Verificar si hay conexión a internet
export const isOnline = (): boolean => {
  return typeof navigator !== "undefined" && navigator.onLine;
};

// Factory para crear servicios financieros (ingresos o gastos)
export const createFinanceService = (entityType: "incomes" | "expenses") => {
  // Colección de Firebase
  const collection_ref = collection(db, entityType);
  // Clave para localStorage
  const localStorageKey = `${entityType}-data`;

  // Obtener elementos para un usuario
  const getUserItems = async (userId: string): Promise<FinanceItem[]> => {
    try {
      const q = query(collection_ref, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);

      const items = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          amount: data.amount,
          category: data.category,
          description: data.description,
          date: data.date.toDate(),
          userId: data.userId,
          accountId: data.accountId || undefined,
        } as FinanceItem;
      });

      // Guardar en localStorage para acceso offline
      if (items.length > 0) {
        localStorage.setItem(localStorageKey, JSON.stringify(items));
      }

      return items;
    } catch (error) {
      console.error(`Error fetching ${entityType}:`, error);
      // Si hay error, intentar recuperar del almacenamiento local
      const localData = localStorage.getItem(localStorageKey);
      if (localData) {
        try {
          const parsedData = JSON.parse(localData);
          return parsedData.filter((item: FinanceItem) => item.userId === userId);
        } catch (e) {
          console.error(`Error parsing local ${entityType}:`, e);
        }
      }

      return [];
    }
  };

  // Añadir un nuevo elemento
  const addItem = async (item: Omit<FinanceItem, "id">): Promise<FinanceItem> => {
    // Crear un ID temporal para operaciones offline
    const tempId = `temp_${Date.now()}`;

    try {
      // Guardar en localStorage para recuperación offline
      const localData = localStorage.getItem(localStorageKey) || "[]";
      const parsedData = JSON.parse(localData);

      // Crear nuevo elemento con ID temporal si estamos offline
      const newItem = {
        ...item,
        id: tempId,
        date: new Date(item.date), // Asegurar que sea objeto Date
      };

      // Actualizar datos locales
      localStorage.setItem(localStorageKey, JSON.stringify([...parsedData, newItem]));

      // Si estamos online, intentar guardar en Firebase
      if (isOnline()) {
        try {
          const docRef = await addDoc(collection_ref, {
            ...item,
            date: Timestamp.fromDate(item.date),
            createdAt: serverTimestamp(),
          });

          // Actualizar datos locales con el ID correcto
          const updatedData = parsedData.map((localItem: any) => (localItem.id === tempId ? { ...item, id: docRef.id } : localItem));
          localStorage.setItem(localStorageKey, JSON.stringify(updatedData));

          return {
            ...item,
            id: docRef.id,
          };
        } catch (error) {
          console.error(`Error adding ${entityType.slice(0, -1)} to Firebase:`, error);

          // Registrar operación pendiente para sincronizar después
          usePendingOperationsStore.getState().addOperation({
            operationType: "add",
            collection: entityType,
            data: newItem,
          });

          return newItem;
        }
      } else {
        // Si estamos offline, registrar para sincronización futura
        usePendingOperationsStore.getState().addOperation({
          operationType: "add",
          collection: entityType,
          data: newItem,
        });

        return newItem;
      }
    } catch (error) {
      console.error(`Error in add${entityType.slice(0, -1)}:`, error);
      // Devolver algo para que la UI no se rompa
      return {
        ...item,
        id: tempId,
      };
    }
  };

  // Actualizar un elemento existente
  const updateItem = async (item: FinanceItem): Promise<void> => {
    try {
      // Actualizar datos locales primero
      const localData = localStorage.getItem(localStorageKey) || "[]";
      const parsedData = JSON.parse(localData);
      const updatedData = parsedData.map((localItem: any) => (localItem.id === item.id ? item : localItem));
      localStorage.setItem(localStorageKey, JSON.stringify(updatedData));

      // Si estamos online, actualizar en Firebase
      if (isOnline()) {
        try {
          const itemRef = doc(db, entityType, item.id);
          await updateDoc(itemRef, {
            amount: item.amount,
            category: item.category,
            description: item.description,
            date: Timestamp.fromDate(item.date),
            accountId: item.accountId || null,
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          console.error(`Error updating ${entityType.slice(0, -1)} in Firebase:`, error);
          // Registrar operación pendiente
          usePendingOperationsStore.getState().addOperation({
            operationType: "update",
            collection: entityType,
            data: item,
          });
        }
      } else {
        // Si estamos offline, registrar operación pendiente
        usePendingOperationsStore.getState().addOperation({
          operationType: "update",
          collection: entityType,
          data: item,
        });
      }
    } catch (error) {
      console.error(`Error in update${entityType.slice(0, -1)}:`, error);
      throw error;
    }
  };

  // Eliminar un elemento
  const deleteItem = async (id: string): Promise<void> => {
    try {
      // Eliminar de datos locales primero
      const localData = localStorage.getItem(localStorageKey) || "[]";
      const parsedData = JSON.parse(localData);
      const filteredData = parsedData.filter((item: any) => item.id !== id);
      localStorage.setItem(localStorageKey, JSON.stringify(filteredData));

      // Si estamos online, eliminar de Firebase
      if (isOnline()) {
        try {
          const itemRef = doc(db, entityType, id);
          await deleteDoc(itemRef);
        } catch (error) {
          console.error(`Error deleting ${entityType.slice(0, -1)} from Firebase:`, error);
          // Registrar operación pendiente
          usePendingOperationsStore.getState().addOperation({
            operationType: "delete",
            collection: entityType,
            data: id,
          });
        }
      } else {
        // Si estamos offline, registrar operación pendiente
        usePendingOperationsStore.getState().addOperation({
          operationType: "delete",
          collection: entityType,
          data: id,
        });
      }
    } catch (error) {
      console.error(`Error in delete${entityType.slice(0, -1)}:`, error);
      throw error;
    }
  };

  // Sincronizar operaciones pendientes
  const syncPendingItems = async (): Promise<void> => {
    if (!isOnline()) return; // Solo intentar sincronizar si estamos online

    const pendingOps = usePendingOperationsStore.getState().operations.filter((op) => op.collection === entityType);

    if (pendingOps.length === 0) return;

    // Procesar cada operación pendiente
    for (const op of pendingOps) {
      try {
        if (op.operationType === "add") {
          const { id, ...rest } = op.data;
          await addDoc(collection_ref, {
            ...rest,
            date: Timestamp.fromDate(new Date(rest.date)),
            createdAt: serverTimestamp(),
            syncedAt: serverTimestamp(),
          });
        } else if (op.operationType === "update") {
          const { id, ...rest } = op.data;
          const itemRef = doc(db, entityType, id);
          await updateDoc(itemRef, {
            ...rest,
            date: Timestamp.fromDate(new Date(rest.date)),
            updatedAt: serverTimestamp(),
            syncedAt: serverTimestamp(),
          });
        } else if (op.operationType === "delete") {
          const itemRef = doc(db, entityType, op.data);
          await deleteDoc(itemRef);
        }

        // Eliminar la operación de la cola después de completarla
        usePendingOperationsStore.getState().removeOperation(op.id);
      } catch (error) {
        console.error(`Error syncing operation ${op.id}:`, error);
        // Continuamos con la siguiente operación incluso si esta falla
      }
    }

    // Recargar datos después de sincronizar
    const localData = localStorage.getItem("current-user-id");
    if (localData) {
      try {
        await getUserItems(localData);
      } catch (e) {
        console.error(`Error refreshing ${entityType} after sync:`, e);
      }
    }
  };

  // Retornar el objeto de servicio
  return {
    getUserItems,
    addItem,
    updateItem,
    deleteItem,
    syncPendingItems,
  };
};

// Crear instancias de los servicios
export const expenseService = createFinanceService("expenses");
export const incomeService = createFinanceService("incomes");

// Función para contar cuántos registros quedarían sin una cuenta asignada si se elimina esta cuenta
export const countOrphanedFinances = async (
  accountId: string
): Promise<{
  orphanedCount: number;
  orphanedIncomesCount: number;
  orphanedExpensesCount: number;
}> => {
  try {
    // Verificar localStorage para ingresos
    const incomesData = localStorage.getItem("incomes-data") || "[]";
    const parsedIncomes = JSON.parse(incomesData);
    const orphanedIncomes = parsedIncomes.filter((item: FinanceItem) => item.accountId === accountId);

    // Verificar localStorage para gastos
    const expensesData = localStorage.getItem("expenses-data") || "[]";
    const parsedExpenses = JSON.parse(expensesData);
    const orphanedExpenses = parsedExpenses.filter((item: FinanceItem) => item.accountId === accountId);

    return {
      orphanedCount: orphanedIncomes.length + orphanedExpenses.length,
      orphanedIncomesCount: orphanedIncomes.length,
      orphanedExpensesCount: orphanedExpenses.length,
    };
  } catch (error) {
    console.error("Error contando registros huérfanos:", error);
    return {
      orphanedCount: 0,
      orphanedIncomesCount: 0,
      orphanedExpensesCount: 0,
    };
  }
};

// Función para eliminar todas las transacciones asociadas a una cuenta
export const deleteFinancesByAccountId = async (
  accountId: string
): Promise<{
  deletedIncomesCount: number;
  deletedExpensesCount: number;
}> => {
  try {
    // Buscar ingresos asociados a la cuenta
    const incomesData = localStorage.getItem("incomes-data") || "[]";
    const parsedIncomes = JSON.parse(incomesData);
    const incomesToDelete = parsedIncomes.filter((item: FinanceItem) => item.accountId === accountId);

    // Buscar gastos asociados a la cuenta
    const expensesData = localStorage.getItem("expenses-data") || "[]";
    const parsedExpenses = JSON.parse(expensesData);
    const expensesToDelete = parsedExpenses.filter((item: FinanceItem) => item.accountId === accountId);

    // Eliminar ingresos
    for (const income of incomesToDelete) {
      try {
        await incomeService.deleteItem(income.id);
      } catch (error) {
        console.error(`Error al eliminar ingreso ${income.id}:`, error);
      }
    }

    // Eliminar gastos
    for (const expense of expensesToDelete) {
      try {
        await expenseService.deleteItem(expense.id);
      } catch (error) {
        console.error(`Error al eliminar gasto ${expense.id}:`, error);
      }
    }

    return {
      deletedIncomesCount: incomesToDelete.length,
      deletedExpensesCount: expensesToDelete.length,
    };
  } catch (error) {
    console.error("Error eliminando transacciones asociadas a la cuenta:", error);
    return {
      deletedIncomesCount: 0,
      deletedExpensesCount: 0,
    };
  }
};

// Actualizar el servicio de finanzas para usar cuentas
export const updateFinanceWithAccount = async (
  collection: "incomes" | "expenses",
  financeItem: { amount: number; [key: string]: unknown },
  accountId: string,
  operation: "add" | "update" | "delete",
  previousAccountId?: string
): Promise<void> => {
  try {
    // Si no hay accountId, no podemos continuar
    if (!accountId) {
      console.warn("No se proporcionó una cuenta para la transacción");
      return;
    }

    // Obtener el monto y la dirección del cambio (+ para ingreso, - para gasto)
    const amount = financeItem.amount || 0;
    const amountChange = collection === "incomes" ? amount : -amount;

    // Obtener todas las cuentas del usuario desde el estado global
    const accounts = useAccountStore.getState().accounts;

    // Buscar la cuenta actual en el estado global
    const account = accounts.find((acc) => acc.id === accountId);

    if (!account) {
      // Intentamos buscar en localStorage como backup
      const accountsStorageKey = "accounts-data"; // Clave para localStorage de cuentas
      const localData = localStorage.getItem(accountsStorageKey) || "[]";
      const localAccounts = JSON.parse(localData);
      const localAccount = localAccounts.find((acc: Account) => acc.id === accountId);

      if (!localAccount) {
        throw new Error("Cuenta no encontrada");
      }

      // Si la encontramos en localStorage, usamos esa
      const updatedLocalAccount = {
        ...localAccount,
        balance: calculateNewBalance(localAccount.balance, amountChange, operation),
      };

      await updateAccount(updatedLocalAccount);
      return;
    }

    // Calcular el nuevo saldo según la operación
    const newBalance = calculateNewBalance(account.balance, amountChange, operation);

    // Actualizar la cuenta con el nuevo saldo
    const updatedAccount = {
      ...account,
      balance: newBalance,
    };

    // Actualizar en Firebase y en el estado global
    await updateAccount(updatedAccount);

    // Si había una cuenta anterior (en caso de edición con cambio de cuenta), actualizarla también
    if (previousAccountId && previousAccountId !== accountId) {
      // Buscar la cuenta anterior
      const previousAccount = accounts.find((acc) => acc.id === previousAccountId);

      if (previousAccount) {
        // Revertir el efecto en la cuenta anterior
        const reverseChange = collection === "incomes" ? -amount : amount;
        const previousNewBalance = calculateNewBalance(previousAccount.balance, reverseChange, "delete");

        const updatedPreviousAccount = {
          ...previousAccount,
          balance: previousNewBalance,
        };

        // Actualizar en Firebase y en el estado global
        await updateAccount(updatedPreviousAccount);
      }
    }
  } catch (error) {
    console.error("Error actualizando la cuenta:", error);
    throw error;
  }
};

// Función auxiliar para calcular el nuevo saldo
export const calculateNewBalance = (currentBalance: number, amountChange: number, operation: "add" | "update" | "delete"): number => {
  switch (operation) {
    case "add":
      return currentBalance + amountChange;
    case "update":
      // En actualización, el cambio ya incluye la diferencia correcta
      return currentBalance + amountChange;
    case "delete":
      return currentBalance - amountChange;
    default:
      return currentBalance;
  }
};

// Función para recalcular todos los saldos de todas las cuentas de un usuario
export const recalculateAllAccountBalances = async (userId: string): Promise<void> => {
  try {
    if (!userId) return;

    // Importar la función de recalcular balance desde accountService
    const { forceResetAndRecalculateBalance } = await import("./accountService");

    // Obtener todas las cuentas del usuario
    const accounts = useAccountStore.getState().accounts;

    console.log(`Iniciando recálculo forzado de saldos para ${accounts.length} cuentas`);

    // Recalcular el saldo de cada cuenta con reinicio forzado
    for (const account of accounts) {
      const newBalance = await forceResetAndRecalculateBalance(account.id, userId);
      console.log(`Cuenta ${account.name}: nuevo saldo = ${newBalance}`);
    }

    console.log("Saldos de todas las cuentas recalculados y forzados correctamente");
  } catch (error) {
    console.error("Error recalculando saldos de cuentas:", error);
  }
};

// Función para verificar y corregir saldos de cuentas
export const verifyAndFixAccountBalances = async (
  userId: string
): Promise<{
  accountsChecked: number;
  accountsFixed: number;
  fixedAccountIds: string[];
}> => {
  try {
    if (!userId) {
      return { accountsChecked: 0, accountsFixed: 0, fixedAccountIds: [] };
    }

    // Importar funciones necesarias
    const { getUserAccounts, updateAccount } = await import("./accountService");

    // Obtener ingresos y gastos del usuario
    const incomes = await incomeService.getUserItems(userId);
    const expenses = await expenseService.getUserItems(userId);

    // Obtener todas las cuentas del usuario
    const accounts = useAccountStore.getState().accounts;

    // Verificar cada cuenta
    let accountsFixed = 0;
    const fixedAccountIds: string[] = [];

    for (const account of accounts) {
      // Calcular el saldo real de la cuenta
      const accountIncomes = incomes.filter((income) => income.accountId === account.id);
      const accountExpenses = expenses.filter((expense) => expense.accountId === account.id);

      const incomesTotal = accountIncomes.reduce((sum, income) => sum + income.amount, 0);
      const expensesTotal = accountExpenses.reduce((sum, expense) => sum + expense.amount, 0);

      const realBalance = incomesTotal - expensesTotal;

      console.log(`Verificando cuenta ${account.name} (${account.id}):`);
      console.log(`- Ingresos: ${incomesTotal}, Gastos: ${expensesTotal}`);
      console.log(`- Saldo calculado: ${realBalance}, Saldo actual: ${account.balance}`);

      // Verificar si el saldo actual es diferente del real
      if (Math.abs(account.balance - realBalance) > 0.001) {
        // Pequeña tolerancia para errores de redondeo
        console.log(`- Corrigiendo saldo: ${account.balance} -> ${realBalance}`);

        // Corregir el saldo
        const updatedAccount = {
          ...account,
          balance: realBalance,
        };

        await updateAccount(updatedAccount);
        accountsFixed++;
        fixedAccountIds.push(account.id);

        console.log(`- Saldo corregido para ${account.name}`);
      } else {
        console.log(`- El saldo es correcto para ${account.name}`);
      }
    }

    // Actualizar el estado global con todas las cuentas corregidas
    if (accountsFixed > 0) {
      const updatedAccounts = await getUserAccounts(userId);
      useAccountStore.getState().setAccounts(updatedAccounts);
    }

    return {
      accountsChecked: accounts.length,
      accountsFixed,
      fixedAccountIds,
    };
  } catch (error) {
    console.error("Error verificando saldos de cuentas:", error);
    return { accountsChecked: 0, accountsFixed: 0, fixedAccountIds: [] };
  }
};
