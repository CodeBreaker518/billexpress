"use client";

import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, Timestamp, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "./config";
import { useAccountStore } from "@bill/_store/useAccountStore";
import type { Account } from "./accountService";

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

// Factory para crear servicios financieros (ingresos o gastos)
export const createFinanceService = (entityType: "incomes" | "expenses") => {
  // Colección de Firebase
  const collection_ref = collection(db, entityType);

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

      return items;
    } catch (error) {
      console.error(`Error fetching ${entityType}:`, error);
      return [];
    }
  };

  // Añadir un nuevo elemento
  const addItem = async (item: Omit<FinanceItem, "id">): Promise<FinanceItem> => {
    try {
      // Validar la fecha y asegurar que sea un objeto Date válido
      let safeDate;
      try {
        if (item.date instanceof Date) {
          safeDate = new Date(item.date.getTime());
        } else if (typeof item.date === "string") {
          safeDate = new Date(item.date);
        } else if (item.date && typeof item.date === "object" && "seconds" in (item.date as any)) {
          // Es un Timestamp de Firestore
          safeDate = new Date((item.date as any).seconds * 1000);
        } else {
          console.warn("Fecha no válida proporcionada, usando fecha actual");
          safeDate = new Date();
        }

        // Verificar que la fecha sea válida
        if (isNaN(safeDate.getTime())) {
          throw new Error("Fecha inválida");
        }
      } catch (dateError) {
        console.error("Error procesando fecha:", dateError);
        safeDate = new Date(); // Usar fecha actual como fallback
      }

      const docRef = await addDoc(collection_ref, {
        ...item,
        date: Timestamp.fromDate(safeDate), // Usar la fecha validada
        createdAt: serverTimestamp(),
      });

      return {
        ...item,
        id: docRef.id,
        date: safeDate, // Usar la fecha validada
      };
    } catch (error) {
      console.error(`Error in add${entityType.slice(0, -1)}:`, error);
      throw error;
    }
  };

  // Actualizar un elemento existente
  const updateItem = async (item: FinanceItem): Promise<void> => {
    try {
      // Validar la fecha y asegurar que sea un objeto Date válido
      let safeDate;
      try {
        if (item.date instanceof Date) {
          safeDate = new Date(item.date.getTime());
        } else if (typeof item.date === "string") {
          safeDate = new Date(item.date);
        } else if (item.date && typeof item.date === "object" && "seconds" in (item.date as any)) {
          // Es un Timestamp de Firestore
          safeDate = new Date((item.date as any).seconds * 1000);
        } else {
          console.warn("Fecha no válida proporcionada en actualización, usando fecha actual");
          safeDate = new Date();
        }

        // Verificar que la fecha sea válida
        if (isNaN(safeDate.getTime())) {
          throw new Error("Fecha inválida en actualización");
        }
      } catch (dateError) {
        console.error("Error procesando fecha en actualización:", dateError);
        safeDate = new Date(); // Usar fecha actual como fallback
      }

      const itemRef = doc(db, entityType, item.id);
      await updateDoc(itemRef, {
        amount: item.amount,
        category: item.category,
        description: item.description,
        date: Timestamp.fromDate(safeDate),
        accountId: item.accountId || null,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error(`Error in update${entityType.slice(0, -1)}:`, error);
      throw error;
    }
  };

  // Eliminar un elemento
  const deleteItem = async (id: string): Promise<void> => {
    try {
      const itemRef = doc(db, entityType, id);
      await deleteDoc(itemRef);
    } catch (error) {
      console.error(`Error deleting ${entityType.slice(0, -1)}:`, error);
      throw error;
    }
  };

  return {
    getUserItems,
    addItem,
    updateItem,
    deleteItem,
  };
};

// Crear servicios para ingresos y gastos
export const incomeService = createFinanceService("incomes");
export const expenseService = createFinanceService("expenses");

// Contar elementos huérfanos (sin cuenta asociada)
export const countOrphanedFinances = async (
  accountId: string
): Promise<{
  orphanedCount: number;
  orphanedIncomesCount: number;
  orphanedExpensesCount: number;
}> => {
  try {
    // Buscar ingresos asociados a la cuenta
    const incomesQuery = query(collection(db, "incomes"), where("accountId", "==", accountId));
    const incomesSnapshot = await getDocs(incomesQuery);

    // Buscar gastos asociados a la cuenta
    const expensesQuery = query(collection(db, "expenses"), where("accountId", "==", accountId));
    const expensesSnapshot = await getDocs(expensesQuery);

    return {
      orphanedCount: incomesSnapshot.size + expensesSnapshot.size,
      orphanedIncomesCount: incomesSnapshot.size,
      orphanedExpensesCount: expensesSnapshot.size,
    };
  } catch (error) {
    console.error("Error contando elementos huérfanos:", error);
    return {
      orphanedCount: 0,
      orphanedIncomesCount: 0,
      orphanedExpensesCount: 0,
    };
  }
};

// Eliminar elementos financieros asociados a una cuenta
export const deleteFinancesByAccountId = async (
  accountId: string
): Promise<{
  deletedIncomesCount: number;
  deletedExpensesCount: number;
}> => {
  try {
    // Obtener ingresos asociados a la cuenta
    const incomesQuery = query(collection(db, "incomes"), where("accountId", "==", accountId));
    const incomesSnapshot = await getDocs(incomesQuery);

    // Eliminar ingresos
    let deletedIncomesCount = 0;
    for (const doc of incomesSnapshot.docs) {
      await deleteDoc(doc.ref);
      deletedIncomesCount++;
    }

    // Obtener gastos asociados a la cuenta
    const expensesQuery = query(collection(db, "expenses"), where("accountId", "==", accountId));
    const expensesSnapshot = await getDocs(expensesQuery);

    // Eliminar gastos
    let deletedExpensesCount = 0;
    for (const doc of expensesSnapshot.docs) {
      await deleteDoc(doc.ref);
      deletedExpensesCount++;
    }

    return {
      deletedIncomesCount,
      deletedExpensesCount,
    };
  } catch (error) {
    console.error("Error eliminando finanzas por cuenta:", error);
    throw error;
  }
};

// Actualizar cuenta asociada a un elemento financiero
export const updateFinanceWithAccount = async (
  collection: "incomes" | "expenses",
  financeItem: { amount: number; [key: string]: unknown },
  accountId: string,
  operation: "add" | "update" | "delete",
  previousAccountId?: string
): Promise<void> => {
  try {
    // Solo actualizar el saldo de la cuenta si hay una cuenta válida
    if (accountId) {
      // En lugar de obtener las cuentas del estado, obtenerlas directamente de Firebase
      const accountRef = doc(db, "accounts", accountId);
      const accountSnapshot = await getDoc(accountRef);

      if (accountSnapshot.exists()) {
        const account = {
          id: accountId,
          ...accountSnapshot.data(),
        } as Account;

        // Actualizar el saldo de la cuenta basado en la operación
        const newBalance = calculateNewBalance(account.balance, financeItem.amount as number, collection === "incomes" ? "income" : "expense", operation);

        // Actualizar la cuenta directamente en Firebase
        await updateDoc(accountRef, {
          balance: newBalance,
          updatedAt: serverTimestamp(),
        });

        // Actualizar también en el estado local si está disponible
        try {
          const { updateAccount } = useAccountStore.getState();
          updateAccount({
            ...account,
            balance: newBalance,
          });
        } catch (storeError) {
          console.warn("No se pudo actualizar el estado local:", storeError);
          // No interrumpir el flujo si falla la actualización local
        }
      }
    }

    // Si hay una cuenta anterior y es diferente, actualizar también su saldo
    if (previousAccountId && previousAccountId !== accountId) {
      const previousAccountRef = doc(db, "accounts", previousAccountId);
      const previousAccountSnapshot = await getDoc(previousAccountRef);

      if (previousAccountSnapshot.exists()) {
        const previousAccount = {
          id: previousAccountId,
          ...previousAccountSnapshot.data(),
        } as Account;

        // Operación inversa en la cuenta anterior (si actualizamos, primero revertimos y luego añadimos)
        const reverseOperation = operation === "update" ? "delete" : "delete";

        const newBalance = calculateNewBalance(previousAccount.balance, financeItem.amount as number, collection === "incomes" ? "income" : "expense", reverseOperation);

        // Actualizar la cuenta anterior directamente en Firebase
        await updateDoc(previousAccountRef, {
          balance: newBalance,
          updatedAt: serverTimestamp(),
        });

        // Actualizar también en el estado local si está disponible
        try {
          const { updateAccount } = useAccountStore.getState();
          updateAccount({
            ...previousAccount,
            balance: newBalance,
          });
        } catch (storeError) {
          console.warn("No se pudo actualizar el estado local:", storeError);
          // No interrumpir el flujo si falla la actualización local
        }
      }
    }
  } catch (error) {
    console.error("Error actualizando finanzas con cuenta:", error);
    throw error;
  }
};

// Calcular el nuevo saldo después de una operación financiera
export const calculateNewBalance = (currentBalance: number, amountChange: number, type: "income" | "expense", operation: "add" | "update" | "delete"): number => {
  // Para ingresos: add suma, delete resta
  // Para gastos: add resta, delete suma
  const multiplier = type === "income" ? 1 : -1;

  switch (operation) {
    case "add":
      return currentBalance + amountChange * multiplier;
    case "delete":
      return currentBalance - amountChange * multiplier;
    case "update":
      // La actualización se maneja descomponiendo en delete + add
      return currentBalance;
    default:
      return currentBalance;
  }
};

// Recalcular todos los saldos de cuentas
export const recalculateAllAccountBalances = async (userId: string): Promise<void> => {
  try {
    const { accounts, updateAccount } = useAccountStore.getState();

    for (const account of accounts) {
      if (account.userId === userId) {
        // Obtener ingresos asociados a la cuenta
        const incomesQuery = query(collection(db, "incomes"), where("accountId", "==", account.id), where("userId", "==", userId));
        const incomesSnapshot = await getDocs(incomesQuery);

        // Calcular total de ingresos
        let totalIncome = 0;
        incomesSnapshot.forEach((doc) => {
          totalIncome += doc.data().amount || 0;
        });

        // Obtener gastos asociados a la cuenta
        const expensesQuery = query(collection(db, "expenses"), where("accountId", "==", account.id), where("userId", "==", userId));
        const expensesSnapshot = await getDocs(expensesQuery);

        // Calcular total de gastos
        let totalExpense = 0;
        expensesSnapshot.forEach((doc) => {
          totalExpense += doc.data().amount || 0;
        });

        // Actualizar saldo de la cuenta
        const newBalance = totalIncome - totalExpense;

        // Actualizar la cuenta en Firebase
        const accountRef = doc(db, "accounts", account.id);
        await updateDoc(accountRef, { balance: newBalance });

        // Actualizar en el estado de la aplicación
        await updateAccount({
          ...account,
          balance: newBalance,
        });
      }
    }
  } catch (error) {
    console.error("Error recalculando saldos:", error);
    throw error;
  }
};

// Verificar y corregir saldos de cuentas
export const verifyAndFixAccountBalances = async (
  userId: string
): Promise<{
  accountsChecked: number;
  accountsFixed: number;
  fixedAccountIds: string[];
}> => {
  try {
    const { accounts } = useAccountStore.getState();
    const userAccounts = accounts.filter((acc) => acc.userId === userId);

    let accountsChecked = 0;
    let accountsFixed = 0;
    const fixedAccountIds: string[] = [];

    for (const account of userAccounts) {
      accountsChecked++;

      // Calcular saldo correcto
      const recalculatedBalance = await calculateAccountBalance(account.id, userId);

      // Si el saldo es diferente, corregirlo
      if (recalculatedBalance !== account.balance) {
        const accountRef = doc(db, "accounts", account.id);
        await updateDoc(accountRef, { balance: recalculatedBalance });

        accountsFixed++;
        fixedAccountIds.push(account.id);
      }
    }

    return {
      accountsChecked,
      accountsFixed,
      fixedAccountIds,
    };
  } catch (error) {
    console.error("Error verificando saldos:", error);
    throw error;
  }
};

// Calcular saldo de una cuenta basado en sus transacciones
export const calculateAccountBalance = async (accountId: string, userId: string): Promise<number> => {
  try {
    // Obtener ingresos
    const incomesQuery = query(collection(db, "incomes"), where("accountId", "==", accountId), where("userId", "==", userId));
    const incomesSnapshot = await getDocs(incomesQuery);

    // Sumar ingresos
    let totalIncome = 0;
    incomesSnapshot.forEach((doc) => {
      totalIncome += doc.data().amount || 0;
    });

    // Obtener gastos
    const expensesQuery = query(collection(db, "expenses"), where("accountId", "==", accountId), where("userId", "==", userId));
    const expensesSnapshot = await getDocs(expensesQuery);

    // Sumar gastos
    let totalExpense = 0;
    expensesSnapshot.forEach((doc) => {
      totalExpense += doc.data().amount || 0;
    });

    // Calcular saldo
    return totalIncome - totalExpense;
  } catch (error) {
    console.error("Error calculando saldo:", error);
    throw error;
  }
};
