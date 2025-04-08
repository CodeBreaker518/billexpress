"use client";

import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "./config";
import { usePendingOperationsStore } from "@bill/_store/usePendingOperationsStore";
import { useAccountStore } from "@bill/_store/useAccountStore";
import { incomeService, expenseService } from "./financeService";
import { Income, Expense } from "@bill/_store/useFinanceStore";

// Tipo para cuentas
export interface Account {
  id: string;
  name: string;
  color: string;
  balance: number;
  userId: string;
  isDefault?: boolean;
}

// Verificar si hay conexión a internet
export const isOnline = (): boolean => {
  return typeof navigator !== "undefined" && navigator.onLine;
};

// Colección de Firebase
const collection_ref = collection(db, "accounts");
// Clave para localStorage
const localStorageKey = "accounts-data";

// Obtener cuentas para un usuario
export const getUserAccounts = async (userId: string): Promise<Account[]> => {
  try {
    console.log("⚠️ Buscando cuentas para el usuario:", userId);
    const q = query(collection_ref, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    let accounts = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        color: data.color,
        balance: data.balance,
        userId: data.userId,
        isDefault: data.isDefault || false,
      } as Account;
    });

    console.log("📊 Cuentas encontradas:", accounts.length);

    // Si no hay cuentas, crear la cuenta por defecto "Efectivo"
    if (accounts.length === 0) {
      console.log("⚠️ No hay cuentas, creando cuenta por defecto 'Efectivo'");
      const defaultAccount = await addAccount({
        name: "Efectivo",
        color: "#22c55e", // Verde
        balance: 0,
        userId: userId,
        isDefault: true,
      });
      console.log("✅ Cuenta por defecto creada:", defaultAccount);
      accounts = [defaultAccount];
    }

    // Guardar en localStorage para acceso offline
    if (accounts.length > 0) {
      localStorage.setItem(localStorageKey, JSON.stringify(accounts));
      console.log("💾 Cuentas guardadas en localStorage:", accounts.length);
    }

    return accounts;
  } catch (error) {
    console.error(`❌ Error fetching accounts:`, error);
    // Si hay error, intentar recuperar del almacenamiento local
    const localData = localStorage.getItem(localStorageKey);
    if (localData) {
      try {
        const parsedData = JSON.parse(localData);
        const userAccounts = parsedData.filter((account: Account) => account.userId === userId);

        console.log("⚠️ Recuperando cuentas de localStorage:", userAccounts.length);

        // Si no hay cuentas localmente, crea una por defecto
        if (userAccounts.length === 0) {
          console.log("⚠️ No hay cuentas en localStorage, creando cuenta por defecto");
          return [
            {
              id: `default_${Date.now()}`,
              name: "Efectivo",
              color: "#22c55e",
              balance: 0,
              userId: userId,
              isDefault: true,
            },
          ];
        }

        return userAccounts;
      } catch (e) {
        console.error(`❌ Error parsing local accounts:`, e);
      }
    }

    // Si todo falla, devolver al menos la cuenta por defecto
    console.log("⚠️ Creando cuenta por defecto como último recurso");
    return [
      {
        id: `default_${Date.now()}`,
        name: "Efectivo",
        color: "#22c55e",
        balance: 0,
        userId: userId,
        isDefault: true,
      },
    ];
  }
};

// Añadir una nueva cuenta
export const addAccount = async (account: Omit<Account, "id">): Promise<Account> => {
  // Crear un ID temporal para operaciones offline
  const tempId = `temp_${Date.now()}`;

  try {
    console.log("⚠️ Iniciando creación de cuenta:", account);
    // Guardar en localStorage para recuperación offline
    const localData = localStorage.getItem(localStorageKey) || "[]";
    const parsedData = JSON.parse(localData);

    // Crear nueva cuenta con ID temporal si estamos offline
    const newAccount = {
      ...account,
      id: tempId,
    };

    // Actualizar datos locales
    localStorage.setItem(localStorageKey, JSON.stringify([...parsedData, newAccount]));

    // Si estamos online, intentar guardar en Firebase
    if (isOnline()) {
      try {
        const docRef = await addDoc(collection_ref, {
          ...account,
          createdAt: serverTimestamp(),
        });

        // Crear objeto con el ID asignado por Firebase
        const createdAccount = {
          ...account,
          id: docRef.id,
        };

        console.log("✅ Cuenta creada exitosamente en Firebase:", createdAccount);

        // Actualizar datos locales con el ID correcto
        const updatedData = parsedData.map((localAccount: Account) => (localAccount.id === tempId ? createdAccount : localAccount));
        localStorage.setItem(localStorageKey, JSON.stringify(updatedData));

        // Actualizar directamente el estado global de cuentas
        const { accounts, addAccount } = useAccountStore.getState();

        // Solo añadir si no existe ya
        if (!accounts.some((acc) => acc.id === createdAccount.id)) {
          console.log("✅ Añadiendo cuenta nueva al estado global:", createdAccount);
          addAccount(createdAccount);
        }

        return createdAccount;
      } catch (error) {
        console.error(`❌ Error adding account to Firebase:`, error);

        // Registrar operación pendiente para sincronizar después
        usePendingOperationsStore.getState().addOperation({
          operationType: "add",
          collection: "incomes",
          data: newAccount,
        });

        return newAccount;
      }
    } else {
      // Si estamos offline, registrar para sincronización futura
      usePendingOperationsStore.getState().addOperation({
        operationType: "add",
        collection: "incomes",
        data: newAccount,
      });

      return newAccount;
    }
  } catch (error) {
    console.error(`❌ Error general en addAccount:`, error);
    // Devolver algo para que la UI no se rompa
    return {
      ...account,
      id: tempId,
    };
  }
};

// Actualizar una cuenta existente
export const updateAccount = async (account: Account): Promise<void> => {
  try {
    // Actualizar datos locales primero
    const localData = localStorage.getItem(localStorageKey) || "[]";
    const parsedData = JSON.parse(localData);
    const updatedData = parsedData.map((localAccount: Account) => (localAccount.id === account.id ? account : localAccount));
    localStorage.setItem(localStorageKey, JSON.stringify(updatedData));

    // Si estamos online, actualizar en Firebase
    if (isOnline()) {
      try {
        const accountRef = doc(db, "accounts", account.id);
        await updateDoc(accountRef, {
          name: account.name,
          color: account.color,
          balance: account.balance,
          isDefault: account.isDefault || false,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error(`Error updating account in Firebase:`, error);
        // Registrar operación pendiente
        usePendingOperationsStore.getState().addOperation({
          operationType: "update",
          collection: "incomes",
          data: account,
        });
      }
    } else {
      // Si estamos offline, registrar operación pendiente
      usePendingOperationsStore.getState().addOperation({
        operationType: "update",
        collection: "incomes",
        data: account,
      });
    }
  } catch (error) {
    console.error(`Error in updateAccount:`, error);
    throw error;
  }
};

// Eliminar una cuenta
export const deleteAccount = async (id: string): Promise<void> => {
  try {
    // No permitir eliminar la cuenta por defecto
    const localData = localStorage.getItem(localStorageKey) || "[]";
    const parsedData = JSON.parse(localData);
    const accountToDelete = parsedData.find((account: Account) => account.id === id);

    if (accountToDelete?.isDefault) {
      throw new Error("No puedes eliminar la cuenta predeterminada");
    }

    // Eliminar de datos locales primero
    const filteredData = parsedData.filter((account: Account) => account.id !== id);
    localStorage.setItem(localStorageKey, JSON.stringify(filteredData));

    // Si estamos online, eliminar de Firebase
    if (isOnline()) {
      try {
        const accountRef = doc(db, "accounts", id);
        await deleteDoc(accountRef);
      } catch (error) {
        console.error(`Error deleting account from Firebase:`, error);
        // Registrar operación pendiente
        usePendingOperationsStore.getState().addOperation({
          operationType: "delete",
          collection: "incomes",
          data: id,
        });
      }
    } else {
      // Si estamos offline, registrar operación pendiente
      usePendingOperationsStore.getState().addOperation({
        operationType: "delete",
        collection: "incomes",
        data: id,
      });
    }
  } catch (error) {
    console.error(`Error in deleteAccount:`, error);
    throw error;
  }
};

// Transferir entre cuentas
export const transferBetweenAccounts = async (fromAccountId: string, toAccountId: string, amount: number, userId: string): Promise<void> => {
  if (fromAccountId === toAccountId) {
    throw new Error("No puedes transferir a la misma cuenta");
  }

  if (amount <= 0) {
    throw new Error("El monto debe ser mayor a cero");
  }

  try {
    // Obtener cuentas actualizadas
    const accounts = await getUserAccounts(userId);
    const fromAccount = accounts.find((acc) => acc.id === fromAccountId);
    const toAccount = accounts.find((acc) => acc.id === toAccountId);

    if (!fromAccount || !toAccount) {
      throw new Error("Una o ambas cuentas no existen");
    }

    if (fromAccount.balance < amount) {
      throw new Error("Saldo insuficiente para realizar la transferencia");
    }

    // Actualizar balances
    const updatedFromAccount = {
      ...fromAccount,
      balance: fromAccount.balance - amount,
    };

    const updatedToAccount = {
      ...toAccount,
      balance: toAccount.balance + amount,
    };

    // Guardar cambios
    await updateAccount(updatedFromAccount);
    await updateAccount(updatedToAccount);

    return;
  } catch (error) {
    console.error(`Error in transferBetweenAccounts:`, error);
    throw error;
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
      const localData = localStorage.getItem(localStorageKey) || "[]";
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

    // Para actualizaciones, puede ser necesario ajustar la cuenta anterior
    if (operation === "update" && previousAccountId && previousAccountId !== accountId) {
      const previousAccount = accounts.find((acc) => acc.id === previousAccountId);

      if (previousAccount) {
        const updatedPreviousAccount = {
          ...previousAccount,
          balance: collection === "incomes" ? previousAccount.balance - amount : previousAccount.balance + amount,
        };

        await updateAccount(updatedPreviousAccount);
      }
    }

    // Actualizamos el balance según la operación
    const newBalance = calculateNewBalance(account.balance, amountChange, operation);

    // Actualizar cuenta
    const updatedAccount = {
      ...account,
      balance: newBalance,
    };

    await updateAccount(updatedAccount);
  } catch (error) {
    console.error(`Error updating account balance:`, error);
    throw error;
  }
};

// Función auxiliar para calcular el nuevo balance
function calculateNewBalance(currentBalance: number, amountChange: number, operation: "add" | "update" | "delete"): number {
  switch (operation) {
    case "add":
      return currentBalance + amountChange;
    case "update":
      return currentBalance + amountChange; // Asumimos que ya se manejó el caso de cambio de cuenta
    case "delete":
      return currentBalance - amountChange;
    default:
      return currentBalance;
  }
}

// Recalcular el saldo de una cuenta basado en las transacciones reales
export const recalculateAccountBalance = async (accountId: string, userId: string): Promise<number> => {
  try {
    // Obtener todos los ingresos y gastos del usuario
    const incomes = await incomeService.getUserItems(userId);
    const expenses = await expenseService.getUserItems(userId);

    // Filtrar transacciones asociadas a esta cuenta
    const accountIncomes = incomes.filter((item) => item.accountId === accountId);
    const accountExpenses = expenses.filter((item) => item.accountId === accountId);

    // Calcular el saldo real basado solo en transacciones existentes
    const incomesTotal = accountIncomes.reduce((sum, income) => sum + income.amount, 0);
    const expensesTotal = accountExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    // El saldo real es ingresos menos gastos
    const realBalance = incomesTotal - expensesTotal;

    console.log(`Recalculando saldo para cuenta ${accountId}:`);
    console.log(`- Ingresos: ${incomesTotal}`);
    console.log(`- Gastos: ${expensesTotal}`);
    console.log(`- Saldo real calculado: ${realBalance}`);

    // Actualizar el saldo en Firebase y localStorage
    const accountData = await getAccountById(accountId);
    if (accountData) {
      console.log(`- Saldo anterior: ${accountData.balance}`);

      // Si el saldo es diferente, actualizarlo
      if (Math.abs(accountData.balance - realBalance) > 0.001) {
        console.log(`- Actualización necesaria: ${accountData.balance} -> ${realBalance}`);

        const updatedAccount = {
          ...accountData,
          balance: realBalance,
        };

        // Actualizar en Firebase y localStorage
        await updateAccount(updatedAccount);

        // Actualizar también en el estado global
        const accounts = useAccountStore.getState().accounts;
        const updatedAccounts = accounts.map((acc) => (acc.id === accountId ? { ...acc, balance: realBalance } : acc));
        useAccountStore.getState().setAccounts(updatedAccounts);

        console.log(`- Saldo actualizado correctamente a ${realBalance}`);
      } else {
        console.log(`- El saldo ya es correcto: ${accountData.balance}`);
      }

      return realBalance;
    }

    return 0;
  } catch (error) {
    console.error("Error recalculando saldo de cuenta:", error);
    return 0;
  }
};

// Función para obtener una cuenta por ID
export const getAccountById = async (accountId: string): Promise<Account | null> => {
  try {
    // Intentar obtener del estado global primero
    const accounts = useAccountStore.getState().accounts;
    const accountFromState = accounts.find((acc) => acc.id === accountId);

    if (accountFromState) {
      return accountFromState;
    }

    // Si no está en el estado, intentar obtenerla de localStorage
    const localData = localStorage.getItem(localStorageKey) || "[]";
    const parsedData = JSON.parse(localData);
    const accountFromLocal = parsedData.find((acc: Account) => acc.id === accountId);

    if (accountFromLocal) {
      return accountFromLocal;
    }

    // Si no está en localStorage, intentar obtenerla de Firebase
    if (isOnline()) {
      const accountRef = doc(db, "accounts", accountId);
      const accountDoc = await getDoc(accountRef);

      if (accountDoc.exists()) {
        const data = accountDoc.data();
        return {
          id: accountDoc.id,
          name: data.name,
          color: data.color,
          balance: data.balance,
          userId: data.userId,
          isDefault: data.isDefault,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Error obteniendo cuenta por ID:", error);
    return null;
  }
};

// Forzar un reinicio del saldo a cero y recalcular desde las transacciones
export const forceResetAndRecalculateBalance = async (accountId: string, userId: string): Promise<number> => {
  try {
    // Primero, obtenemos los datos de la cuenta
    const accountData = await getAccountById(accountId);

    if (!accountData) {
      console.error("No se encontró la cuenta para reiniciar el saldo");
      return 0;
    }

    console.log(`Forzando reinicio de saldo para cuenta ${accountData.name} (${accountId})`);
    console.log(`- Saldo actual: ${accountData.balance}`);

    // Paso 1: Reiniciar el saldo a 0
    const resetAccount = {
      ...accountData,
      balance: 0,
    };

    // Actualizar la cuenta con saldo cero
    await updateAccount(resetAccount);
    console.log(`- Saldo reiniciado a cero`);

    // Paso 2: Recalcular el saldo basado en transacciones
    // Obtener todos los ingresos y gastos del usuario
    const incomes = await incomeService.getUserItems(userId);
    const expenses = await expenseService.getUserItems(userId);

    // Filtrar transacciones asociadas a esta cuenta
    const accountIncomes = incomes.filter((item) => item.accountId === accountId);
    const accountExpenses = expenses.filter((item) => item.accountId === accountId);

    // Calcular el saldo real basado solo en transacciones existentes
    const incomesTotal = accountIncomes.reduce((sum, income) => sum + income.amount, 0);
    const expensesTotal = accountExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    // El saldo real es ingresos menos gastos
    const realBalance = incomesTotal - expensesTotal;

    console.log(`- Ingresos calculados: ${incomesTotal}`);
    console.log(`- Gastos calculados: ${expensesTotal}`);
    console.log(`- Saldo real calculado: ${realBalance}`);

    // Paso 3: Actualizar el saldo en la base de datos
    const updatedAccount = {
      ...accountData,
      balance: realBalance,
    };

    await updateAccount(updatedAccount);
    console.log(`- Saldo forzado y actualizado correctamente a ${realBalance}`);

    // Actualizar también en el estado global
    const accounts = useAccountStore.getState().accounts;
    const updatedAccounts = accounts.map((acc) => (acc.id === accountId ? { ...acc, balance: realBalance } : acc));
    useAccountStore.getState().setAccounts(updatedAccounts);

    return realBalance;
  } catch (error) {
    console.error("Error al forzar el reinicio del saldo de la cuenta:", error);
    return 0;
  }
};

// NUEVAS FUNCIONES SIMPLIFICADAS

// Calcular el saldo de una cuenta en tiempo real basado en sus transacciones
export const getAccountBalance = async (accountId: string, userId: string): Promise<number> => {
  try {
    if (!accountId) return 0;

    // Obtener ingresos y gastos del usuario
    const incomes = await incomeService.getUserItems(userId);
    const expenses = await expenseService.getUserItems(userId);

    // Filtrar solo las transacciones de esta cuenta
    const accountIncomes = incomes.filter((income) => income.accountId === accountId);
    const accountExpenses = expenses.filter((expense) => expense.accountId === accountId);

    // Calcular totales
    const totalIncomes = accountIncomes.reduce((sum, income) => sum + income.amount, 0);
    const totalExpenses = accountExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Saldo es ingresos menos gastos
    return totalIncomes - totalExpenses;
  } catch (error) {
    console.error("Error calculando saldo real:", error);
    return 0;
  }
};

// Calcular balances para todas las cuentas
export const getAllAccountsBalances = async (accounts: Account[], userId: string): Promise<Map<string, number>> => {
  try {
    const balances = new Map<string, number>();

    // Obtener todos los ingresos y gastos una sola vez
    const incomes = await incomeService.getUserItems(userId);
    const expenses = await expenseService.getUserItems(userId);

    // Calcular el saldo para cada cuenta
    for (const account of accounts) {
      // Filtrar solo las transacciones de esta cuenta
      const accountIncomes = incomes.filter((income) => income.accountId === account.id);
      const accountExpenses = expenses.filter((expense) => expense.accountId === account.id);

      // Calcular totales
      const totalIncomes = accountIncomes.reduce((sum, income) => sum + income.amount, 0);
      const totalExpenses = accountExpenses.reduce((sum, expense) => sum + expense.amount, 0);

      // Guardar el saldo calculado
      balances.set(account.id, totalIncomes - totalExpenses);
    }

    return balances;
  } catch (error) {
    console.error("Error calculando saldos de cuentas:", error);
    return new Map<string, number>();
  }
};

/**
 * Calcula el saldo real de una cuenta basado en sus transacciones
 * @param accountId ID de la cuenta
 * @param userId ID del usuario
 * @returns El saldo calculado
 */
export const calculateAccountBalance = async (accountId: string, userId: string): Promise<number> => {
  try {
    // Obtener todos los ingresos de la cuenta
    const incomeQuery = query(collection(db, "incomes"), where("userId", "==", userId), where("accountId", "==", accountId));
    const incomeSnapshot = await getDocs(incomeQuery);
    const incomeTotal = incomeSnapshot.docs.reduce((sum, doc) => {
      const income = doc.data() as Income;
      return sum + income.amount;
    }, 0);

    // Obtener todos los gastos de la cuenta
    const expenseQuery = query(collection(db, "expenses"), where("userId", "==", userId), where("accountId", "==", accountId));
    const expenseSnapshot = await getDocs(expenseQuery);
    const expenseTotal = expenseSnapshot.docs.reduce((sum, doc) => {
      const expense = doc.data() as Expense;
      return sum + expense.amount;
    }, 0);

    // Calcular el saldo como ingresos - gastos
    const calculatedBalance = incomeTotal - expenseTotal;
    return calculatedBalance;
  } catch (error) {
    console.error("Error calculating account balance:", error);
    throw error;
  }
};

/**
 * Actualiza el saldo de una cuenta con el valor calculado de sus transacciones
 * @param accountId ID de la cuenta
 * @param userId ID del usuario
 * @returns Verdadero si se actualizó correctamente
 */
export const updateAccountBalanceFromTransactions = async (accountId: string, userId: string): Promise<boolean> => {
  try {
    // Calcular el saldo correcto
    const calculatedBalance = await calculateAccountBalance(accountId, userId);

    // Obtener la referencia a la cuenta
    const accountRef = doc(db, "accounts", accountId);

    // Actualizar el saldo
    await updateDoc(accountRef, {
      balance: calculatedBalance,
      lastUpdated: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("Error updating account balance:", error);
    return false;
  }
};

/**
 * Actualiza los saldos de todas las cuentas del usuario
 * @param userId ID del usuario
 * @returns Array con IDs de las cuentas actualizadas
 */
export const updateAllAccountBalances = async (userId: string): Promise<string[]> => {
  try {
    // Obtener todas las cuentas del usuario
    const userAccountsQuery = query(collection(db, "accounts"), where("userId", "==", userId));
    const snapshot = await getDocs(userAccountsQuery);
    const accounts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Account[];

    const updatedAccounts: string[] = [];

    // Para cada cuenta, actualizar su saldo
    for (const account of accounts) {
      const success = await updateAccountBalanceFromTransactions(account.id, userId);
      if (success) {
        updatedAccounts.push(account.id);
      }
    }

    return updatedAccounts;
  } catch (error) {
    console.error("Error updating all account balances:", error);
    return [];
  }
};

/**
 * Cleanup duplicate "Efectivo" accounts for a user
 * This function will keep the oldest "Efectivo" account and delete any duplicates
 */
export const cleanupDuplicateAccounts = async (userId: string): Promise<number> => {
  try {
    // 1. Obtener todas las cuentas del usuario
    const accounts = await getUserAccounts(userId);
    
    // 2. Filtrar las cuentas "Efectivo"
    const efectivoAccounts = accounts.filter(acc => 
      acc.name === "Efectivo" && acc.isDefault
    );
    
    // Si hay menos de 2 cuentas, no hay duplicados
    if (efectivoAccounts.length < 2) {
      return 0;
    }
    
    // 3. Ordenar por fecha de creación (asumiendo que el ID contiene timestamp)
    efectivoAccounts.sort((a, b) => {
      const timestampA = a.id.split('-')[0];
      const timestampB = b.id.split('-')[0];
      return parseInt(timestampA) - parseInt(timestampB);
    });
    
    // 4. Mantener la cuenta más antigua y eliminar el resto
    const [oldestAccount, ...duplicates] = efectivoAccounts;
    
    // 5. Eliminar las cuentas duplicadas
    const batch = writeBatch(db);
    
    for (const account of duplicates) {
      // Obtener transacciones asociadas a la cuenta duplicada
      const { deleteFinancesByAccountId } = await import('./financeService');
      await deleteFinancesByAccountId(account.id);
      
      // Eliminar la cuenta
      const accountRef = doc(db, "accounts", account.id);
      batch.delete(accountRef);
    }
    
    // Ejecutar el batch
    await batch.commit();
    
    return duplicates.length;
  } catch (error) {
    console.error("Error limpiando cuentas duplicadas:", error);
    return 0;
  }
};
