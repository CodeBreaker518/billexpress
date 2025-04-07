"use client";

import { useCallback, useEffect, useState } from "react";
import { useNetworkStatus } from "./useNetworkStatus";
import { usePendingOperationsStore } from "@bill/_store/usePendingOperationsStore";

interface SyncStatusResult {
  isOnline: boolean;
  hasPendingOperations: boolean;
  pendingOperationsCount: number;
  pendingIncomes: number;
  pendingExpenses: number;
  isPendingItem: (collection: "incomes" | "expenses", itemId?: string) => boolean;
  syncStatus: "synced" | "pending" | "offline";
}

/**
 * Hook personalizado para gestionar el estado de sincronización y conexión
 * @returns {SyncStatusResult} Estado de sincronización y funciones relacionadas
 */
export function useSyncStatus(): SyncStatusResult {
  const isOnline = useNetworkStatus();
  const { operations, isPending } = usePendingOperationsStore();
  const [pendingCounts, setPendingCounts] = useState({
    total: 0,
    incomes: 0,
    expenses: 0,
  });

  // Calcular las operaciones pendientes por tipo
  useEffect(() => {
    const incomeOps = operations.filter((op) => op.collection === "incomes").length;
    const expenseOps = operations.filter((op) => op.collection === "expenses").length;

    setPendingCounts({
      total: operations.length,
      incomes: incomeOps,
      expenses: expenseOps,
    });
  }, [operations]);

  // Determinar el estado de sincronización
  const syncStatus = useCallback((): "synced" | "pending" | "offline" => {
    if (!isOnline) return "offline";
    if (operations.length > 0) return "pending";
    return "synced";
  }, [isOnline, operations.length]);

  return {
    isOnline,
    hasPendingOperations: operations.length > 0,
    pendingOperationsCount: pendingCounts.total,
    pendingIncomes: pendingCounts.incomes,
    pendingExpenses: pendingCounts.expenses,
    isPendingItem: isPending,
    syncStatus: syncStatus(),
  };
}
