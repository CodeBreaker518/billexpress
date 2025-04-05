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
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './config';
import { Income } from '@bill/_store/useIncomeStore';
import { usePendingOperationsStore } from '@bill/_store/usePendingOperationsStore';

// Reference collection
const incomesCollection = collection(db, 'incomes');

// Verificar si hay conexión a internet
const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' && navigator.onLine;
};

// Get incomes for a user
export const getUserIncomes = async (userId: string): Promise<Income[]> => {
  try {
    const q = query(incomesCollection, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        amount: data.amount,
        category: data.category,
        description: data.description,
        date: data.date.toDate(),
        userId: data.userId
      };
    });
  } catch (error) {
    console.error("Error fetching incomes:", error);
    // Si hay un error, intentamos recuperar datos del almacenamiento local si existe
    const localData = localStorage.getItem('income-data');
    if (localData) {
      try {
        const parsedData = JSON.parse(localData);
        return parsedData.filter((income: Income) => income.userId === userId);
      } catch (e) {
        console.error("Error parsing local incomes:", e);
      }
    }
    
    // Si no hay datos locales, regresamos un array vacío
    return [];
  }
};

// Add a new income
export const addIncome = async (income: Omit<Income, 'id'>): Promise<Income> => {
  // Guardar datos en localStorage para recuperarlos en caso de estar offline
  try {
    const localData = localStorage.getItem('income-data') || '[]';
    const parsedData = JSON.parse(localData);
    
    // Crear un ID temporal si estamos offline
    const newIncome = {
      ...income,
      id: `temp_${Date.now()}`
    };
    
    // Actualizar datos locales
    localStorage.setItem('income-data', JSON.stringify([...parsedData, newIncome]));
    
    // Si estamos online, intenta guardar en Firebase
    if (isOnline()) {
      const docRef = await addDoc(incomesCollection, {
        ...income,
        createdAt: serverTimestamp()
      });
      
      // Actualizar los datos locales con el ID correcto
      const updatedData = parsedData.map((item: any) => 
        item.id === newIncome.id ? { ...income, id: docRef.id } : item
      );
      localStorage.setItem('income-data', JSON.stringify(updatedData));
      
      return {
        id: docRef.id,
        ...income
      };
    } else {
      // Si estamos offline, registrar la operación pendiente
      usePendingOperationsStore.getState().addOperation({
        operationType: 'add',
        collection: 'incomes',
        data: newIncome
      });
      
      // Regresar el objeto con ID temporal
      return newIncome;
    }
  } catch (error) {
    console.error("Error adding income:", error);
    // Incluso si hay error, devolver algo para que la UI no se rompa
    return {
      ...income,
      id: `error_${Date.now()}`
    };
  }
};

// Update an existing income
export const updateIncome = async (income: Income): Promise<void> => {
  try {
    // Actualizar datos locales primero
    const localData = localStorage.getItem('income-data') || '[]';
    const parsedData = JSON.parse(localData);
    const updatedData = parsedData.map((item: any) => 
      item.id === income.id ? income : item
    );
    localStorage.setItem('income-data', JSON.stringify(updatedData));
    
    // Si estamos online, actualizar en Firebase
    if (isOnline()) {
      const incomeRef = doc(db, 'incomes', income.id);
      await updateDoc(incomeRef, {
        amount: income.amount,
        category: income.category,
        description: income.description,
        date: income.date,
        updatedAt: serverTimestamp()
      });
    } else {
      // Si estamos offline, registrar operación pendiente
      usePendingOperationsStore.getState().addOperation({
        operationType: 'update',
        collection: 'incomes',
        data: income
      });
    }
  } catch (error) {
    console.error("Error updating income:", error);
    throw error;
  }
};

// Delete an income
export const deleteIncome = async (id: string): Promise<void> => {
  try {
    // Eliminar de datos locales primero
    const localData = localStorage.getItem('income-data') || '[]';
    const parsedData = JSON.parse(localData);
    const filteredData = parsedData.filter((item: any) => item.id !== id);
    localStorage.setItem('income-data', JSON.stringify(filteredData));
    
    // Si estamos online, eliminar de Firebase
    if (isOnline()) {
      const incomeRef = doc(db, 'incomes', id);
      await deleteDoc(incomeRef);
    } else {
      // Si estamos offline, registrar operación pendiente
      usePendingOperationsStore.getState().addOperation({
        operationType: 'delete',
        collection: 'incomes',
        data: id
      });
    }
  } catch (error) {
    console.error("Error deleting income:", error);
    throw error;
  }
};

// Sincronizar operaciones pendientes
export const syncPendingIncomes = async (): Promise<void> => {
  if (!isOnline()) return; // Solo intentamos sincronizar si estamos online
  
  const pendingOps = usePendingOperationsStore.getState().operations
    .filter(op => op.collection === 'incomes');
  
  if (pendingOps.length === 0) return;
  
  // Procesar cada operación pendiente
  for (const op of pendingOps) {
    try {
      if (op.operationType === 'add') {
        const { id, ...rest } = op.data;
        await addDoc(incomesCollection, {
          ...rest,
          createdAt: serverTimestamp(),
          syncedAt: serverTimestamp()
        });
      } else if (op.operationType === 'update') {
        const { id, ...rest } = op.data;
        const incomeRef = doc(db, 'incomes', id);
        await updateDoc(incomeRef, {
          ...rest,
          updatedAt: serverTimestamp(),
          syncedAt: serverTimestamp()
        });
      } else if (op.operationType === 'delete') {
        const incomeRef = doc(db, 'incomes', op.data);
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
  const localData = localStorage.getItem('current-user-id');
  if (localData) {
    try {
      await getUserIncomes(localData);
    } catch (e) {
      console.error("Error refreshing incomes after sync:", e);
    }
  }
};
