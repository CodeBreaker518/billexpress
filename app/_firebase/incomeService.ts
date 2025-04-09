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
    // Obtener el ingreso actual desde Firebase para tener la versión más reciente
    const incomeSnapshot = await getDocs(query(collection(db, "incomes"), where("__name__", "==", item.id)));

    let previousAccountId: string | undefined;

    if (!incomeSnapshot.empty) {
      const previousIncome = incomeSnapshot.docs[0].data();
      previousAccountId = previousIncome.accountId || undefined;
    }

    // Actualizar el ingreso
    await baseUpdateItem(item);

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
