"use client";

import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./config";
import { createFinanceService, FinanceItem, updateFinanceWithAccount } from "./financeService";

const { getUserItems, addItem: baseAddItem, updateItem: baseUpdateItem, deleteItem: baseDeleteItem } = createFinanceService("expenses");

// Get expenses for a user
export const getUserExpenses = getUserItems;

// Add a new expense
export const addExpense = async (item: Omit<FinanceItem, "id">): Promise<FinanceItem> => {
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

  // Guardar el gasto
  const savedItem = await baseAddItem(item);

  // Actualizar el saldo de la cuenta
  try {
    await updateFinanceWithAccount(
      "expenses",
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

// Update an existing expense
export const updateExpense = async (item: FinanceItem): Promise<void> => {
  try {
    // Obtener el gasto actual desde Firebase para tener la versión más reciente
    const expenseSnapshot = await getDocs(query(collection(db, "expenses"), where("__name__", "==", item.id)));

    let previousAccountId: string | undefined;

    if (!expenseSnapshot.empty) {
      const previousExpense = expenseSnapshot.docs[0].data();
      previousAccountId = previousExpense.accountId || undefined;
    }

    // Actualizar el gasto
    await baseUpdateItem(item);

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
  } catch (error) {
    console.error("Error al actualizar gasto:", error);
    throw error;
  }
};

// Delete an expense
export const deleteExpense = async (id: string): Promise<void> => {
  try {
    // Obtener el gasto antes de eliminarlo
    const expenseSnapshot = await getDocs(query(collection(db, "expenses"), where("__name__", "==", id)));

    if (expenseSnapshot.empty) {
      throw new Error("No se pudo encontrar el gasto a eliminar");
    }

    const expenseData = expenseSnapshot.docs[0].data();
    const itemToDelete = {
      id,
      ...expenseData,
      date: expenseData.date?.toDate() || new Date(),
    } as FinanceItem;

    // Eliminar el gasto
    await baseDeleteItem(id);

    // Actualizar el saldo de la cuenta
    await updateFinanceWithAccount(
      "expenses",
      {
        amount: itemToDelete.amount,
        id: itemToDelete.id,
        userId: itemToDelete.userId,
      },
      itemToDelete.accountId || "",
      "delete"
    );
  } catch (error) {
    console.error("Error al eliminar gasto:", error);
    throw error;
  }
};
