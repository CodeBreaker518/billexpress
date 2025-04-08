import { create } from "zustand";
import { persist } from "zustand/middleware";

// Tipo para operaciones pendientes
export type PendingOperation = {
  id: string;
  operationType: "add" | "update" | "delete";
  collection: "incomes" | "expenses";
  data?: any;
  timestamp: number;
};

interface PendingOperationsState {
  operations: PendingOperation[];
  addOperation: (operation: Omit<PendingOperation, "id" | "timestamp">) => void;
  removeOperation: (id: string) => void;
  clearOperations: () => void;
  isPending: (collection: "incomes" | "expenses", itemId?: string) => boolean;
  loadFromStorage: () => void;
  clearAll: () => void;
  cleanupInvalidOperations: () => void;
}

export const usePendingOperationsStore = create<PendingOperationsState>()(
  persist(
    (set, get) => ({
      operations: [],

      // Añadir una operación pendiente
      addOperation: (operation) => {
        const newOperation = {
          ...operation,
          id: `${operation.operationType}_${operation.collection}_${Date.now()}`,
          timestamp: Date.now(),
        };
        
        set((state) => ({
          operations: [...state.operations, newOperation]
        }));
      },

      // Eliminar una operación pendiente
      removeOperation: (id) => {
        set((state) => ({
          operations: state.operations.filter((op) => op.id !== id),
        }));
      },

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
      
      // Cargar operaciones pendientes desde localStorage
      loadFromStorage: () => {
        try {
          const storedOps = localStorage.getItem('pending-operations');
          if (storedOps) {
            const parsedOps = JSON.parse(storedOps);
            set({ operations: parsedOps });
          }
        } catch (e) {
          console.error('Error loading pending operations:', e);
          // Si hay error, reiniciar el almacenamiento
          localStorage.setItem('pending-operations', '[]');
        }
      },

      // Limpiar todas las operaciones pendientes
      clearAll: () => {
        set({ operations: [] });
        localStorage.setItem('pending-operations', '[]');
        console.log('Todas las operaciones pendientes han sido eliminadas');
      },
      
      // Limpiar operaciones problemáticas (por ejemplo, actualización de documentos que ya no existen)
      cleanupInvalidOperations: () => {
        const operations = get().operations;
        
        // Filtrar operaciones de tipo update que podrían ser problemáticas
        const validOperations = operations.filter(op => {
          // Si es una operación de actualización, verificar si el documento existe
          if (op.operationType === 'update') {
            try {
              // Si es muy antiguo (más de 7 días), eliminar
              const isOld = Date.now() - op.timestamp > 7 * 24 * 60 * 60 * 1000;
              if (isOld) {
                console.log(`Eliminando operación antigua: ${op.id}`);
                return false;
              }
            } catch (error) {
              console.error('Error verificando operación:', error);
              return false; // Si hay error, eliminar
            }
          }
          return true;
        });
        
        // Actualizar el store
        set({ operations: validOperations });
        
        // Actualizar localStorage
        try {
          localStorage.setItem('pending-operations', JSON.stringify(validOperations));
          console.log(`Se eliminaron ${operations.length - validOperations.length} operaciones problemáticas`);
        } catch (e) {
          console.error('Error actualizando operaciones pendientes:', e);
        }
      }
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
