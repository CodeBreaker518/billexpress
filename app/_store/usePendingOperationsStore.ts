import { create } from "zustand";
import { persist } from "zustand/middleware";

// Tipo para operaciones pendientes
export type PendingOperation = {
  id: string;
  operationType: "add" | "update" | "delete";
  collection: "incomes" | "expenses";
  data?: any;
  createdAt: number;
};

interface PendingOperationsState {
  operations: PendingOperation[];
  addOperation: (operation: Omit<PendingOperation, "id" | "createdAt">) => void;
  removeOperation: (id: string) => void;
  clearOperations: () => void;
  isPending: (collection: "incomes" | "expenses", itemId?: string) => boolean;
}

export const usePendingOperationsStore = create<PendingOperationsState>()(
  persist(
    (set, get) => ({
      operations: [],

      // Añadir una operación pendiente
      addOperation: (operation) =>
        set((state) => ({
          operations: [
            ...state.operations,
            {
              ...operation,
              id: `${operation.collection}_${operation.operationType}_${Date.now()}`,
              createdAt: Date.now(),
            },
          ],
        })),

      // Eliminar una operación pendiente
      removeOperation: (id) =>
        set((state) => ({
          operations: state.operations.filter((op) => op.id !== id),
        })),

      // Limpiar todas las operaciones pendientes
      clearOperations: () => set({ operations: [] }),

      // Verificar si hay operaciones pendientes para una colección o elemento específico
      isPending: (collection, itemId) => {
        const { operations } = get();
        if (itemId) {
          return operations.some((op) => op.collection === collection && (op.data?.id === itemId || (op.operationType === "delete" && op.data === itemId)));
        }
        return operations.some((op) => op.collection === collection);
      },
    }),
    {
      name: "pending-operations-storage",
      // Solo almacenar en localStorage en el cliente
      storage:
        typeof window !== "undefined"
          ? {
              getItem: (name) => {
                const str = localStorage.getItem(name);
                if (!str) return null;
                return JSON.parse(str);
              },
              setItem: (name, value) => {
                localStorage.setItem(name, JSON.stringify(value));
              },
              removeItem: (name) => {
                localStorage.removeItem(name);
              },
            }
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            },
    }
  )
);
