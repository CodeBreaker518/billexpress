"use client";

import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./config";
import { createFinanceService, FinanceItem, updateFinanceWithAccount } from "./financeService";

const { getUserItems, addItem: baseAddItem, updateItem: baseUpdateItem, deleteItem: baseDeleteItem } = createFinanceService("incomes");

// Get incomes for a user
export const getUserIncomes = getUserItems;

// Add a new income
export const addIncome = async (item: Omit<FinanceItem, "id">): Promise<FinanceItem> => {
  // Si no tiene cuenta asignada, buscar y usar la cuenta por defecto
  if (!item.accountId) {
    try {
      // Buscar la cuenta predeterminada
      const { getUserAccounts } = await import("./accountService");
      const accounts = await getUserAccounts(item.userId);
      const defaultAccount = accounts.find((acc) => acc.isDefault) || accounts[0];

      if (defaultAccount) {
        item.accountId = defaultAccount.id;
      }
    } catch (error) {
      console.error("Error al buscar cuenta predeterminada:", error);
    }
  }

  // Guardar el ingreso
  const savedItem = await baseAddItem(item);

  // Actualizar el saldo de la cuenta
  try {
    await updateFinanceWithAccount(
      "incomes",
      {
        amount: savedItem.amount,
        id: savedItem.id,
        userId: savedItem.userId,
      },
      savedItem.accountId || "",
      "add"
    );
  } catch (error) {
    console.error("Error al actualizar saldo de cuenta:", error);
  }

  return savedItem;
};

// Update an existing income
export const updateIncome = async (item: FinanceItem): Promise<void> => {
  try {
    console.log("Iniciando actualización de ingreso con ID:", item.id, "y cuenta:", item.accountId);

    // Obtener el ingreso actual desde Firebase para tener la versión más reciente
    const incomeSnapshot = await getDocs(query(collection(db, "incomes"), where("__name__", "==", item.id)));

    let previousAccountId: string | undefined;
    let previousItem: any = null;

    if (!incomeSnapshot.empty) {
      previousItem = incomeSnapshot.docs[0].data();
      previousAccountId = previousItem.accountId || undefined;
      console.log("Ingreso anterior:", { ...previousItem, date: previousItem.date?.toDate?.() || previousItem.date, accountId: previousAccountId });
    }

    // Verificación: si no hay accountId en el item pero sí había uno antes, mantenerlo
    if (!item.accountId && previousAccountId) {
      console.log("Restaurando accountId previo:", previousAccountId);
      item.accountId = previousAccountId;
    }

    // Si sigue sin haber accountId, asignar la cuenta predeterminada
    if (!item.accountId) {
      try {
        console.log("Buscando cuenta predeterminada para asignar");
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
export const deleteIncome = async (id: string): Promise<void> => {
  try {
    // Obtener el ingreso antes de eliminarlo
    const incomeSnapshot = await getDocs(query(collection(db, "incomes"), where("__name__", "==", id)));

    if (incomeSnapshot.empty) {
      throw new Error("No se pudo encontrar el ingreso a eliminar");
    }

    const incomeData = incomeSnapshot.docs[0].data();
    const itemToDelete = {
      id,
      ...incomeData,
      date: incomeData.date?.toDate() || new Date(),
    } as FinanceItem;

    // Eliminar el ingreso
    await baseDeleteItem(id);

    // Actualizar el saldo de la cuenta
    await updateFinanceWithAccount(
      "incomes",
      {
        amount: itemToDelete.amount,
        id: itemToDelete.id,
        userId: itemToDelete.userId,
      },
      itemToDelete.accountId || "",
      "delete"
    );
  } catch (error) {
    console.error("Error al eliminar ingreso:", error);
    throw error;
  }
};
