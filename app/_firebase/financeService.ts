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
      // Validar la fecha y asegurar que sea un objeto Date válido
      let safeDate;
      try {
        if (item.date instanceof Date) {
          safeDate = new Date(item.date.getTime());
        } else if (typeof item.date === "string") {
          safeDate = new Date(item.date);
        } else if (item.date && typeof item.date === "object" && "seconds" in item.date) {
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

      // Guardar en localStorage para recuperación offline
      const localData = localStorage.getItem(localStorageKey) || "[]";
      const parsedData = JSON.parse(localData);

      // Crear nuevo elemento con ID temporal si estamos offline
      const newItem = {
        ...item,
        id: tempId,
        date: safeDate, // Usar la fecha validada
      };

      // Actualizar datos locales
      localStorage.setItem(localStorageKey, JSON.stringify([...parsedData, newItem]));

      // Si estamos online, intentar guardar en Firebase
      if (isOnline()) {
        try {
          const docRef = await addDoc(collection_ref, {
            ...item,
            date: Timestamp.fromDate(safeDate), // Usar la fecha validada
            createdAt: serverTimestamp(),
          });

          // Actualizar datos locales con el ID correcto
          const updatedData = parsedData.map((localItem: any) => (localItem.id === tempId ? { ...item, id: docRef.id, date: safeDate } : localItem));
          localStorage.setItem(localStorageKey, JSON.stringify(updatedData));

          return {
            ...item,
            id: docRef.id,
            date: safeDate, // Usar la fecha validada
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
        date: new Date(), // Usar fecha actual como último recurso
      };
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
        } else if (item.date && typeof item.date === "object" && "seconds" in item.date) {
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

      // Crear una copia del item con la fecha validada
      const validatedItem = {
        ...item,
        date: safeDate,
      };

      // Actualizar datos locales primero
      const localData = localStorage.getItem(localStorageKey) || "[]";
      const parsedData = JSON.parse(localData);
      const updatedData = parsedData.map((localItem: any) => (localItem.id === item.id ? validatedItem : localItem));
      localStorage.setItem(localStorageKey, JSON.stringify(updatedData));

      // Si estamos online, actualizar en Firebase
      if (isOnline()) {
        try {
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
          console.error(`Error updating ${entityType.slice(0, -1)} in Firebase:`, error);
          // Registrar operación pendiente
          usePendingOperationsStore.getState().addOperation({
            operationType: "update",
            collection: entityType,
            data: validatedItem,
          });
        }
      } else {
        // Si estamos offline, registrar operación pendiente
        usePendingOperationsStore.getState().addOperation({
          operationType: "update",
          collection: entityType,
          data: validatedItem,
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
  const syncPendingItems = async (): Promise<{ success: boolean; syncedCount: number; errorCount: number }> => {
    if (!isOnline()) return { success: false, syncedCount: 0, errorCount: 0 }; // Solo intentar sincronizar si estamos online

    const pendingOps = usePendingOperationsStore.getState().operations.filter((op) => op.collection === entityType);

    if (pendingOps.length === 0) return { success: true, syncedCount: 0, errorCount: 0 };

    console.log(`Sincronizando ${pendingOps.length} operaciones pendientes de ${entityType}...`);

    let syncedCount = 0;
    let errorCount = 0;

    // Procesar cada operación pendiente
    for (const op of pendingOps) {
      try {
        // Validar la operación antes de procesarla para evitar errores
        // Si es demasiado antigua (más de 7 días), eliminarla automáticamente
        if (Date.now() - op.timestamp > 7 * 24 * 60 * 60 * 1000) {
          console.log(`Eliminando operación antigua ${op.id} sin procesar`);
          usePendingOperationsStore.getState().removeOperation(op.id);
          continue;
        }

        if (op.operationType === "add") {
          const { id, ...rest } = op.data;

          // Validar datos antes de sincronizar
          if (!rest || !rest.userId) {
            console.warn(`Operación de añadir inválida, falta userId: ${op.id}`);
            usePendingOperationsStore.getState().removeOperation(op.id);
            errorCount++;
            continue;
          }

          // Validar y corregir la fecha
          let safeDate;
          try {
            // Intentar convertir la fecha al formato correcto
            if (rest.date instanceof Date) {
              safeDate = rest.date;
            } else if (typeof rest.date === "string") {
              safeDate = new Date(rest.date);
            } else if (rest.date && typeof rest.date === "object" && rest.date.seconds) {
              // Es un Timestamp de Firestore
              safeDate = new Date(rest.date.seconds * 1000);
            } else {
              // Si la fecha no es válida, usar la fecha actual
              console.warn("Fecha no válida encontrada en operación pendiente, usando fecha actual");
              safeDate = new Date();
            }

            // Verificar que la fecha sea válida
            if (isNaN(safeDate.getTime())) {
              throw new Error("Invalid date");
            }
          } catch (dateError) {
            console.error("Error procesando fecha en operación pendiente:", dateError);
            safeDate = new Date(); // Usar fecha actual como fallback
          }

          try {
            await addDoc(collection_ref, {
              ...rest,
              date: Timestamp.fromDate(safeDate),
              createdAt: serverTimestamp(),
              syncedAt: serverTimestamp(),
            });

            syncedCount++;
          } catch (addError) {
            // Intentar determinar si el error es temporal o permanente
            if (addError instanceof Error && (addError.message.includes("network") || addError.message.includes("unavailable"))) {
              console.warn(`Error temporal al añadir documento, reintentando más tarde: ${addError.message}`);
              // No eliminar la operación para reintentar más tarde
              errorCount++;
              continue;
            } else {
              console.error(`Error permanente al añadir documento, eliminando operación: ${addError}`);
              // Eliminar operación con error permanente
              usePendingOperationsStore.getState().removeOperation(op.id);
              errorCount++;
              continue;
            }
          }
        } else if (op.operationType === "update") {
          const { id, ...rest } = op.data;

          // Validar ID antes de actualizar
          if (!id) {
            console.warn(`Operación de actualización inválida, falta ID: ${op.id}`);
            usePendingOperationsStore.getState().removeOperation(op.id);
            errorCount++;
            continue;
          }

          // Validar y corregir la fecha
          let safeDate;
          try {
            // Intentar convertir la fecha al formato correcto
            if (rest.date instanceof Date) {
              safeDate = rest.date;
            } else if (typeof rest.date === "string") {
              safeDate = new Date(rest.date);
            } else if (rest.date && typeof rest.date === "object" && rest.date.seconds) {
              // Es un Timestamp de Firestore
              safeDate = new Date(rest.date.seconds * 1000);
            } else {
              // Si la fecha no es válida, usar la fecha actual
              console.warn("Fecha no válida encontrada en operación pendiente, usando fecha actual");
              safeDate = new Date();
            }

            // Verificar que la fecha sea válida
            if (isNaN(safeDate.getTime())) {
              throw new Error("Invalid date");
            }
          } catch (dateError) {
            console.error("Error procesando fecha en operación pendiente:", dateError);
            safeDate = new Date(); // Usar fecha actual como fallback
          }

          try {
            const itemRef = doc(db, entityType, id);
            await updateDoc(itemRef, {
              ...rest,
              date: Timestamp.fromDate(safeDate),
              updatedAt: serverTimestamp(),
              syncedAt: serverTimestamp(),
            });

            syncedCount++;
          } catch (updateError) {
            // Si el documento no existe, eliminar la operación pendiente
            if (updateError instanceof Error && (updateError.message.includes("No document to update") || updateError.message.includes("not found"))) {
              console.warn(`Documento no encontrado, eliminando operación: ${op.id}`);
              usePendingOperationsStore.getState().removeOperation(op.id);
              errorCount++;
              continue;
            }

            // Si es un error temporal, no eliminar la operación
            if (updateError instanceof Error && (updateError.message.includes("network") || updateError.message.includes("unavailable"))) {
              console.warn(`Error temporal al actualizar documento, reintentando más tarde: ${updateError.message}`);
              errorCount++;
              continue;
            }

            // Para otros errores, eliminar la operación
            console.error(`Error desconocido al actualizar documento, eliminando operación: ${updateError}`);
            usePendingOperationsStore.getState().removeOperation(op.id);
            errorCount++;
            continue;
          }
        } else if (op.operationType === "delete") {
          try {
            const itemRef = doc(db, entityType, op.data);
            await deleteDoc(itemRef);

            syncedCount++;
          } catch (deleteError) {
            // Si el documento ya no existe, la operación de eliminación se considera exitosa
            if (deleteError instanceof Error && (deleteError.message.includes("No document to delete") || deleteError.message.includes("not found"))) {
              console.log(`Documento ya eliminado, operación completada: ${op.id}`);
              syncedCount++;
            } else if (deleteError instanceof Error && (deleteError.message.includes("network") || deleteError.message.includes("unavailable"))) {
              console.warn(`Error temporal al eliminar documento, reintentando más tarde: ${deleteError.message}`);
              errorCount++;
              continue;
            } else {
              console.error(`Error desconocido al eliminar documento: ${deleteError}`);
              errorCount++;
              continue;
            }
          }
        }

        // Eliminar la operación de la cola después de completarla exitosamente
        usePendingOperationsStore.getState().removeOperation(op.id);
      } catch (error) {
        console.error(`Error syncing operation ${op.id}:`, error);
        errorCount++;

        // Si el error es crítico y no podemos sincronizar la operación, la eliminamos
        if (error instanceof Error && (error.message.includes("Invalid time value") || error.message.includes("Invalid date") || error.message.includes("permission-denied"))) {
          console.warn(`Eliminando operación inválida ${op.id} de la cola`);
          usePendingOperationsStore.getState().removeOperation(op.id);
        }
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

    return {
      success: errorCount === 0,
      syncedCount,
      errorCount,
    };
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
    console.log(`Iniciando eliminación de transacciones para la cuenta ${accountId}`);

    // 1. Buscar en Firebase primero si estamos online
    let firebaseIncomes: FinanceItem[] = [];
    let firebaseExpenses: FinanceItem[] = [];

    if (isOnline()) {
      try {
        // Consultar ingresos en Firebase
        const incomesQuery = query(collection(db, "incomes"), where("accountId", "==", accountId));
        const incomesSnapshot = await getDocs(incomesQuery);
        firebaseIncomes = incomesSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as unknown as FinanceItem)
        );

        // Consultar gastos en Firebase
        const expensesQuery = query(collection(db, "expenses"), where("accountId", "==", accountId));
        const expensesSnapshot = await getDocs(expensesQuery);
        firebaseExpenses = expensesSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as unknown as FinanceItem)
        );

        console.log(`Encontrados en Firebase: ${firebaseIncomes.length} ingresos y ${firebaseExpenses.length} gastos`);
      } catch (error) {
        console.error("Error buscando transacciones en Firebase:", error);
      }
    }

    // 2. Buscar también en localStorage para asegurar que capturamos todo
    const incomesData = localStorage.getItem("incomes-data") || "[]";
    const parsedIncomes = JSON.parse(incomesData);
    const localIncomes = parsedIncomes.filter((item: FinanceItem) => item.accountId === accountId);

    const expensesData = localStorage.getItem("expenses-data") || "[]";
    const parsedExpenses = JSON.parse(expensesData);
    const localExpenses = parsedExpenses.filter((item: FinanceItem) => item.accountId === accountId);

    console.log(`Encontrados en LocalStorage: ${localIncomes.length} ingresos y ${localExpenses.length} gastos`);

    // 3. Combinar y eliminar duplicados por ID
    const incomesToDelete = Array.from(
      new Map<string, FinanceItem>([...firebaseIncomes.map((item: FinanceItem) => [item.id, item]), ...localIncomes.map((item: FinanceItem) => [item.id, item])]).values()
    );

    const expensesToDelete = Array.from(
      new Map<string, FinanceItem>([...firebaseExpenses.map((item: FinanceItem) => [item.id, item]), ...localExpenses.map((item: FinanceItem) => [item.id, item])]).values()
    );

    console.log(`Total a eliminar después de combinar: ${incomesToDelete.length} ingresos y ${expensesToDelete.length} gastos`);

    // 4. Eliminar ingresos
    const deletedIncomes: string[] = [];
    for (const income of incomesToDelete) {
      try {
        if (!deletedIncomes.includes(income.id)) {
          await incomeService.deleteItem(income.id);
          deletedIncomes.push(income.id);
          console.log(`✓ Ingreso eliminado: ${income.id} - ${income.description}`);
        }
      } catch (error) {
        console.error(`Error al eliminar ingreso ${income.id}:`, error);
      }
    }

    // 5. Eliminar gastos
    const deletedExpenses: string[] = [];
    for (const expense of expensesToDelete) {
      try {
        if (!deletedExpenses.includes(expense.id)) {
          await expenseService.deleteItem(expense.id);
          deletedExpenses.push(expense.id);
          console.log(`✓ Gasto eliminado: ${expense.id} - ${expense.description}`);
        }
      } catch (error) {
        console.error(`Error al eliminar gasto ${expense.id}:`, error);
      }
    }

    console.log(`Proceso de eliminación completado. Eliminados: ${deletedIncomes.length} ingresos y ${deletedExpenses.length} gastos`);

    return {
      deletedIncomesCount: deletedIncomes.length,
      deletedExpensesCount: deletedExpenses.length,
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

    console.log(`⚠️ Iniciando verificación de saldos para usuario ${userId}`);

    // Importar funciones necesarias
    const { getUserAccounts, updateAccount } = await import("./accountService");

    // Obtener ingresos y gastos del usuario
    const incomes = await incomeService.getUserItems(userId);
    const expenses = await expenseService.getUserItems(userId);

    console.log(`📊 Datos obtenidos: ${incomes.length} ingresos, ${expenses.length} gastos`);

    // Obtener todas las cuentas del usuario directamente de Firebase para datos actualizados
    const accounts = await getUserAccounts(userId);
    console.log(`📊 Verificando ${accounts.length} cuentas`);

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

      console.log(`📊 Cuenta ${account.name} (${account.id}):`);
      console.log(`- Ingresos: ${incomesTotal}, Gastos: ${expensesTotal}`);
      console.log(`- Saldo calculado: ${realBalance}, Saldo actual: ${account.balance}`);

      // Verificar si el saldo actual es diferente del real con tolerancia para errores de redondeo
      if (Math.abs(account.balance - realBalance) > 0.001) {
        console.log(`⚠️ Corrigiendo saldo: ${account.balance} -> ${realBalance}`);

        try {
          // Corregir el saldo usando una actualización directa a Firebase
          const accountRef = doc(db, "accounts", account.id);
          await updateDoc(accountRef, {
            balance: realBalance,
            updatedAt: serverTimestamp(),
            lastVerified: serverTimestamp(),
          });

          // Actualizar también en localStorage
          const localData = localStorage.getItem("accounts-data") || "[]";
          const parsedData = JSON.parse(localData);
          const updatedLocalData = parsedData.map((acc: Account) => (acc.id === account.id ? { ...acc, balance: realBalance } : acc));
          localStorage.setItem("accounts-data", JSON.stringify(updatedLocalData));

          accountsFixed++;
          fixedAccountIds.push(account.id);

          console.log(`✅ Saldo corregido para ${account.name}`);
        } catch (updateError) {
          console.error(`❌ Error al corregir saldo de cuenta ${account.id}:`, updateError);
        }
      } else {
        console.log(`✅ El saldo es correcto para ${account.name}`);
      }
    }

    // Actualizar el estado global con todas las cuentas corregidas
    if (accountsFixed > 0) {
      const updatedAccounts = await getUserAccounts(userId);
      useAccountStore.getState().setAccounts(updatedAccounts);
      console.log(`✅ Estado global actualizado con ${updatedAccounts.length} cuentas después de correcciones`);
    }

    return {
      accountsChecked: accounts.length,
      accountsFixed,
      fixedAccountIds,
    };
  } catch (error) {
    console.error("❌ Error verificando saldos de cuentas:", error);
    return { accountsChecked: 0, accountsFixed: 0, fixedAccountIds: [] };
  }
};
