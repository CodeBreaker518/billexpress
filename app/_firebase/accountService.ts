"use client";

import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "./config";
import { useAccountStore } from "@bill/_store/useAccountStore";

// Tipo para cuentas
export interface Account {
  id: string;
  name: string;
  color: string;
  balance: number;
  userId: string;
  isDefault?: boolean;
}

// Colección de Firebase
const collection_ref = collection(db, "accounts");

// Obtener cuentas para un usuario
export const getUserAccounts = async (userId: string): Promise<Account[]> => {
  try {
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

    // Si no hay cuentas, crear la cuenta por defecto "Efectivo"
    if (accounts.length === 0) {
      const defaultAccount = await addAccount({
        name: "Efectivo",
        color: "#22c55e", // Verde
        balance: 0,
        userId: userId,
        isDefault: true,
      });
      accounts = [defaultAccount];
    }

    return accounts;
  } catch (error) {
    console.error("Error al obtener cuentas del usuario:", error);
    // Último recurso - cuenta predeterminada
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

    // Actualizar directamente el estado global de cuentas
    const { accounts, addAccount: addAccountToStore } = useAccountStore.getState();

    // Solo añadir si no existe ya
    if (!accounts.some((acc) => acc.id === createdAccount.id)) {
      addAccountToStore(createdAccount);
    }

    return createdAccount;
  } catch (error) {
    console.error("Error al añadir cuenta:", error);
    throw error;
  }
};

// Actualizar una cuenta existente
export const updateAccount = async (account: Account): Promise<void> => {
  try {
    // No se puede editar la cuenta por defecto
    if (account.isDefault) {
      return;
    }

    const accountRef = doc(db, "accounts", account.id);
    await updateDoc(accountRef, {
      name: account.name,
      color: account.color,
      balance: account.balance,
      updatedAt: serverTimestamp(),
    });

    // Actualizar directamente el estado global
    const { updateAccount: updateAccountInStore } = useAccountStore.getState();
    updateAccountInStore(account);
  } catch (error) {
    console.error("Error al actualizar cuenta:", error);
    throw error;
  }
};

// Eliminar una cuenta
export const deleteAccount = async (id: string): Promise<void> => {
  try {
    // Verificar primero si hay transacciones asociadas
    const { orphanedCount } = await countOrphanedFinances(id);
    if (orphanedCount > 0) {
      // Si hay transacciones, eliminarlas primero
      await deleteFinancesByAccountId(id);
    }

    // Eliminar la cuenta
    const accountRef = doc(db, "accounts", id);
    await deleteDoc(accountRef);

    // Actualizar directamente el estado global
    const { deleteAccount: deleteAccountFromStore } = useAccountStore.getState();
    deleteAccountFromStore(id);
  } catch (error) {
    console.error("Error al eliminar cuenta:", error);
    throw error;
  }
};

// Transferir entre cuentas
export const transferBetweenAccounts = async (fromAccountId: string, toAccountId: string, amount: number, userId: string): Promise<void> => {
  try {
    if (fromAccountId === toAccountId) {
      throw new Error("No se puede transferir a la misma cuenta");
    }

    if (amount <= 0) {
      throw new Error("El monto debe ser mayor que cero");
    }

    // Obtener las cuentas actualizadas desde Firebase
    const fromAccountRef = doc(db, "accounts", fromAccountId);
    const toAccountRef = doc(db, "accounts", toAccountId);

    const fromAccountSnap = await getDoc(fromAccountRef);
    const toAccountSnap = await getDoc(toAccountRef);

    if (!fromAccountSnap.exists() || !toAccountSnap.exists()) {
      throw new Error("Una o ambas cuentas no existen");
    }

    const fromAccount = { id: fromAccountSnap.id, ...fromAccountSnap.data() } as Account;
    const toAccount = { id: toAccountSnap.id, ...toAccountSnap.data() } as Account;

    if (fromAccount.userId !== userId || toAccount.userId !== userId) {
      throw new Error("Las cuentas no pertenecen al usuario");
    }

    if (fromAccount.balance < amount) {
      throw new Error("Saldo insuficiente para realizar la transferencia");
    }

    // Realizar la transferencia usando un batch para operación atómica
    const batch = writeBatch(db);

    // Actualizar la cuenta de origen restando el monto
    batch.update(fromAccountRef, {
      balance: fromAccount.balance - amount,
      updatedAt: serverTimestamp(),
    });

    // Actualizar la cuenta de destino sumando el monto
    batch.update(toAccountRef, {
      balance: toAccount.balance + amount,
      updatedAt: serverTimestamp(),
    });

    // Ejecutar el batch
    await batch.commit();

    // Actualizar el estado global
    const { updateAccount: updateAccountInStore } = useAccountStore.getState();
    updateAccountInStore({
      ...fromAccount,
      balance: fromAccount.balance - amount,
    });
    updateAccountInStore({
      ...toAccount,
      balance: toAccount.balance + amount,
    });
  } catch (error) {
    console.error("Error en transferencia entre cuentas:", error);
    throw error;
  }
};

// Importar funciones de financeService para no crear dependencias circulares
import { countOrphanedFinances, deleteFinancesByAccountId } from "./financeService";

// Obtener una cuenta por ID
export const getAccountById = async (accountId: string): Promise<Account | null> => {
  try {
    const accountRef = doc(db, "accounts", accountId);
    const accountSnap = await getDoc(accountRef);

    if (!accountSnap.exists()) {
      return null;
    }

    const accountData = accountSnap.data();
    const account = {
      id: accountSnap.id,
      name: accountData.name,
      color: accountData.color,
      balance: accountData.balance,
      userId: accountData.userId,
      isDefault: accountData.isDefault || false,
    } as Account;

    return account;
  } catch (error) {
    console.error("Error al obtener cuenta por ID:", error);
    return null;
  }
};

// Forzar recálculo del saldo de una cuenta
export const forceResetAndRecalculateBalance = async (accountId: string, userId: string): Promise<number> => {
  try {
    // Obtener la cuenta
    const account = await getAccountById(accountId);
    if (!account) {
      throw new Error("Cuenta no encontrada");
    }

    // Verificar que la cuenta pertenezca al usuario
    if (account.userId !== userId) {
      throw new Error("La cuenta no pertenece al usuario");
    }

    // Obtener todos los ingresos de la cuenta
    const incomesQuery = query(collection(db, "incomes"), where("accountId", "==", accountId), where("userId", "==", userId));
    const incomesSnapshot = await getDocs(incomesQuery);

    // Calcular total de ingresos
    let totalIncome = 0;
    incomesSnapshot.forEach((doc) => {
      totalIncome += doc.data().amount || 0;
    });

    // Obtener todos los gastos de la cuenta
    const expensesQuery = query(collection(db, "expenses"), where("accountId", "==", accountId), where("userId", "==", userId));
    const expensesSnapshot = await getDocs(expensesQuery);

    // Calcular total de gastos
    let totalExpense = 0;
    expensesSnapshot.forEach((doc) => {
      totalExpense += doc.data().amount || 0;
    });

    // Calcular saldo
    const newBalance = totalIncome - totalExpense;

    // Actualizar saldo en Firebase
    const accountRef = doc(db, "accounts", account.id);
    await updateDoc(accountRef, {
      balance: newBalance,
      updatedAt: serverTimestamp(),
    });

    // Actualizar en el estado global
    const { updateAccount: updateAccountInStore } = useAccountStore.getState();
    updateAccountInStore({
      ...account,
      balance: newBalance,
    });

    return newBalance;
  } catch (error) {
    console.error("Error al recalcular saldo de cuenta:", error);
    throw error;
  }
};

// Obtener el saldo de una cuenta
export const getAccountBalance = async (accountId: string, userId: string): Promise<number> => {
  try {
    const account = await getAccountById(accountId);
    if (!account) {
      throw new Error("Cuenta no encontrada");
    }

    if (account.userId !== userId) {
      throw new Error("La cuenta no pertenece al usuario");
    }

    return account.balance;
  } catch (error) {
    console.error("Error al obtener saldo de cuenta:", error);
    return 0;
  }
};

// Obtener saldos de todas las cuentas
export const getAllAccountsBalances = async (accounts: Account[], userId: string): Promise<Map<string, number>> => {
  const balances = new Map<string, number>();

  try {
    for (const account of accounts) {
      if (account.userId === userId) {
        const balance = await getAccountBalance(account.id, userId);
        balances.set(account.id, balance);
      }
    }
  } catch (error) {
    console.error("Error al obtener saldos de todas las cuentas:", error);
  }

  return balances;
};

// Actualizar saldo de una cuenta desde transacciones
export const updateAccountBalanceFromTransactions = async (accountId: string, userId: string): Promise<boolean> => {
  try {
    await forceResetAndRecalculateBalance(accountId, userId);
    return true;
  } catch (error) {
    console.error("Error al actualizar saldo desde transacciones:", error);
    return false;
  }
};

// Actualizar saldos de todas las cuentas
export const updateAllAccountBalances = async (userId: string): Promise<string[]> => {
  const updatedAccounts: string[] = [];

  try {
    // Obtener todas las cuentas del usuario
    const accounts = await getUserAccounts(userId);

    for (const account of accounts) {
      try {
        await forceResetAndRecalculateBalance(account.id, userId);
        updatedAccounts.push(account.id);
      } catch (accountError) {
        console.error(`Error al actualizar saldo de cuenta ${account.id}:`, accountError);
      }
    }
  } catch (error) {
    console.error("Error al actualizar saldos de todas las cuentas:", error);
  }

  return updatedAccounts;
};
