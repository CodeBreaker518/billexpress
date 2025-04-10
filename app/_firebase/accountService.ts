"use client";

import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "./config";
import { useAccountStore } from "@bill/_store/useAccountStore";
import { getAuth } from "firebase/auth";
import { countOrphanedFinances, deleteFinancesByAccountId } from "./financeService";

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
    // SEGURIDAD: Verificar que hay un userId válido
    if (!userId) {
      console.error("No se proporcionó un userId válido en getUserAccounts");
      return [];
    }

    console.log(`Consultando cuentas para usuario: ${userId}`);
    
    // Filtrar SIEMPRE por userId en la query de Firestore
    const q = query(collection_ref, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    // Mapear resultados a objetos Account
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

    // SEGURIDAD: Validación adicional - Verificar que todas las cuentas pertenecen al usuario
    const validAccounts = accounts.filter(acc => acc.userId === userId);
    
    if (validAccounts.length !== accounts.length) {
      console.error(`ALERTA DE SEGURIDAD: Se encontraron ${accounts.length - validAccounts.length} cuentas que no pertenecen al usuario ${userId}`);
      // Aquí podrías implementar algún mecanismo de auditoría o notificación
      accounts = validAccounts;
    }

    console.log(`Recuperadas ${accounts.length} cuentas para el usuario ${userId}`);

    // Si no hay cuentas, crear la cuenta por defecto "Efectivo" para este usuario
    if (accounts.length === 0) {
      console.log(`Creando cuenta Efectivo por defecto para el usuario: ${userId}`);
      
      // Verificar explícitamente que estamos creando una cuenta con el userId correcto
      const defaultAccount = await addAccount({
        name: "Efectivo",
        color: "#22c55e", // Verde
        balance: 0,
        userId: userId,
        isDefault: true,
      });
      
      console.log(`Cuenta por defecto creada con éxito para ${userId}: ${defaultAccount.id}`);
      accounts = [defaultAccount];
    } else {
      // Verificar si hay una cuenta por defecto
      const hasDefault = accounts.some(acc => acc.isDefault);
      
      if (!hasDefault && accounts.length > 0) {
        // Si no hay ninguna cuenta marcada como predeterminada, marcar la primera
        console.log(`No se encontró cuenta por defecto para ${userId}. Estableciendo la primera como predeterminada`);
        const accountToMakeDefault = accounts[0];
        const accountRef = doc(db, "accounts", accountToMakeDefault.id);
        
        try {
          await updateDoc(accountRef, {
            isDefault: true,
            updatedAt: serverTimestamp()
          });
          
          // Actualizar en memoria también
          accountToMakeDefault.isDefault = true;
        } catch (updateError) {
          console.error("Error al establecer cuenta predeterminada:", updateError);
        }
      }
    }

    return accounts;
  } catch (error) {
    console.error(`Error al obtener cuentas del usuario ${userId}:`, error);
    
    // Último recurso - cuenta predeterminada temporal (no se guarda en la BD)
    console.warn(`Generando cuenta temporal para ${userId} como último recurso`);
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
    // SEGURIDAD: Verificar que haya un userId
    if (!account.userId) {
      throw new Error("No se puede crear una cuenta sin un ID de usuario");
    }

    console.log(`Creando nueva cuenta "${account.name}" para usuario: ${account.userId}`);

    const docRef = await addDoc(collection_ref, {
      ...account,
      createdAt: serverTimestamp(),
    });

    // Crear objeto con el ID asignado por Firebase
    const createdAccount = {
      ...account,
      id: docRef.id,
    };

    console.log(`Cuenta creada con ID: ${createdAccount.id} para usuario: ${account.userId}`);

    // Actualizar directamente el estado global de cuentas
    try {
      const { accounts, addAccount: addAccountToStore } = useAccountStore.getState();

      // Solo añadir si no existe ya y pertenece al usuario actual
      if (!accounts.some((acc) => acc.id === createdAccount.id)) {
        addAccountToStore(createdAccount);
      }
    } catch (storeError) {
      console.warn("Error actualizando el estado global de cuentas:", storeError);
      // Continuamos, ya que la cuenta ya está creada en Firestore
    }

    return createdAccount;
  } catch (error) {
    console.error(`Error al añadir cuenta para usuario ${account.userId}:`, error);
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
    // Obtener el usuario actual
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error("Usuario no autenticado");
    }
    
    // Verificar primero si hay transacciones asociadas
    const { orphanedCount } = await countOrphanedFinances(id, currentUser.uid);
    if (orphanedCount > 0) {
      // Si hay transacciones, eliminarlas primero
      await deleteFinancesByAccountId(id, currentUser.uid);
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
