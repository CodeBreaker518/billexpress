"use client";

import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "./config";

// Definición de tipo para la recurrencia
export type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "yearly";

// Interfaz para el recordatorio con recurrencia
export interface ReminderItem {
  id: string;
  description: string;
  amount: number;
  date: Date;
  isCompleted: boolean;
  userId: string;
  recurrence: RecurrenceType;
  endDate?: Date | null; // Fecha de finalización para recordatorios recurrentes
  nextOccurrence?: Date; // Próxima fecha de ocurrencia
  isPayment?: boolean; // Indica si es un recordatorio de pago o general
}

// Obtener recordatorios para un usuario
export const getUserReminders = async (userId: string): Promise<ReminderItem[]> => {
  try {
    const remindersRef = collection(db, "reminders");
    const q = query(remindersRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        description: data.description,
        amount: data.amount,
        date: data.date.toDate(),
        isCompleted: data.isCompleted,
        userId: data.userId,
        recurrence: data.recurrence || "none",
        endDate: data.endDate ? data.endDate.toDate() : null,
        nextOccurrence: data.nextOccurrence ? data.nextOccurrence.toDate() : undefined,
        isPayment: data.isPayment !== undefined ? data.isPayment : true
      };
    });
  } catch (error) {
    console.error("Error al obtener recordatorios:", error);
    return [];
  }
};

// Obtener un recordatorio por su ID
export const getReminderById = async (id: string): Promise<ReminderItem | null> => {
  try {
    const reminderRef = doc(db, "reminders", id);
    const reminderSnap = await getDoc(reminderRef);
    
    if (reminderSnap.exists()) {
      const data = reminderSnap.data();
      return {
        id: reminderSnap.id,
        description: data.description,
        amount: data.amount,
        date: data.date.toDate(),
        isCompleted: data.isCompleted,
        userId: data.userId,
        recurrence: data.recurrence || "none",
        endDate: data.endDate ? data.endDate.toDate() : null,
        nextOccurrence: data.nextOccurrence ? data.nextOccurrence.toDate() : undefined,
        isPayment: data.isPayment !== undefined ? data.isPayment : true
      };
    }
    return null;
  } catch (error) {
    console.error("Error al obtener recordatorio:", error);
    return null;
  }
};

// Calcular la próxima fecha de ocurrencia basada en el tipo de recurrencia
const calculateNextOccurrence = (date: Date, recurrence: RecurrenceType): Date | undefined => {
  if (recurrence === "none") return undefined;
  
  const nextDate = new Date(date);
  
  switch (recurrence) {
    case "daily":
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case "weekly":
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case "monthly":
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case "yearly":
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }
  
  return nextDate;
};

// Añadir un nuevo recordatorio
export const addReminder = async (reminderData: Omit<ReminderItem, "id">): Promise<ReminderItem | null> => {
  try {
    const nextOccurrence = calculateNextOccurrence(reminderData.date, reminderData.recurrence);
    
    // Asegurar que isPayment siempre tenga un valor booleano válido
    const safeReminderData = {
      ...reminderData,
      isPayment: typeof reminderData.isPayment === 'boolean' ? reminderData.isPayment : false
    };
    
    const reminderToAdd = {
      ...safeReminderData,
      date: Timestamp.fromDate(safeReminderData.date),
      endDate: safeReminderData.endDate ? Timestamp.fromDate(safeReminderData.endDate) : null,
      nextOccurrence: nextOccurrence ? Timestamp.fromDate(nextOccurrence) : null
    };
    
    const docRef = await addDoc(collection(db, "reminders"), reminderToAdd);
    
    return {
      id: docRef.id,
      ...safeReminderData,
      nextOccurrence
    };
  } catch (error) {
    console.error("Error al añadir recordatorio:", error);
    return null;
  }
};

// Actualizar un recordatorio existente
export const updateReminder = async (reminder: ReminderItem): Promise<boolean> => {
  try {
    const reminderRef = doc(db, "reminders", reminder.id);
    const nextOccurrence = calculateNextOccurrence(reminder.date, reminder.recurrence);
    
    await updateDoc(reminderRef, {
      description: reminder.description,
      amount: reminder.amount,
      date: Timestamp.fromDate(reminder.date),
      isCompleted: reminder.isCompleted,
      recurrence: reminder.recurrence,
      endDate: reminder.endDate ? Timestamp.fromDate(reminder.endDate) : null,
      nextOccurrence: nextOccurrence ? Timestamp.fromDate(nextOccurrence) : null
    });
    
    return true;
  } catch (error) {
    console.error("Error al actualizar recordatorio:", error);
    return false;
  }
};

// Marcar un recordatorio como completado/pendiente
export const toggleReminderStatus = async (id: string, isCompleted: boolean): Promise<boolean> => {
  try {
    const reminderRef = doc(db, "reminders", id);
    await updateDoc(reminderRef, { isCompleted });
    return true;
  } catch (error) {
    console.error("Error al cambiar estado del recordatorio:", error);
    return false;
  }
};

// Eliminar un recordatorio
export const deleteReminder = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, "reminders", id));
    return true;
  } catch (error) {
    console.error("Error al eliminar recordatorio:", error);
    return false;
  }
};

// Crear próxima ocurrencia para un recordatorio recurrente que ha sido completado
export const createNextRecurrence = async (reminder: ReminderItem): Promise<ReminderItem | null> => {
  // Solo procesar recordatorios recurrentes
  if (reminder.recurrence === "none") return null;
  
  // Verificar si ya pasó la fecha de finalización
  if (reminder.endDate && new Date() > reminder.endDate) return null;
  
  // Calcular la próxima fecha
  const nextDate = calculateNextOccurrence(reminder.date, reminder.recurrence);
  if (!nextDate) return null;
  
  // Si hay fecha de finalización y la próxima ocurrencia la supera, no crear más
  if (reminder.endDate && nextDate > reminder.endDate) return null;
  
  try {
    // Crear el nuevo recordatorio con la próxima fecha, asegurando que isPayment tenga un valor
    const newReminderData: Omit<ReminderItem, "id"> = {
      description: reminder.description,
      amount: reminder.amount,
      date: nextDate,
      isCompleted: false,
      userId: reminder.userId,
      recurrence: reminder.recurrence,
      endDate: reminder.endDate,
      nextOccurrence: calculateNextOccurrence(nextDate, reminder.recurrence),
      isPayment: reminder.isPayment === undefined ? true : reminder.isPayment
    };
    
    // Añadir a Firebase
    return await addReminder(newReminderData);
  } catch (error) {
    console.error("Error al crear próxima ocurrencia:", error);
    return null;
  }
}; 