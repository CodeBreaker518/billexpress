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
  import { Expense } from '@bill/_store/useExpenseStore';
  import { usePendingOperationsStore } from '@bill/_store/usePendingOperationsStore';
  
  // Reference collection
  const expensesCollection = collection(db, 'expenses');
  
  // Verificar si hay conexión a internet
  const isOnline = (): boolean => {
    return typeof navigator !== 'undefined' && navigator.onLine;
  };
  
  // Get expenses for a user
  export const getUserExpenses = async (userId: string): Promise<Expense[]> => {
    try {
      const q = query(expensesCollection, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      
      const expenses = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          amount: data.amount,
          category: data.category,
          description: data.description,
          date: data.date.toDate(),
          userId: data.userId
        } as Expense;
      });
      
      // Guardar en localStorage para acceso offline
      if (expenses.length > 0) {
        localStorage.setItem('expense-data', JSON.stringify(expenses));
      }
      
      return expenses;
    } catch (error) {
      console.error("Error fetching expenses:", error);
      // Si hay un error, intentamos recuperar datos del almacenamiento local
      const localData = localStorage.getItem('expense-data');
      if (localData) {
        try {
          const parsedData = JSON.parse(localData);
          return parsedData.filter((expense: Expense) => expense.userId === userId);
        } catch (e) {
          console.error("Error parsing local expenses:", e);
        }
      }
      
      // Si no hay datos locales, regresamos un array vacío
      return [];
    }
  };
  
  // Add a new expense
  export const addExpense = async (expense: Omit<Expense, 'id'>): Promise<Expense> => {
    // Crear un ID temporal para operaciones offline
    const tempId = `temp_${Date.now()}`;
    
    // Guardar datos en localStorage para recuperarlos en caso de estar offline
    try {
      const localData = localStorage.getItem('expense-data') || '[]';
      const parsedData = JSON.parse(localData);
      
      // Crear un nuevo gasto con ID temporal si estamos offline
      const newExpense = {
        ...expense,
        id: tempId,
        date: new Date(expense.date) // Asegurar que sea objeto Date
      };
      
      // Actualizar datos locales
      localStorage.setItem('expense-data', JSON.stringify([...parsedData, newExpense]));
      
      // Si estamos online, intenta guardar en Firebase
      if (isOnline()) {
        try {
          const docRef = await addDoc(expensesCollection, {
            ...expense,
            date: Timestamp.fromDate(expense.date),
            createdAt: serverTimestamp()
          });
          
          // Actualizar los datos locales con el ID correcto
          const updatedData = parsedData.map((item: any) => 
            item.id === tempId ? { ...expense, id: docRef.id } : item
          );
          localStorage.setItem('expense-data', JSON.stringify(updatedData));
          
          return {
            ...expense,
            id: docRef.id
          };
        } catch (error) {
          console.error("Error adding expense to Firebase:", error);
          // Si hay error con Firebase pero estamos online, seguimos con el ID temporal
          // y lo marcamos como pendiente de sincronización
          usePendingOperationsStore.getState().addOperation({
            operationType: 'add',
            collection: 'expenses',
            data: newExpense
          });
          
          return newExpense;
        }
      } else {
        // Si estamos offline, registrar la operación pendiente
        usePendingOperationsStore.getState().addOperation({
          operationType: 'add',
          collection: 'expenses',
          data: newExpense
        });
        
        // Regresar el objeto con ID temporal
        return newExpense;
      }
    } catch (error) {
      console.error("Error in addExpense:", error);
      // Incluso si hay error, devolver algo para que la UI no se rompa
      return {
        ...expense,
        id: tempId
      };
    }
  };
  
  // Update an existing expense
  export const updateExpense = async (expense: Expense): Promise<void> => {
    try {
      // Actualizar datos locales primero
      const localData = localStorage.getItem('expense-data') || '[]';
      const parsedData = JSON.parse(localData);
      const updatedData = parsedData.map((item: any) => 
        item.id === expense.id ? expense : item
      );
      localStorage.setItem('expense-data', JSON.stringify(updatedData));
      
      // Si estamos online, actualizar en Firebase
      if (isOnline()) {
        try {
          const expenseRef = doc(db, 'expenses', expense.id);
          await updateDoc(expenseRef, {
            amount: expense.amount,
            category: expense.category,
            description: expense.description,
            date: Timestamp.fromDate(expense.date),
            updatedAt: serverTimestamp()
          });
        } catch (error) {
          console.error("Error updating expense in Firebase:", error);
          // Si hay error con Firebase pero estamos online, lo marcamos como pendiente
          usePendingOperationsStore.getState().addOperation({
            operationType: 'update',
            collection: 'expenses',
            data: expense
          });
        }
      } else {
        // Si estamos offline, registrar operación pendiente
        usePendingOperationsStore.getState().addOperation({
          operationType: 'update',
          collection: 'expenses',
          data: expense
        });
      }
    } catch (error) {
      console.error("Error in updateExpense:", error);
      throw error;
    }
  };
  
  // Delete an expense
  export const deleteExpense = async (id: string): Promise<void> => {
    try {
      // Eliminar de datos locales primero
      const localData = localStorage.getItem('expense-data') || '[]';
      const parsedData = JSON.parse(localData);
      const filteredData = parsedData.filter((item: any) => item.id !== id);
      localStorage.setItem('expense-data', JSON.stringify(filteredData));
      
      // Si estamos online, eliminar de Firebase
      if (isOnline()) {
        try {
          const expenseRef = doc(db, 'expenses', id);
          await deleteDoc(expenseRef);
        } catch (error) {
          console.error("Error deleting expense from Firebase:", error);
          // Si hay error con Firebase pero estamos online, lo marcamos como pendiente
          usePendingOperationsStore.getState().addOperation({
            operationType: 'delete',
            collection: 'expenses',
            data: id
          });
        }
      } else {
        // Si estamos offline, registrar operación pendiente
        usePendingOperationsStore.getState().addOperation({
          operationType: 'delete',
          collection: 'expenses',
          data: id
        });
      }
    } catch (error) {
      console.error("Error in deleteExpense:", error);
      throw error;
    }
  };
  
  // Sincronizar operaciones pendientes
  export const syncPendingExpenses = async (): Promise<void> => {
    if (!isOnline()) return; // Solo intentamos sincronizar si estamos online
    
    const pendingOps = usePendingOperationsStore.getState().operations
      .filter(op => op.collection === 'expenses');
    
    if (pendingOps.length === 0) return;
    
    // Procesar cada operación pendiente
    for (const op of pendingOps) {
      try {
        if (op.operationType === 'add') {
          const { id, ...rest } = op.data;
          await addDoc(expensesCollection, {
            ...rest,
            date: Timestamp.fromDate(new Date(rest.date)),
            createdAt: serverTimestamp(),
            syncedAt: serverTimestamp()
          });
        } else if (op.operationType === 'update') {
          const { id, ...rest } = op.data;
          const expenseRef = doc(db, 'expenses', id);
          await updateDoc(expenseRef, {
            ...rest,
            date: Timestamp.fromDate(new Date(rest.date)),
            updatedAt: serverTimestamp(),
            syncedAt: serverTimestamp()
          });
        } else if (op.operationType === 'delete') {
          const expenseRef = doc(db, 'expenses', op.data);
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
    const localData = localStorage.getItem('current-user-id');
    if (localData) {
      try {
        await getUserExpenses(localData);
      } catch (e) {
        console.error("Error refreshing expenses after sync:", e);
      }
    }
  };