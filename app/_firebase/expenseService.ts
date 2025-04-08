"use client";

import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, Timestamp, serverTimestamp } from "firebase/firestore";
import { db } from "./config";
import { Expense } from "@bill/_store/useExpenseStore";
import { usePendingOperationsStore } from "@bill/_store/usePendingOperationsStore";
import { createFinanceService, FinanceItem } from "./financeService";
import { updateFinanceWithAccount } from "./accountService";

const { getUserItems, addItem: baseAddItem, updateItem: baseUpdateItem, deleteItem: baseDeleteItem } = createFinanceService("expenses");

// Reference collection
const expensesCollection = collection(db, "expenses");

// Verificar si hay conexión a internet
const isOnline = (): boolean => {
  return typeof navigator !== "undefined" && navigator.onLine;
};

// Get expenses for a user
export const getUserExpenses = getUserItems;

// Add a new expense
export const addExpense = async (item: Omit<FinanceItem, "id">): Promise<FinanceItem> => {
  console.log("⚠️ addExpense: Agregando nuevo gasto con cuenta:", item.accountId || "sin cuenta");

  // Si no tiene cuenta asignada, buscar y usar la cuenta por defecto
  if (!item.accountId) {
    console.warn("No se proporcionó cuenta para el gasto, se buscará la cuenta por defecto");

    try {
      // Buscar la cuenta predeterminada
      const { getUserAccounts } = await import("./accountService");
      const accounts = await getUserAccounts(item.userId);
      console.log(
        "📊 Cuentas disponibles:",
        accounts.map((acc) => `${acc.name} (${acc.id})`)
      );

      const defaultAccount = accounts.find((acc) => acc.isDefault) || accounts[0];

      if (defaultAccount) {
        console.log(`✅ Asignando gasto a cuenta predeterminada: ${defaultAccount.name} (${defaultAccount.id})`);
        item.accountId = defaultAccount.id;
      } else {
        console.error("❌ No se encontró ninguna cuenta para asignar el gasto");
      }
    } catch (error) {
      console.error("❌ Error al buscar cuenta predeterminada:", error);
    }
  }

  // Guardar el gasto
  const savedItem = await baseAddItem(item);
  console.log("✅ Gasto guardado:", savedItem);

  // Actualizar el saldo de la cuenta
  try {
    await updateFinanceWithAccount("expenses", savedItem, savedItem.accountId || "", "add");
    console.log("✅ Saldo de cuenta actualizado para:", savedItem.accountId || "sin cuenta");
  } catch (error) {
    console.error("❌ Error al actualizar saldo de cuenta:", error);
  }

  return savedItem;
};

// Update an existing expense
export const updateExpense = async (item: FinanceItem): Promise<void> => {
  // Obtener la versión anterior para detectar cambios en la cuenta o monto
  const localData = localStorage.getItem("expenses-data") || "[]";
  const parsedData = JSON.parse(localData);
  const previousItem = parsedData.find((localItem: FinanceItem) => localItem.id === item.id);

  // Actualizar el gasto
  await baseUpdateItem(item);

  // Actualizar el saldo de la cuenta
  try {
    await updateFinanceWithAccount("expenses", item, item.accountId || "", "update", previousItem?.accountId);
  } catch (error) {
    console.error("Error al actualizar saldo de cuenta:", error);
  }
};

// Delete an expense
export const deleteExpense = async (id: string): Promise<void> => {
  // Obtener el ítem antes de eliminarlo
  const localData = localStorage.getItem("expenses-data") || "[]";
  const parsedData = JSON.parse(localData);
  const itemToDelete = parsedData.find((item: FinanceItem) => item.id === id);

  if (!itemToDelete) {
    throw new Error("No se pudo encontrar el gasto a eliminar");
  }

  // Eliminar el gasto
  await baseDeleteItem(id);

  // Actualizar el saldo de la cuenta
  try {
    await updateFinanceWithAccount("expenses", itemToDelete, itemToDelete.accountId || "", "delete");
  } catch (error) {
    console.error("Error al actualizar saldo de cuenta:", error);
  }
};

// Sincronizar operaciones pendientes
export const syncPendingExpenses = async (): Promise<void> => {
  if (!isOnline()) return; // Solo intentamos sincronizar si estamos online

  const pendingOps = usePendingOperationsStore.getState().operations.filter((op) => op.collection === "expenses");

  if (pendingOps.length === 0) return;

  // Procesar cada operación pendiente
  for (const op of pendingOps) {
    try {
      if (op.operationType === "add") {
        const { id, ...rest } = op.data;
        await addDoc(expensesCollection, {
          ...rest,
          date: Timestamp.fromDate(new Date(rest.date)),
          createdAt: serverTimestamp(),
          syncedAt: serverTimestamp(),
        });
      } else if (op.operationType === "update") {
        const { id, ...rest } = op.data;
        const expenseRef = doc(db, "expenses", id);
        await updateDoc(expenseRef, {
          ...rest,
          date: Timestamp.fromDate(new Date(rest.date)),
          updatedAt: serverTimestamp(),
          syncedAt: serverTimestamp(),
        });
      } else if (op.operationType === "delete") {
        const expenseRef = doc(db, "expenses", op.data);
        await deleteDoc(expenseRef);
      }

      // Eliminar la operación de la cola después de completarla
      usePendingOperationsStore.getState().removeOperation(op.id);
    } catch (error) {
      console.error(`Error syncing operation ${op.id}:`, error);
      // Continuamos con la siguiente operación incluso si esta falla
    }
  }

  // Recargar datos después de sincronizar
  const localData = localStorage.getItem("current-user-id");
  if (localData) {
    try {
      await getUserExpenses(localData);
    } catch (e) {
      console.error("Error refreshing expenses after sync:", e);
    }
  }
};
