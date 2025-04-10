"use client";

import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./config";
import { createFinanceService, FinanceItem, updateFinanceWithAccount } from "./financeService";

const { getUserItems, addItem: baseAddItem, updateItem: baseUpdateItem, deleteItem: baseDeleteItem } = createFinanceService("expenses");

// Get expenses for a user
export const getUserExpenses = getUserItems;

// Add a new expense
export const addExpense = async (item: Omit<FinanceItem, "id">): Promise<FinanceItem> => {
  // SEGURIDAD: Verificar que haya un userId
  if (!item.userId) {
    throw new Error("No se puede crear un gasto sin un ID de usuario");
  }

  // Si no tiene cuenta asignada, buscar y crear una cuenta por defecto para este usuario
  if (!item.accountId) {
    try {
      // Buscar la cuenta predeterminada SOLO de este usuario
      const { getUserAccounts } = await import("./accountService");
      const accounts = await getUserAccounts(item.userId);
      const defaultAccount = accounts.find((acc) => acc.isDefault) || accounts[0];

      if (defaultAccount) {
        console.log(`Asignando cuenta por defecto ${defaultAccount.id} al gasto para usuario ${item.userId}`);
        item.accountId = defaultAccount.id;
      } else {
        console.warn(`No se encontró ninguna cuenta para el usuario ${item.userId}, el gasto quedará sin cuenta asignada`);
      }
    } catch (error) {
      console.error("Error al buscar cuenta predeterminada:", error);
    }
  }

  // Verificar que la cuenta pertenezca al usuario actual
  if (item.accountId) {
    try {
      const { getAccountById } = await import("./accountService");
      const account = await getAccountById(item.accountId);
      
      if (!account) {
        console.warn(`La cuenta ${item.accountId} no existe, el gasto quedará sin cuenta asignada`);
        item.accountId = undefined;
      } else if (account.userId !== item.userId) {
        console.error(`La cuenta ${item.accountId} pertenece al usuario ${account.userId}, no al usuario ${item.userId}`);
        item.accountId = undefined;
        
        // Intentar asignar otra cuenta del usuario actual
        const { getUserAccounts } = await import("./accountService");
        const accounts = await getUserAccounts(item.userId);
        const defaultAccount = accounts.find((acc) => acc.isDefault) || accounts[0];
        
        if (defaultAccount) {
          console.log(`Reasignando a cuenta por defecto ${defaultAccount.id}`);
          item.accountId = defaultAccount.id;
        }
      }
    } catch (error) {
      console.error("Error al verificar propiedad de la cuenta:", error);
    }
  }

  // Guardar el gasto
  const savedItem = await baseAddItem(item);

  // Actualizar el saldo de la cuenta solo si hay una cuenta asignada
  if (savedItem.accountId) {
    try {
      await updateFinanceWithAccount(
        "expenses",
        {
          amount: savedItem.amount,
          id: savedItem.id,
          userId: savedItem.userId,
        },
        savedItem.accountId,
        "add"
      );
    } catch (error) {
      console.error("Error al actualizar saldo de cuenta:", error);
    }
  } else {
    console.warn("Gasto creado sin cuenta asignada, no se actualizó ningún saldo");
  }

  return savedItem;
};

// Update an existing expense
export const updateExpense = async (item: FinanceItem): Promise<void> => {
  try {
    console.log("Iniciando actualización de gasto con ID:", item.id, "y cuenta:", item.accountId);

    // SEGURIDAD: Verificar que haya un userId
    if (!item.userId) {
      throw new Error("No se puede actualizar un gasto sin un ID de usuario");
    }

    // Obtener el gasto actual desde Firebase para tener la versión más reciente
    const expenseSnapshot = await getDocs(query(collection(db, "expenses"), where("__name__", "==", item.id)));

    let previousAccountId: string | undefined;
    let previousItem: Record<string, any> = {};

    if (!expenseSnapshot.empty) {
      previousItem = expenseSnapshot.docs[0].data();
      previousAccountId = previousItem.accountId || undefined;
      
      // SEGURIDAD: Verificar que el gasto pertenece al usuario actual
      if (previousItem.userId !== item.userId) {
        throw new Error(`No autorizado: Este gasto pertenece a otro usuario (${previousItem.userId})`);
      }
      
      console.log("Gasto anterior:", { ...previousItem, date: previousItem.date?.toDate?.() || previousItem.date, accountId: previousAccountId });
    } else {
      // Si no existe el gasto, no podemos actualizarlo
      throw new Error(`No se encontró el gasto con ID ${item.id}`);
    }

    // Verificación: si no hay accountId en el item pero sí había uno antes, mantenerlo
    if (!item.accountId && previousAccountId) {
      console.log("Restaurando accountId previo:", previousAccountId);
      item.accountId = previousAccountId;
    }

    // Si sigue sin haber accountId, asignar la cuenta predeterminada DEL USUARIO ACTUAL
    if (!item.accountId) {
      try {
        console.log("Buscando cuenta predeterminada para asignar al usuario:", item.userId);
        // Buscar la cuenta predeterminada
        const { getUserAccounts } = await import("./accountService");
        const accounts = await getUserAccounts(item.userId);
        const defaultAccount = accounts.find((acc) => acc.isDefault) || accounts[0];

        if (defaultAccount) {
          console.log("Asignando cuenta predeterminada:", defaultAccount.id);
          item.accountId = defaultAccount.id;
        } else {
          console.warn("No se encontró ninguna cuenta para asignar al gasto");
        }
      } catch (error) {
        console.error("Error al buscar cuenta predeterminada:", error);
      }
    }

    // Si hay accountId, verificar que pertenezca al usuario actual
    if (item.accountId) {
      try {
        const { getAccountById } = await import("./accountService");
        const account = await getAccountById(item.accountId);
        
        if (!account) {
          console.warn(`La cuenta ${item.accountId} no existe, el gasto quedará sin cuenta asignada`);
          item.accountId = undefined;
        } else if (account.userId !== item.userId) {
          console.error(`La cuenta ${item.accountId} pertenece al usuario ${account.userId}, no al usuario ${item.userId}`);
          item.accountId = undefined;
          
          // Intentar asignar otra cuenta del usuario actual
          const { getUserAccounts } = await import("./accountService");
          const accounts = await getUserAccounts(item.userId);
          const defaultAccount = accounts.find((acc) => acc.isDefault) || accounts[0];
          
          if (defaultAccount) {
            console.log(`Reasignando a cuenta por defecto ${defaultAccount.id}`);
            item.accountId = defaultAccount.id;
          }
        }
      } catch (error) {
        console.error("Error al verificar propiedad de la cuenta:", error);
      }
    }

    console.log("Actualizando gasto con cuenta final:", item.accountId);

    // Actualizar el gasto
    await baseUpdateItem(item);

    // Si estamos cambiando la cuenta, realizar una operación especial
    if (previousAccountId && previousAccountId !== item.accountId) {
      console.log("Detectado cambio de cuenta:", previousAccountId, "->", item.accountId);
      // Actualizar el saldo de la cuenta
      await updateFinanceWithAccount(
        "expenses",
        {
          amount: item.amount,
          id: item.id,
          userId: item.userId,
        },
        item.accountId || "",
        "update",
        previousAccountId
      );
    } else {
      // Para evitar errores de cálculo, simplemente recalculamos el saldo completo
      console.log("Recalculando saldos de todas las cuentas");
      const { recalculateAllAccountBalances } = await import("./financeService");
      await recalculateAllAccountBalances(item.userId);
    }

    console.log("Actualización de gasto completada con éxito");
  } catch (error) {
    console.error("Error al actualizar gasto:", error);
    throw error;
  }
};

// Delete an expense
export const deleteExpense = async (id: string, userId?: string): Promise<void> => {
  try {
    // Obtener el gasto antes de eliminarlo
    const expenseSnapshot = await getDocs(query(collection(db, "expenses"), where("__name__", "==", id)));

    if (expenseSnapshot.empty) {
      throw new Error("No se pudo encontrar el gasto a eliminar");
    }

    const expenseData = expenseSnapshot.docs[0].data();
    
    // SEGURIDAD: Verificar que el gasto pertenece al usuario actual
    if (userId && expenseData.userId !== userId) {
      throw new Error(`No autorizado: Este gasto pertenece a otro usuario (${expenseData.userId})`);
    }
    
    const itemToDelete = {
      id,
      ...expenseData,
      date: expenseData.date?.toDate() || new Date(),
    } as FinanceItem;

    // Eliminar el gasto - Pasar userId para verificación de seguridad
    await baseDeleteItem(id, userId);

    // Actualizar el saldo de la cuenta
    if (itemToDelete.accountId) {
      try {
        await updateFinanceWithAccount(
          "expenses",
          {
            amount: itemToDelete.amount,
            id: itemToDelete.id,
            userId: itemToDelete.userId,
          },
          itemToDelete.accountId,
          "delete"
        );
      } catch (error) {
        console.error("Error al actualizar saldo de cuenta al eliminar gasto:", error);
      }
    } else {
      console.warn("Gasto eliminado no tenía cuenta asignada, no se actualizó ningún saldo");
    }
    
    console.log(`Gasto ${id} eliminado con éxito${userId ? ` para usuario ${userId}` : ''}`);
  } catch (error) {
    console.error("Error al eliminar gasto:", error);
    throw error;
  }
};
