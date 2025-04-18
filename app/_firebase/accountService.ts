"use client";

import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, getDoc, serverTimestamp, writeBatch, orderBy } from "firebase/firestore";
import { db } from "./config";
import { useAccountStore } from "@bill/_store/useAccountStore";
import { getAuth } from "firebase/auth";
import { countOrphanedFinances, deleteFinancesByAccountId } from "./financeService";
import { Timestamp } from "firebase/firestore";

// Tipo para cuentas
export interface Account {
  id: string;
  name: string;
  color: string;
  balance: number;
  userId: string;
  isDefault?: boolean;
  transactionCount?: number;
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
        transactionCount: data.transactionCount || 0,
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
        transactionCount: 0,
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
    
    // Verificar si la cuenta tiene saldo
    const account = await getAccountById(id);
    if (!account) {
      throw new Error("Cuenta no encontrada");
    }
    
    // Verificar que la cuenta pertenezca al usuario
    if (account.userId !== currentUser.uid) {
      throw new Error("No tienes permiso para eliminar esta cuenta");
    }
    
    // Verificar si la cuenta tiene saldo
    if (account.balance > 0) {
      throw new Error("No puedes eliminar una cuenta con saldo. Por favor, transfiere todo el dinero a otras cuentas primero.");
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

// Transferir entre cuentas (versión optimizada)
export const transferBetweenAccountsOptimized = async (fromAccountId: string, toAccountId: string, amount: number, userId: string, description?: string): Promise<void> => {
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

    // Actualizar los saldos directamente, sin recálculos completos
    const newFromBalance = fromAccount.balance - amount;
    const newToBalance = toAccount.balance + amount;

    // Usar un batch para garantizar operación atómica
    const batch = writeBatch(db);

    // Actualizar la cuenta de origen con el nuevo saldo
    batch.update(fromAccountRef, {
      balance: newFromBalance,
      updatedAt: serverTimestamp(),
      transactionCount: (fromAccount.transactionCount || 0) + 1
    });

    // Actualizar la cuenta de destino con el nuevo saldo
    batch.update(toAccountRef, {
      balance: newToBalance,
      updatedAt: serverTimestamp(),
      transactionCount: (toAccount.transactionCount || 0) + 1
    });

    // Registrar la transferencia en la colección "transfers" para auditoría
    const transferData = {
      fromAccountId,
      toAccountId,
      fromAccountName: fromAccount.name,
      toAccountName: toAccount.name,
      amount,
      userId,
      date: Timestamp.fromDate(new Date()),
      description: description || `Transferencia de ${fromAccount.name} a ${toAccount.name}`,
      createdAt: serverTimestamp()
    };
    
    const transfersCollectionRef = collection(db, "transfers");
    const transferDocRef = doc(transfersCollectionRef);
    batch.set(transferDocRef, transferData);

    // Ejecutar el batch (una sola operación de escritura a Firestore)
    await batch.commit();

    // Actualizar el estado global
    const { updateAccount: updateAccountInStore } = useAccountStore.getState();
    updateAccountInStore({
      ...fromAccount,
      balance: newFromBalance,
      transactionCount: (fromAccount.transactionCount || 0) + 1
    });
    updateAccountInStore({
      ...toAccount,
      balance: newToBalance,
      transactionCount: (toAccount.transactionCount || 0) + 1
    });

    console.log(`Transferencia optimizada completada: ${amount} de ${fromAccount.name} a ${toAccount.name}`);
  } catch (error) {
    console.error("Error en transferencia entre cuentas:", error);
    throw error;
  }
};

// Transferir entre cuentas (método original para compatibilidad)
export const transferBetweenAccounts = async (fromAccountId: string, toAccountId: string, amount: number, userId: string, description?: string): Promise<void> => {
  // Redirigir a la versión optimizada
  return transferBetweenAccountsOptimized(fromAccountId, toAccountId, amount, userId, description);
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
      transactionCount: accountData.transactionCount || 0,
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
    
    // Obtener transferencias salientes (resta del saldo)
    const transfersOutQuery = query(
      collection(db, "transfers"), 
      where("fromAccountId", "==", accountId), 
      where("userId", "==", userId)
    );
    const transfersOutSnapshot = await getDocs(transfersOutQuery);

    // Calcular total de transferencias salientes
    let totalTransfersOut = 0;
    transfersOutSnapshot.forEach((doc) => {
      totalTransfersOut += doc.data().amount || 0;
    });

    // Obtener transferencias entrantes (suma al saldo)
    const transfersInQuery = query(
      collection(db, "transfers"), 
      where("toAccountId", "==", accountId), 
      where("userId", "==", userId)
    );
    const transfersInSnapshot = await getDocs(transfersInQuery);

    // Calcular total de transferencias entrantes
    let totalTransfersIn = 0;
    transfersInSnapshot.forEach((doc) => {
      totalTransfersIn += doc.data().amount || 0;
    });

    // Calcular saldo incluyendo transferencias
    const newBalance = totalIncome - totalExpense - totalTransfersOut + totalTransfersIn;

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

// Obtener las transferencias de un usuario
export const getUserTransfers = async (userId: string): Promise<any[]> => {
  try {
    if (!userId) {
      console.error("No se proporcionó un userId válido en getUserTransfers");
      return [];
    }

    const transfersRef = collection(db, "transfers");
    const q = query(transfersRef, where("userId", "==", userId), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate() || new Date() // Convertir Timestamp a Date
    }));
  } catch (error) {
    console.error("Error al obtener transferencias:", error);
    return [];
  }
};

// Función para verificar la precisión de los saldos periódicamente
export const verifyAccountBalancesPeriodically = async (userId: string): Promise<{
  accountsChecked: number;
  accountsWithDiscrepancies: number;
  fixedAccountIds: string[];
  discrepanciesFound: Array<{accountId: string, name: string, expectedBalance: number, actualBalance: number, difference: number}>;
}> => {
  try {
    console.log("Verificación periódica de saldos iniciada para usuario:", userId);
    
    // Obtener todas las cuentas del usuario
    const accounts = await getUserAccounts(userId);
    let accountsChecked = 0;
    let accountsWithDiscrepancies = 0;
    const fixedAccountIds: string[] = [];
    const discrepanciesFound: Array<{
      accountId: string;
      name: string;
      expectedBalance: number;
      actualBalance: number;
      difference: number;
    }> = [];

    // Para cada cuenta, calcular su saldo "esperado" basado en transacciones
    for (const account of accounts) {
      accountsChecked++;
      console.log(`Verificando cuenta ${account.id} (${account.name})`);
      
      // Calcular el saldo esperado: ingresos - gastos + transferenciasEntrantes - transferenciasSalientes
      try {
        // Obtener todos los ingresos de la cuenta
        const incomesQuery = query(
          collection(db, "incomes"), 
          where("accountId", "==", account.id), 
          where("userId", "==", userId)
        );
        const incomesSnapshot = await getDocs(incomesQuery);
        let totalIncomes = 0;
        incomesSnapshot.forEach(doc => {
          totalIncomes += doc.data().amount || 0;
        });

        // Obtener todos los gastos de la cuenta
        const expensesQuery = query(
          collection(db, "expenses"), 
          where("accountId", "==", account.id), 
          where("userId", "==", userId)
        );
        const expensesSnapshot = await getDocs(expensesQuery);
        let totalExpenses = 0;
        expensesSnapshot.forEach(doc => {
          totalExpenses += doc.data().amount || 0;
        });

        // Obtener transferencias entrantes
        const transfersInQuery = query(
          collection(db, "transfers"), 
          where("toAccountId", "==", account.id), 
          where("userId", "==", userId)
        );
        const transfersInSnapshot = await getDocs(transfersInQuery);
        let totalTransfersIn = 0;
        transfersInSnapshot.forEach(doc => {
          totalTransfersIn += doc.data().amount || 0;
        });

        // Obtener transferencias salientes
        const transfersOutQuery = query(
          collection(db, "transfers"), 
          where("fromAccountId", "==", account.id), 
          where("userId", "==", userId)
        );
        const transfersOutSnapshot = await getDocs(transfersOutQuery);
        let totalTransfersOut = 0;
        transfersOutSnapshot.forEach(doc => {
          totalTransfersOut += doc.data().amount || 0;
        });

        // Calcular saldo esperado
        const expectedBalance = totalIncomes - totalExpenses + totalTransfersIn - totalTransfersOut;
        
        // Comparar con saldo actual
        const difference = Math.abs(expectedBalance - account.balance);
        
        // Si hay discrepancia mayor a 0.01 (para evitar problemas de redondeo)
        if (difference > 0.01) {
          accountsWithDiscrepancies++;
          
          // Registrar la discrepancia
          discrepanciesFound.push({
            accountId: account.id,
            name: account.name,
            expectedBalance,
            actualBalance: account.balance,
            difference: expectedBalance - account.balance
          });
          
          console.log(`Discrepancia encontrada en cuenta ${account.name}:`);
          console.log(`  Saldo actual: ${account.balance}`);
          console.log(`  Saldo calculado: ${expectedBalance}`);
          console.log(`  Diferencia: ${expectedBalance - account.balance}`);
          
          // Corregir si es necesario
          if (process.env.NODE_ENV !== 'production' || Math.abs(difference) > 1) {
            console.log(`Corrigiendo saldo de cuenta ${account.name}`);
            
            // Actualizar en Firebase
            const accountRef = doc(db, "accounts", account.id);
            await updateDoc(accountRef, {
              balance: expectedBalance,
              updatedAt: serverTimestamp(),
              lastVerification: serverTimestamp()
            });
            
            // Actualizar en el estado
            try {
              const { updateAccount } = useAccountStore.getState();
              updateAccount({
                ...account,
                balance: expectedBalance
              });
            } catch (updateError) {
              console.error("Error actualizando estado local tras corrección:", updateError);
            }
            
            fixedAccountIds.push(account.id);
          }
        } else {
          console.log(`Saldo correcto en cuenta ${account.name}: ${account.balance}`);
          
          // Actualizar timestamp de última verificación
          const accountRef = doc(db, "accounts", account.id);
          await updateDoc(accountRef, {
            lastVerification: serverTimestamp()
          });
        }
      } catch (accountError) {
        console.error(`Error verificando cuenta ${account.id}:`, accountError);
      }
    }
    
    console.log("Verificación periódica completada:");
    console.log(`  Cuentas verificadas: ${accountsChecked}`);
    console.log(`  Cuentas con discrepancias: ${accountsWithDiscrepancies}`);
    console.log(`  Cuentas corregidas: ${fixedAccountIds.length}`);
    
    return {
      accountsChecked,
      accountsWithDiscrepancies,
      fixedAccountIds,
      discrepanciesFound
    };
  } catch (error) {
    console.error("Error en verificación periódica de saldos:", error);
    throw error;
  }
};
