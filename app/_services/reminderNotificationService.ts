"use client";

import { Reminder } from "@bill/_components/calendar/types";
import { toast } from "@bill/_components/ui/use-toast";

/**
 * Verifica si hay recordatorios vencidos y muestra notificaciones
 * Un recordatorio se considera vencido cuando:
 * 1. Su fecha es anterior o igual a la fecha actual
 * 2. No está marcado como completado
 */
export const checkDueReminders = (reminders: Reminder[]) => {
  if (!reminders || reminders.length === 0) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filtrar recordatorios vencidos (fecha pasada o de hoy y no completados)
  const dueReminders = reminders.filter(reminder => {
    const reminderDate = new Date(reminder.date);
    reminderDate.setHours(0, 0, 0, 0);
    
    // Es un recordatorio vencido si la fecha es hoy o anterior Y no está completado
    return reminderDate <= today && !reminder.isCompleted;
  });

  // Mostrar notificaciones para recordatorios vencidos
  if (dueReminders.length > 0) {
    // Mostrar un resumen general
    if (dueReminders.length === 1) {
      const reminder = dueReminders[0];
      toast({
        title: "Recordatorio pendiente",
        description: `${reminder.description} - ${reminder.isPayment ? `$${reminder.amount}` : 'Sin monto'}`,
        variant: "warning",
      });
    } else {
      toast({
        title: "Recordatorios pendientes",
        description: `Tienes ${dueReminders.length} recordatorios pendientes por atender`,
        variant: "warning",
      });
    }
  }
};

/**
 * Verifica recordatorios que vencen pronto (próximos 3 días)
 */
export const checkUpcomingReminders = (reminders: Reminder[]) => {
  if (!reminders || reminders.length === 0) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Fecha límite (3 días a partir de hoy)
  const upcomingLimit = new Date(today);
  upcomingLimit.setDate(today.getDate() + 3);

  // Filtrar recordatorios próximos (entre mañana y los próximos 3 días)
  const upcomingReminders = reminders.filter(reminder => {
    const reminderDate = new Date(reminder.date);
    reminderDate.setHours(0, 0, 0, 0);
    
    // Es un recordatorio próximo si la fecha está entre mañana y los próximos 3 días Y no está completado
    return reminderDate > today && reminderDate <= upcomingLimit && !reminder.isCompleted;
  });

  // Mostrar notificación para recordatorios próximos
  if (upcomingReminders.length > 0) {
    toast({
      title: "Recordatorios próximos",
      description: `Tienes ${upcomingReminders.length} recordatorios en los próximos 3 días`,
      variant: "warning",
    });
  }
}; 