"use client";

import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, getDoc, serverTimestamp, Timestamp } from "firebase/firestore";
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
        } else if (item.date && typeof item.date === "object" && "seconds" in (item.date as { seconds: number })) {
          // Es un Timestamp de Firestore
          safeDate = new Date((item.date as { seconds: number }).seconds * 1000);
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
        } else if (item.date && typeof item.date === "object" && "seconds" in (item.date as { seconds: number })) {
          // Es un Timestamp de Firestore
          safeDate = new Date((item.date as { seconds: number }).seconds * 1000);
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

      // Asegurarse de que accountId siempre tenga un valor válido
      // Si es undefined o null, no lo incluimos en la actualización
      const updateData: Record<string, any> = {
        amount: item.amount,
        category: item.category,
        description: item.description,
        date: Timestamp.fromDate(safeDate),
        updatedAt: serverTimestamp(),
      };

      // Solo incluir accountId si tiene un valor (cadena vacía, null o undefined no se incluirán)
      if (item.accountId) {
        updateData.accountId = item.accountId;
      }

      const itemRef = doc(db, entityType, item.id);
      await updateDoc(itemRef, updateData);
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
    if (!financeItem.userId) {
      console.error("Error: userId es requerido para actualizar el saldo de la cuenta");
      return;
    }

    const userId = financeItem.userId as string;
    console.log(`Operación ${operation} ${collection} para usuario ${userId}`);

    // Para operaciones de actualización o cuando hay cambio de cuenta,
    // simplemente recalculamos todos los saldos para mayor precisión
    if (operation === "update" || (previousAccountId && previousAccountId !== accountId)) {
      console.log("Recalculando todos los saldos para mayor precisión...");
      await recalculateAllAccountBalances(userId);
      return;
    }

    // Para add y delete simples, actualizamos solo la cuenta específica
    if (accountId) {
      // Obtener la cuenta directamente de Firebase
      const accountRef = doc(db, "accounts", accountId);
      const accountSnapshot = await getDoc(accountRef);

      if (accountSnapshot.exists()) {
        const account = {
          id: accountId,
          ...accountSnapshot.data(),
        } as Account;

        // Calcular el nuevo saldo
        const multiplier = collection === "incomes" ? 1 : -1;
        const amount = financeItem.amount as number;
        let newBalance = account.balance;

        if (operation === "add") {
          newBalance += amount * multiplier;
        } else if (operation === "delete") {
          newBalance -= amount * multiplier;
        }

        // Actualizar en Firebase
        await updateDoc(accountRef, {
          balance: newBalance,
          updatedAt: serverTimestamp(),
        });

        // Actualizar en el estado local
        try {
          const { updateAccount } = useAccountStore.getState();
          updateAccount({
            ...account,
            balance: newBalance,
          });
        } catch (storeError) {
          console.warn("No se pudo actualizar el estado local:", storeError);
        }

        console.log(`Cuenta ${accountId} actualizada, nuevo saldo: ${newBalance}`);
      } else {
        console.warn(`Cuenta ${accountId} no encontrada, se omite la actualización del saldo`);
      }
    } else {
      console.warn("No se proporcionó ID de cuenta válido, omitiendo actualización de saldo");
    }
  } catch (error) {
    console.error("Error actualizando finanzas con cuenta:", error);
    // En caso de error, forzar recálculo completo para asegurar integridad
    if (financeItem.userId) {
      try {
        await recalculateAllAccountBalances(financeItem.userId as string);
      } catch (recalcError) {
        console.error("Error en recálculo de emergencia:", recalcError);
      }
    }
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
      // La actualización se debe manejar por separado, ya que necesitamos
      // tanto el valor anterior como el nuevo valor
      console.warn("La operación 'update' debe ser manejada por updateFinanceWithAccount");
      return currentBalance;
    default:
      return currentBalance;
  }
};

// Recalcular todos los saldos de cuentas
export const recalculateAllAccountBalances = async (userId: string): Promise<void> => {
  try {
    console.log("Iniciando recálculo de saldos para todas las cuentas del usuario:", userId);
    const { accounts, updateAccount } = useAccountStore.getState();
    const userAccounts = accounts.filter((acc) => acc.userId === userId);

    console.log(`Encontradas ${userAccounts.length} cuentas para recalcular`);

    for (const account of userAccounts) {
      console.log(`Recalculando saldo para cuenta: ${account.id} (${account.name})`);

      // Obtener ingresos asociados a la cuenta
      const incomesQuery = query(collection(db, "incomes"), where("accountId", "==", account.id), where("userId", "==", userId));
      const incomesSnapshot = await getDocs(incomesQuery);

      // Calcular total de ingresos
      let totalIncome = 0;
      let incomesCount = 0;
      incomesSnapshot.forEach((doc) => {
        const amount = doc.data().amount || 0;
        totalIncome += amount;
        incomesCount++;
      });
      console.log(`Encontrados ${incomesCount} ingresos, total: ${totalIncome}`);

      // Obtener gastos asociados a la cuenta
      const expensesQuery = query(collection(db, "expenses"), where("accountId", "==", account.id), where("userId", "==", userId));
      const expensesSnapshot = await getDocs(expensesQuery);

      // Calcular total de gastos
      let totalExpense = 0;
      let expensesCount = 0;
      expensesSnapshot.forEach((doc) => {
        const amount = doc.data().amount || 0;
        totalExpense += amount;
        expensesCount++;
      });
      console.log(`Encontrados ${expensesCount} gastos, total: ${totalExpense}`);

      // Actualizar saldo de la cuenta
      const newBalance = totalIncome - totalExpense;
      console.log(`Nuevo saldo calculado: ${newBalance} (Ingresos ${totalIncome} - Gastos ${totalExpense})`);

      if (newBalance !== account.balance) {
        console.log(`Actualizando saldo de ${account.balance} a ${newBalance}`);

        // Actualizar la cuenta en Firebase
        const accountRef = doc(db, "accounts", account.id);
        await updateDoc(accountRef, {
          balance: newBalance,
          updatedAt: serverTimestamp(),
        });

        // Actualizar en el estado de la aplicación
        await updateAccount({
          ...account,
          balance: newBalance,
        });
      } else {
        console.log("El saldo ya está correcto, no se requiere actualización");
      }
    }

    console.log("Recálculo de saldos completado con éxito");
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
