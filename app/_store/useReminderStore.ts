"use client";

import { create } from "zustand";
import { Reminder, RecurrenceType } from "@bill/_components/calendar/types";
import { 
  getUserReminders, 
  addReminder as addReminderService, 
  updateReminder as updateReminderService,
  deleteReminder as deleteReminderService,
  toggleReminderStatus as toggleReminderStatusService,
  createNextRecurrence
} from "@bill/_firebase/reminderService";

interface ReminderState {
  reminders: Reminder[];
  loading: boolean;
  setReminders: (reminders: Reminder[]) => void;
  addReminder: (reminder: Omit<Reminder, "id">) => Promise<Reminder | null>;
  updateReminder: (reminder: Reminder) => Promise<boolean>;
  deleteReminder: (id: string) => Promise<boolean>;
  toggleReminderStatus: (id: string, isCompleted: boolean) => Promise<boolean>;
  loadReminders: (userId: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useReminderStore = create<ReminderState>((set, get) => ({
  reminders: [],
  loading: false,
  
  setReminders: (reminders) => set({ reminders }),
  
  addReminder: async (reminderData) => {
    set({ loading: true });
    try {
      // Asegurar que isPayment no sea undefined
      const safeReminderData = {
        ...reminderData,
        isPayment: reminderData.isPayment === undefined ? true : reminderData.isPayment
      };
      
      const newReminder = await addReminderService(safeReminderData as any);
      if (newReminder) {
        set((state) => ({
          reminders: [...state.reminders, newReminder as Reminder],
        }));
        return newReminder as Reminder;
      }
      return null;
    } catch (error) {
      console.error("Error añadiendo recordatorio:", error);
      return null;
    } finally {
      set({ loading: false });
    }
  },
  
  updateReminder: async (reminder) => {
    set({ loading: true });
    try {
      const success = await updateReminderService(reminder as any);
      if (success) {
        set((state) => ({
          reminders: state.reminders.map((r) => 
            r.id === reminder.id ? reminder : r
          ),
        }));
      }
      return success;
    } catch (error) {
      console.error("Error actualizando recordatorio:", error);
      return false;
    } finally {
      set({ loading: false });
    }
  },
  
  deleteReminder: async (id) => {
    set({ loading: true });
    try {
      // Obtener información del recordatorio a eliminar
      const reminderToDelete = get().reminders.find(r => r.id === id);
      if (!reminderToDelete || !reminderToDelete.userId) {
        console.error("Recordatorio no encontrado o falta ID de usuario");
        return false;
      }
      
      // Verificar si es un recordatorio recurrente
      const isRecurrent = reminderToDelete.recurrence && reminderToDelete.recurrence !== "none";
      
      // Si es recurrente, buscar todos los recordatorios relacionados
      if (isRecurrent) {
        const { description, userId, isPayment, recurrence } = reminderToDelete;
        
        // Encontrar todos los IDs de recordatorios relacionados con el mismo patrón
        const relatedReminderIds = get().reminders
          .filter(r => 
            r.description === description &&
            r.userId === userId && 
            r.isPayment === isPayment &&
            r.recurrence === recurrence
          )
          .map(r => r.id);
          
        console.log(`Eliminando ${relatedReminderIds.length} recordatorios relacionados`);
        
        // Eliminar todos los recordatorios relacionados
        const deletePromises = relatedReminderIds.map(reminderId => 
          deleteReminderService(reminderId)
        );
        
        // Esperar a que se completen todas las eliminaciones
        const results = await Promise.all(deletePromises);
        const allSuccessful = results.every(result => result === true);
        
        if (allSuccessful) {
          // Actualizar el estado local eliminando todos los recordatorios relacionados
          set((state) => ({
            reminders: state.reminders.filter(r => !relatedReminderIds.includes(r.id)),
          }));
          
          set({ loading: false });
          return true;
        } else {
          console.error("Error eliminando algunos recordatorios relacionados");
          // Recargar los recordatorios para asegurar consistencia
          const userId = reminderToDelete.userId;
          if (userId) {
            await get().loadReminders(userId);
          }
          set({ loading: false });
          return false;
        }
      } else {
        // Para recordatorios no recurrentes, eliminar solo el recordatorio individual
        const success = await deleteReminderService(id);
        if (success) {
          set((state) => ({
            reminders: state.reminders.filter((r) => r.id !== id),
          }));
        }
        set({ loading: false });
        return success;
      }
    } catch (error) {
      console.error("Error eliminando recordatorio:", error);
      set({ loading: false });
      return false;
    }
  },
  
  toggleReminderStatus: async (id, isCompleted) => {
    try {
      // Verificar que el usuario esté autenticado antes de intentar la operación
      const reminderToToggle = get().reminders.find(r => r.id === id);
      if (!reminderToToggle || !reminderToToggle.userId) {
        console.error("Recordatorio no encontrado o falta ID de usuario");
        return false;
      }
      
      // Si el ID comienza con "future-", es una representación visual y no debe
      // cambiarse el estado en la base de datos
      if (id.startsWith("future-")) {
        console.warn("No se puede cambiar el estado de un recordatorio futuro");
        return false;
      }
      
      // Si se está marcando como completado, verificar que la fecha ya haya llegado
      if (isCompleted) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const reminderDate = new Date(reminderToToggle.date);
        reminderDate.setHours(0, 0, 0, 0);
        
        if (reminderDate > today) {
          // La fecha del recordatorio es futura, no permitir marcar como completado
          console.warn("No se puede marcar como completado un recordatorio con fecha futura");
          return false;
        }
      }
      
      const success = await toggleReminderStatusService(id, isCompleted);
      
      if (success) {
        const updatedReminders = [...get().reminders];
        const index = updatedReminders.findIndex(r => r.id === id);
        
        if (index !== -1) {
          // Guardamos el estado anterior para saber si estamos cambiando de incompleto a completo
          const wasCompletedBefore = updatedReminders[index].isCompleted;
          
          // Actualizar el estado del recordatorio
          updatedReminders[index] = {
            ...updatedReminders[index],
            isCompleted
          };
          
          // Solo crear la próxima ocurrencia si:
          // 1. Se marca como completado (isCompleted es true)
          // 2. No estaba completado anteriormente (wasCompletedBefore es false)
          // 3. Es un recordatorio recurrente
          // 4. No existe ya una próxima ocurrencia para este recordatorio
          if (isCompleted && 
              !wasCompletedBefore && 
              updatedReminders[index].recurrence && 
              updatedReminders[index].recurrence !== "none") {
            
            // Verificar si ya existe una futura ocurrencia para este recordatorio
            const { recurrence, description, userId, isPayment } = updatedReminders[index];
            const nextDate = calculateNextOccurrenceDate(updatedReminders[index].date, recurrence);
            
            if (nextDate) {
              // Verificar si ya existe un recordatorio con las mismas características en la fecha calculada
              const alreadyHasNextOccurrence = updatedReminders.some(r => 
                r.description === description &&
                r.userId === userId &&
                r.isPayment === isPayment &&
                r.recurrence === recurrence &&
                isSameDay(new Date(r.date), nextDate)
              );
              
              // Solo crear la siguiente ocurrencia si no existe ya
              if (!alreadyHasNextOccurrence) {
                const nextReminder = await createNextRecurrence(updatedReminders[index] as any);
                if (nextReminder) {
                  updatedReminders.push(nextReminder as Reminder);
                }
              } else {
                console.log("Ya existe una próxima ocurrencia para este recordatorio, no se crea una nueva");
              }
            }
          }
          
          set({ reminders: updatedReminders });
        }
      }
      
      return success;
    } catch (error) {
      console.error("Error al cambiar estado del recordatorio:", error);
      return false;
    }
  },
  
  loadReminders: async (userId) => {
    set({ loading: true });
    try {
      // Verificar que el userId sea válido antes de hacer la consulta
      if (!userId) {
        console.warn("No se puede cargar recordatorios sin un ID de usuario válido");
        set({ reminders: [] });
        return;
      }
      
      const reminders = await getUserReminders(userId);
      set({ reminders: reminders as Reminder[] });
    } catch (error) {
      console.error("Error cargando recordatorios:", error);
      // Manejar error de permisos específicamente (código de Firestore)
      if (error instanceof Error && error.message.includes("permission")) {
        console.warn("Error de permisos al cargar recordatorios, posiblemente el usuario cerró sesión");
        set({ reminders: [] });
      }
    } finally {
      set({ loading: false });
    }
  },
  
  setLoading: (loading) => set({ loading }),
}));

// Función auxiliar para calcular la próxima fecha de ocurrencia
const calculateNextOccurrenceDate = (date: Date, recurrence: RecurrenceType): Date | null => {
  if (recurrence === "none") return null;
  
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
    default:
      return null;
  }
  
  return nextDate;
};

// Función auxiliar para verificar si dos fechas son el mismo día
const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}; 