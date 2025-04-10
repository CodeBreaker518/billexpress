"use client";

import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./config";
import { createFinanceService, FinanceItem, updateFinanceWithAccount } from "./financeService";

const { getUserItems, addItem: baseAddItem, updateItem: baseUpdateItem, deleteItem: baseDeleteItem } = createFinanceService("incomes");

// Get incomes for a user
export const getUserIncomes = getUserItems;

// Add a new income
export const addIncome = async (item: Omit<FinanceItem, "id">): Promise<FinanceItem> => {
  // SEGURIDAD: Verificar que haya un userId
  if (!item.userId) {
    throw new Error("No se puede crear un ingreso sin un ID de usuario");
  }

  // Si no tiene cuenta asignada, buscar y crear una cuenta por defecto para este usuario
  if (!item.accountId) {
    try {
      // Buscar la cuenta predeterminada SOLO de este usuario
      const { getUserAccounts } = await import("./accountService");
      const accounts = await getUserAccounts(item.userId);
      const defaultAccount = accounts.find((acc) => acc.isDefault) || accounts[0];

      if (defaultAccount) {
        console.log(`Asignando cuenta por defecto ${defaultAccount.id} al ingreso para usuario ${item.userId}`);
        item.accountId = defaultAccount.id;
      } else {
        console.warn(`No se encontró ninguna cuenta para el usuario ${item.userId}, el ingreso quedará sin cuenta asignada`);
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
        console.warn(`La cuenta ${item.accountId} no existe, el ingreso quedará sin cuenta asignada`);
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

  // Guardar el ingreso
  const savedItem = await baseAddItem(item);

  // Actualizar el saldo de la cuenta solo si hay una cuenta asignada
  if (savedItem.accountId) {
    try {
      await updateFinanceWithAccount(
        "incomes",
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
    console.warn("Ingreso creado sin cuenta asignada, no se actualizó ningún saldo");
  }

  return savedItem;
};

// Update an existing income
export const updateIncome = async (item: FinanceItem): Promise<void> => {
  try {
    console.log("Iniciando actualización de ingreso con ID:", item.id, "y cuenta:", item.accountId);

    // SEGURIDAD: Verificar que haya un userId
    if (!item.userId) {
      throw new Error("No se puede actualizar un ingreso sin un ID de usuario");
    }

    // Obtener el ingreso actual desde Firebase para tener la versión más reciente
    const incomeSnapshot = await getDocs(query(collection(db, "incomes"), where("__name__", "==", item.id)));

    let previousAccountId: string | undefined;
    let previousItem: any = null;

    if (!incomeSnapshot.empty) {
      previousItem = incomeSnapshot.docs[0].data();
      previousAccountId = previousItem.accountId || undefined;
      
      // SEGURIDAD: Verificar que el ingreso pertenece al usuario actual
      if (previousItem.userId !== item.userId) {
        throw new Error(`No autorizado: Este ingreso pertenece a otro usuario (${previousItem.userId})`);
      }
      
      console.log("Ingreso anterior:", { ...previousItem, date: previousItem.date?.toDate?.() || previousItem.date, accountId: previousAccountId });
    } else {
      // Si no existe el ingreso, no podemos actualizarlo
      throw new Error(`No se encontró el ingreso con ID ${item.id}`);
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
          console.warn("No se encontró ninguna cuenta para asignar al ingreso");
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
          console.warn(`La cuenta ${item.accountId} no existe, el ingreso quedará sin cuenta asignada`);
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

    console.log("Actualizando ingreso con cuenta final:", item.accountId);

    // Actualizar el ingreso
    await baseUpdateItem(item);

    // Si estamos cambiando la cuenta, realizar una operación especial
    if (previousAccountId && previousAccountId !== item.accountId) {
      console.log("Detectado cambio de cuenta:", previousAccountId, "->", item.accountId);
      // Actualizar el saldo de la cuenta
      await updateFinanceWithAccount(
        "incomes",
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

    console.log("Actualización de ingreso completada con éxito");
  } catch (error) {
    console.error("Error al actualizar ingreso:", error);
    throw error;
  }
};

// Delete an income
export const deleteIncome = async (id: string, userId?: string): Promise<void> => {
  try {
    // Obtener el ingreso antes de eliminarlo
    const incomeSnapshot = await getDocs(query(collection(db, "incomes"), where("__name__", "==", id)));

    if (incomeSnapshot.empty) {
      throw new Error("No se pudo encontrar el ingreso a eliminar");
    }

    const incomeData = incomeSnapshot.docs[0].data();
    
    // SEGURIDAD: Verificar que el ingreso pertenece al usuario actual
    if (userId && incomeData.userId !== userId) {
      throw new Error(`No autorizado: Este ingreso pertenece a otro usuario (${incomeData.userId})`);
    }
    
    const itemToDelete = {
      id,
      ...incomeData,
      date: incomeData.date?.toDate() || new Date(),
    } as FinanceItem;

    // Eliminar el ingreso - Pasar userId para verificación de seguridad
    await baseDeleteItem(id, userId);

    // Actualizar el saldo de la cuenta
    if (itemToDelete.accountId) {
      try {
        await updateFinanceWithAccount(
          "incomes",
          {
            amount: itemToDelete.amount,
            id: itemToDelete.id,
            userId: itemToDelete.userId,
          },
          itemToDelete.accountId,
          "delete"
        );
      } catch (error) {
        console.error("Error al actualizar saldo de cuenta al eliminar ingreso:", error);
      }
    } else {
      console.warn("Ingreso eliminado no tenía cuenta asignada, no se actualizó ningún saldo");
    }
    
    console.log(`Ingreso ${id} eliminado con éxito${userId ? ` para usuario ${userId}` : ''}`);
  } catch (error) {
    console.error("Error al eliminar ingreso:", error);
    throw error;
  }
};
