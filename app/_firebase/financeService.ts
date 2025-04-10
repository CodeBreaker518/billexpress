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
      // SEGURIDAD: Verificar que hay un userId válido
      if (!userId) {
        console.error(`No se proporcionó un userId válido en getUserItems de ${entityType}`);
        return [];
      }

      console.log(`Consultando ${entityType} para usuario: ${userId}`);
      
      // Filtrar SIEMPRE por userId en la query de Firestore
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

      // SEGURIDAD: Validación adicional - Verificar que todos los elementos pertenecen al usuario
      const validItems = items.filter(item => item.userId === userId);
      
      if (validItems.length !== items.length) {
        console.error(`ALERTA DE SEGURIDAD: Se encontraron ${items.length - validItems.length} registros que no pertenecen al usuario ${userId}`);
        // Aquí podrías implementar algún mecanismo de auditoría o notificación
      }

      console.log(`Recuperados ${validItems.length} ${entityType} para el usuario ${userId}`);
      return validItems;
    } catch (error) {
      console.error(`Error fetching ${entityType}:`, error);
      return [];
    }
  };

  // Añadir un nuevo elemento
  const addItem = async (item: Omit<FinanceItem, "id">): Promise<FinanceItem> => {
    try {
      // SEGURIDAD: Verificar que haya un userId
      if (!item.userId) {
        throw new Error(`No se puede crear ${entityType} sin un ID de usuario`);
      }

      // SEGURIDAD: Verificar que el accountId pertenezca al usuario actual
      if (item.accountId) {
        const accountRef = doc(db, "accounts", item.accountId);
        const accountSnap = await getDoc(accountRef);
        
        if (!accountSnap.exists()) {
          throw new Error(`La cuenta ${item.accountId} no existe`);
        }
        
        const accountData = accountSnap.data();
        if (accountData.userId !== item.userId) {
          console.error(`Intento de usar cuenta de otro usuario detectado. UserId: ${item.userId}, Account: ${item.accountId}, AccountUserId: ${accountData.userId}`);
          // Eliminar el accountId para evitar la vinculación con cuentas de otros usuarios
          item.accountId = undefined;
        }
      }

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
      // SEGURIDAD: Verificar que hay un userId
      if (!item.userId) {
        throw new Error(`No se puede actualizar ${entityType} sin un ID de usuario`);
      }

      // SEGURIDAD: Verificar que el usuario es propietario del elemento
      const itemRef = doc(db, entityType, item.id);
      const docSnap = await getDoc(itemRef);
      
      if (!docSnap.exists()) {
        throw new Error(`El ${entityType} con ID ${item.id} no existe`);
      }
      
      const existingData = docSnap.data();
      if (existingData.userId !== item.userId) {
        console.error(`ALERTA DE SEGURIDAD: Intento de actualizar ${entityType} de otro usuario. ID: ${item.id}, Usuario solicitante: ${item.userId}, Usuario propietario: ${existingData.userId}`);
        throw new Error(`No autorizado: Este ${entityType} pertenece a otro usuario`);
      }

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

      // Realizar la actualización
      await updateDoc(itemRef, updateData);
      console.log(`${entityType} actualizado con éxito. ID: ${item.id}, Usuario: ${item.userId}`);
    } catch (error) {
      console.error(`Error in update${entityType.slice(0, -1)}:`, error);
      throw error;
    }
  };

  // Eliminar un elemento
  const deleteItem = async (id: string, userId?: string): Promise<void> => {
    try {
      // SEGURIDAD: Si se proporciona un userId, verificar la propiedad
      if (userId) {
        const itemRef = doc(db, entityType, id);
        const docSnap = await getDoc(itemRef);
        
        if (!docSnap.exists()) {
          throw new Error(`El ${entityType} con ID ${id} no existe`);
        }
        
        const existingData = docSnap.data();
        if (existingData.userId !== userId) {
          console.error(`ALERTA DE SEGURIDAD: Intento de eliminar ${entityType} de otro usuario. ID: ${id}, Usuario solicitante: ${userId}, Usuario propietario: ${existingData.userId}`);
          throw new Error(`No autorizado: Este ${entityType} pertenece a otro usuario`);
        }

        console.log(`Eliminando ${entityType} con ID ${id} del usuario ${userId}`);
        await deleteDoc(itemRef);
      } else {
        // Uso interno sin verificación de usuario (¡utilizar con precaución!)
        console.warn(`Eliminando ${entityType} con ID ${id} SIN verificación de usuario`);
        const itemRef = doc(db, entityType, id);
        await deleteDoc(itemRef);
      }
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
  accountId: string,
  userId?: string
): Promise<{
  orphanedCount: number;
  orphanedIncomesCount: number;
  orphanedExpensesCount: number;
}> => {
  try {
    // Si no hay userId, no podemos hacer la consulta con seguridad
    if (!userId) {
      console.warn("countOrphanedFinances: No se proporcionó userId, esto puede causar problemas de permisos");
    }
    
    // Buscar ingresos asociados a la cuenta
    const incomesQuery = userId 
      ? query(collection(db, "incomes"), where("accountId", "==", accountId), where("userId", "==", userId))
      : query(collection(db, "incomes"), where("accountId", "==", accountId));
    const incomesSnapshot = await getDocs(incomesQuery);

    // Buscar gastos asociados a la cuenta
    const expensesQuery = userId
      ? query(collection(db, "expenses"), where("accountId", "==", accountId), where("userId", "==", userId))
      : query(collection(db, "expenses"), where("accountId", "==", accountId));
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
  accountId: string,
  userId: string
): Promise<{
  deletedIncomesCount: number;
  deletedExpensesCount: number;
}> => {
  try {
    if (!userId) {
      console.error("No se proporcionó userId para eliminar finanzas de una cuenta");
      throw new Error("Se requiere userId para eliminar finanzas");
    }

    // Obtener ingresos asociados a la cuenta Y al usuario
    const incomesQuery = query(
      collection(db, "incomes"), 
      where("accountId", "==", accountId),
      where("userId", "==", userId)
    );
    const incomesSnapshot = await getDocs(incomesQuery);

    // Eliminar ingresos
    let deletedIncomesCount = 0;
    for (const doc of incomesSnapshot.docs) {
      await deleteDoc(doc.ref);
      deletedIncomesCount++;
    }

    // Obtener gastos asociados a la cuenta Y al usuario
    const expensesQuery = query(
      collection(db, "expenses"), 
      where("accountId", "==", accountId),
      where("userId", "==", userId)
    );
    const expensesSnapshot = await getDocs(expensesQuery);

    // Eliminar gastos
    let deletedExpensesCount = 0;
    for (const doc of expensesSnapshot.docs) {
      await deleteDoc(doc.ref);
      deletedExpensesCount++;
    }

    // No intentamos actualizar el estado local directamente
    // En su lugar, dejaremos que el componente que llama a esta función
    // se encargue de actualizar el estado si es necesario

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
  financeItem: { amount: number; id: string; userId: string; [key: string]: unknown },
  accountId: string,
  operation: "add" | "update" | "delete",
  previousAccountId?: string
): Promise<void> => {
  try {
    if (!financeItem.userId) {
      console.error("Error: userId es requerido para actualizar el saldo de la cuenta");
      return;
    }

    if (!accountId) {
      console.warn("No se proporcionó un accountId válido, no se actualizará ningún saldo");
      return;
    }

    const userId = financeItem.userId as string;
    console.log(`Operación ${operation} ${collection} para usuario ${userId} en cuenta ${accountId}`);

    // SEGURIDAD: Verificar que la cuenta pertenezca al usuario
    const accountRef = doc(db, "accounts", accountId);
    const accountSnapshot = await getDoc(accountRef);

    if (!accountSnapshot.exists()) {
      console.error(`La cuenta ${accountId} no existe, no se actualizará el saldo`);
      return;
    }

    const accountData = accountSnapshot.data();
    if (accountData.userId !== userId) {
      console.error(`Intento de actualizar cuenta de otro usuario. UserId: ${userId}, AccountUserId: ${accountData.userId}`);
      return;
    }

    // Si hay un previousAccountId, también verificar que pertenezca al usuario
    if (previousAccountId) {
      const prevAccountRef = doc(db, "accounts", previousAccountId);
      const prevAccountSnapshot = await getDoc(prevAccountRef);

      if (prevAccountSnapshot.exists()) {
        const prevAccountData = prevAccountSnapshot.data();
        if (prevAccountData.userId !== userId) {
          console.error(`Intento de actualizar cuenta previa de otro usuario. UserId: ${userId}, PrevAccountUserId: ${prevAccountData.userId}`);
          // No debemos usar esta cuenta previa
          previousAccountId = undefined;
        }
      } else {
        // Si la cuenta previa no existe, no la usamos
        previousAccountId = undefined;
      }
    }

    // Para operaciones de actualización o cuando hay cambio de cuenta,
    // simplemente recalculamos todos los saldos para mayor precisión
    if (operation === "update" || (previousAccountId && previousAccountId !== accountId)) {
      console.log("Recalculando todos los saldos para mayor precisión...");
      await recalculateAllAccountBalances(userId);
      return;
    }

    // Para add y delete simples, actualizamos solo la cuenta específica
    // Obtener la cuenta directamente de Firebase
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
