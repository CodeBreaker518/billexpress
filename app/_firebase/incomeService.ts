"use client";

import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "./config";
import { Income } from "@bill/_store/useIncomeStore";
import { usePendingOperationsStore } from "@bill/_store/usePendingOperationsStore";
import { createFinanceService, FinanceItem } from "./financeService";
import { updateFinanceWithAccount } from "./accountService";

// Reference collection
const incomesCollection = collection(db, "incomes");

const { getUserItems, addItem: baseAddItem, updateItem: baseUpdateItem, deleteItem: baseDeleteItem } = createFinanceService("incomes");

// Verificar si hay conexión a internet
const isOnline = (): boolean => {
  return typeof navigator !== "undefined" && navigator.onLine;
};

// Get incomes for a user
export const getUserIncomes = getUserItems;

// Add a new income
export const addIncome = async (item: Omit<FinanceItem, "id">): Promise<FinanceItem> => {
  // Si no tiene cuenta asignada, buscar y usar la cuenta por defecto
  if (!item.accountId) {
    console.warn("No se proporcionó cuenta para el ingreso, se buscará la cuenta por defecto");

    try {
      // Buscar la cuenta predeterminada
      const { getUserAccounts } = await import("./accountService");
      const accounts = await getUserAccounts(item.userId);
      const defaultAccount = accounts.find((acc) => acc.isDefault) || accounts[0];

      if (defaultAccount) {
        console.log(`Asignando ingreso a cuenta predeterminada: ${defaultAccount.name} (${defaultAccount.id})`);
        item.accountId = defaultAccount.id;
      } else {
        console.error("No se encontró ninguna cuenta para asignar el ingreso");
      }
    } catch (error) {
      console.error("Error al buscar cuenta predeterminada:", error);
    }
  }

  // Guardar el ingreso
  const savedItem = await baseAddItem(item);

  // Actualizar el saldo de la cuenta
  try {
    await updateFinanceWithAccount("incomes", savedItem, savedItem.accountId || "", "add");
  } catch (error) {
    console.error("Error al actualizar saldo de cuenta:", error);
  }

  return savedItem;
};

// Update an existing income
export const updateIncome = async (item: FinanceItem): Promise<void> => {
  // Obtener la versión anterior para detectar cambios en la cuenta o monto
  const localData = localStorage.getItem("incomes-data") || "[]";
  const parsedData = JSON.parse(localData);
  const previousItem = parsedData.find((localItem: FinanceItem) => localItem.id === item.id);

  // Actualizar el ingreso
  await baseUpdateItem(item);

  // Actualizar el saldo de la cuenta
  try {
    await updateFinanceWithAccount("incomes", item, item.accountId || "", "update", previousItem?.accountId);
  } catch (error) {
    console.error("Error al actualizar saldo de cuenta:", error);
  }
};

// Delete an income
export const deleteIncome = async (id: string): Promise<void> => {
  // Obtener el ítem antes de eliminarlo
  const localData = localStorage.getItem("incomes-data") || "[]";
  const parsedData = JSON.parse(localData);
  const itemToDelete = parsedData.find((item: FinanceItem) => item.id === id);

  if (!itemToDelete) {
    throw new Error("No se pudo encontrar el ingreso a eliminar");
  }

  // Eliminar el ingreso
  await baseDeleteItem(id);

  // Actualizar el saldo de la cuenta
  try {
    await updateFinanceWithAccount("incomes", itemToDelete, itemToDelete.accountId || "", "delete");
  } catch (error) {
    console.error("Error al actualizar saldo de cuenta:", error);
  }
};

// Sincronizar operaciones pendientes
export const syncPendingIncomes = async (): Promise<void> => {
  if (!isOnline()) return; // Solo intentamos sincronizar si estamos online

  const pendingOps = usePendingOperationsStore.getState().operations.filter((op) => op.collection === "incomes");

  if (pendingOps.length === 0) return;

  // Procesar cada operación pendiente
  for (const op of pendingOps) {
    try {
      if (op.operationType === "add") {
        const { id, ...rest } = op.data;
        await addDoc(incomesCollection, {
          ...rest,
          createdAt: serverTimestamp(),
          syncedAt: serverTimestamp(),
        });
      } else if (op.operationType === "update") {
        const { id, ...rest } = op.data;
        const incomeRef = doc(db, "incomes", id);
        await updateDoc(incomeRef, {
          ...rest,
          updatedAt: serverTimestamp(),
          syncedAt: serverTimestamp(),
        });
      } else if (op.operationType === "delete") {
        const incomeRef = doc(db, "incomes", op.data);
        await deleteDoc(incomeRef);
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
      await getUserIncomes(localData);
    } catch (e) {
      console.error("Error refreshing incomes after sync:", e);
    }
  }
};
