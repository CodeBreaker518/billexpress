'use client';

import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';
import { usePendingOperationsStore } from '@bill/_store/usePendingOperationsStore';

// Tipo base para entidades financieras
export interface FinanceItem {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  userId: string;
}

// Verificar si hay conexión a internet
export const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' && navigator.onLine;
};

// Factory para crear servicios financieros (ingresos o gastos)
export const createFinanceService = (entityType: 'incomes' | 'expenses') => {
  // Colección de Firebase
  const collection_ref = collection(db, entityType);
  // Clave para localStorage
  const localStorageKey = `${entityType}-data`;
  
  // Obtener elementos para un usuario
  const getUserItems = async (userId: string): Promise<FinanceItem[]> => {
    try {
      const q = query(collection_ref, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      
      const items = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          amount: data.amount,
          category: data.category,
          description: data.description,
          date: data.date.toDate(),
          userId: data.userId
        } as FinanceItem;
      });
      
      // Guardar en localStorage para acceso offline
      if (items.length > 0) {
        localStorage.setItem(localStorageKey, JSON.stringify(items));
      }
      
      return items;
    } catch (error) {
      console.error(`Error fetching ${entityType}:`, error);
      // Si hay error, intentar recuperar del almacenamiento local
      const localData = localStorage.getItem(localStorageKey);
      if (localData) {
        try {
          const parsedData = JSON.parse(localData);
          return parsedData.filter((item: FinanceItem) => item.userId === userId);
        } catch (e) {
          console.error(`Error parsing local ${entityType}:`, e);
        }
      }
      
      return [];
    }
  };
  
  // Añadir un nuevo elemento
  const addItem = async (item: Omit<FinanceItem, 'id'>): Promise<FinanceItem> => {
    // Crear un ID temporal para operaciones offline
    const tempId = `temp_${Date.now()}`;
    
    try {
      // Guardar en localStorage para recuperación offline
      const localData = localStorage.getItem(localStorageKey) || '[]';
      const parsedData = JSON.parse(localData);
      
      // Crear nuevo elemento con ID temporal si estamos offline
      const newItem = {
        ...item,
        id: tempId,
        date: new Date(item.date) // Asegurar que sea objeto Date
      };
      
      // Actualizar datos locales
      localStorage.setItem(localStorageKey, JSON.stringify([...parsedData, newItem]));
      
      // Si estamos online, intentar guardar en Firebase
      if (isOnline()) {
        try {
          const docRef = await addDoc(collection_ref, {
            ...item,
            date: Timestamp.fromDate(item.date),
            createdAt: serverTimestamp()
          });
          
          // Actualizar datos locales con el ID correcto
          const updatedData = parsedData.map((localItem: any) => 
            localItem.id === tempId ? { ...item, id: docRef.id } : localItem
          );
          localStorage.setItem(localStorageKey, JSON.stringify(updatedData));
          
          return {
            ...item,
            id: docRef.id
          };
        } catch (error) {
          console.error(`Error adding ${entityType.slice(0, -1)} to Firebase:`, error);
          
          // Registrar operación pendiente para sincronizar después
          usePendingOperationsStore.getState().addOperation({
            operationType: 'add',
            collection: entityType,
            data: newItem
          });
          
          return newItem;
        }
      } else {
        // Si estamos offline, registrar para sincronización futura
        usePendingOperationsStore.getState().addOperation({
          operationType: 'add',
          collection: entityType,
          data: newItem
        });
        
        return newItem;
      }
    } catch (error) {
      console.error(`Error in add${entityType.slice(0, -1)}:`, error);
      // Devolver algo para que la UI no se rompa
      return {
        ...item,
        id: tempId
      };
    }
  };
  
  // Actualizar un elemento existente
  const updateItem = async (item: FinanceItem): Promise<void> => {
    try {
      // Actualizar datos locales primero
      const localData = localStorage.getItem(localStorageKey) || '[]';
      const parsedData = JSON.parse(localData);
      const updatedData = parsedData.map((localItem: any) => 
        localItem.id === item.id ? item : localItem
      );
      localStorage.setItem(localStorageKey, JSON.stringify(updatedData));
      
      // Si estamos online, actualizar en Firebase
      if (isOnline()) {
        try {
          const itemRef = doc(db, entityType, item.id);
          await updateDoc(itemRef, {
            amount: item.amount,
            category: item.category,
            description: item.description,
            date: Timestamp.fromDate(item.date),
            updatedAt: serverTimestamp()
          });
        } catch (error) {
          console.error(`Error updating ${entityType.slice(0, -1)} in Firebase:`, error);
          // Registrar operación pendiente
          usePendingOperationsStore.getState().addOperation({
            operationType: 'update',
            collection: entityType,
            data: item
          });
        }
      } else {
        // Si estamos offline, registrar operación pendiente
        usePendingOperationsStore.getState().addOperation({
          operationType: 'update',
          collection: entityType,
          data: item
        });
      }
    } catch (error) {
      console.error(`Error in update${entityType.slice(0, -1)}:`, error);
      throw error;
    }
  };
  
  // Eliminar un elemento
  const deleteItem = async (id: string): Promise<void> => {
    try {
      // Eliminar de datos locales primero
      const localData = localStorage.getItem(localStorageKey) || '[]';
      const parsedData = JSON.parse(localData);
      const filteredData = parsedData.filter((item: any) => item.id !== id);
      localStorage.setItem(localStorageKey, JSON.stringify(filteredData));
      
      // Si estamos online, eliminar de Firebase
      if (isOnline()) {
        try {
          const itemRef = doc(db, entityType, id);
          await deleteDoc(itemRef);
        } catch (error) {
          console.error(`Error deleting ${entityType.slice(0, -1)} from Firebase:`, error);
          // Registrar operación pendiente
          usePendingOperationsStore.getState().addOperation({
            operationType: 'delete',
            collection: entityType,
            data: id
          });
        }
      } else {
        // Si estamos offline, registrar operación pendiente
        usePendingOperationsStore.getState().addOperation({
          operationType: 'delete',
          collection: entityType,
          data: id
        });
      }
    } catch (error) {
      console.error(`Error in delete${entityType.slice(0, -1)}:`, error);
      throw error;
    }
  };
  
  // Sincronizar operaciones pendientes
  const syncPendingItems = async (): Promise<void> => {
    if (!isOnline()) return; // Solo intentar sincronizar si estamos online
    
    const pendingOps = usePendingOperationsStore.getState().operations
      .filter(op => op.collection === entityType);
    
    if (pendingOps.length === 0) return;
    
    // Procesar cada operación pendiente
    for (const op of pendingOps) {
      try {
        if (op.operationType === 'add') {
          const { id, ...rest } = op.data;
          await addDoc(collection_ref, {
            ...rest,
            date: Timestamp.fromDate(new Date(rest.date)),
            createdAt: serverTimestamp(),
            syncedAt: serverTimestamp()
          });
        } else if (op.operationType === 'update') {
          const { id, ...rest } = op.data;
          const itemRef = doc(db, entityType, id);
          await updateDoc(itemRef, {
            ...rest,
            date: Timestamp.fromDate(new Date(rest.date)),
            updatedAt: serverTimestamp(),
            syncedAt: serverTimestamp()
          });
        } else if (op.operationType === 'delete') {
          const itemRef = doc(db, entityType, op.data);
          await deleteDoc(itemRef);
        }
        
        // Eliminar la operación de la cola después de completarla
        usePendingOperationsStore.getState().removeOperation(op.id);
      } catch (error) {
        console.error(`Error syncing operation ${op.id}:`, error);
        // Continuamos con la siguiente operación incluso si esta falla
      }
    }
    
    // Recargar datos después de sincronizar
    const localData = localStorage.getItem('current-user-id');
    if (localData) {
      try {
        await getUserItems(localData);
      } catch (e) {
        console.error(`Error refreshing ${entityType} after sync:`, e);
      }
    }
  };
  
  // Retornar el objeto de servicio
  return {
    getUserItems,
    addItem,
    updateItem,
    deleteItem,
    syncPendingItems
  };
};

// Crear instancias de los servicios
export const expenseService = createFinanceService('expenses');
export const incomeService = createFinanceService('incomes');
