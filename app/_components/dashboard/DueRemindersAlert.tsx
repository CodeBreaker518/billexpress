"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Reminder } from "@bill/_components/calendar/types";
import { AlertCircle, AlertTriangle, ArrowRight, CheckCircle2, Calendar } from "lucide-react";
import { Button } from "@bill/_components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@bill/_components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bill/_components/ui/card";
import { Badge } from "@bill/_components/ui/badge";
import { useReminderStore } from "@bill/_store/useReminderStore";

export interface DueRemindersAlertProps {
  showFullSummary?: boolean;
}

export function DueRemindersAlert({ showFullSummary = false }: DueRemindersAlertProps) {
  const router = useRouter();
  const { reminders, toggleReminderStatus } = useReminderStore();
  const [isClient, setIsClient] = useState(false);

  // Solo renderizamos este componente en el cliente para evitar problemas de hidratación
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  // Si no hay recordatorios, no mostrar nada
  if (!reminders || reminders.length === 0) return null;

  // Filtrar recordatorios vencidos (fecha anterior o igual a hoy y no completados)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Obtener recordatorios vencidos
  const dueReminders = reminders.filter(reminder => {
    const reminderDate = new Date(reminder.date);
    reminderDate.setHours(0, 0, 0, 0);
    return reminderDate <= today && !reminder.isCompleted;
  });

  // Obtener recordatorios próximos (próximos 3 días)
  const upcomingLimit = new Date(today);
  upcomingLimit.setDate(today.getDate() + 3);
  
  const upcomingReminders = reminders.filter(reminder => {
    if (reminder.isCompleted) return false;
    
    const reminderDate = new Date(reminder.date);
    reminderDate.setHours(0, 0, 0, 0);
    return reminderDate > today && reminderDate <= upcomingLimit;
  });

  // Si no hay recordatorios vencidos ni próximos, no mostrar nada
  if (dueReminders.length === 0 && upcomingReminders.length === 0) return null;

  // Manejar marcar como completado
  const handleMarkAsCompleted = async (reminder: Reminder) => {
    await toggleReminderStatus(reminder.id, true);
  };

  // Ir a la página del calendario
  const goToCalendar = () => {
    router.push('/dashboard/calendario');
  };

  // Versión compacta para el dashboard
  if (!showFullSummary) {
    return (
      <Alert variant="destructive" className="mb-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="flex items-center justify-between">
          <span>Recordatorios pendientes</span>
          <Button 
            variant="destructive" 
            onClick={goToCalendar} 
            size="sm" 
            className="ml-2"
          >
            Ver todos <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </AlertTitle>
        <AlertDescription className="mt-2">
          {dueReminders.length > 0 && (
            <div className="text-sm mb-1">
              Tienes <strong>{dueReminders.length}</strong> recordatorio{dueReminders.length !== 1 ? 's' : ''} vencido{dueReminders.length !== 1 ? 's' : ''}
            </div>
          )}
          {upcomingReminders.length > 0 && (
            <div className="text-sm">
              Tienes <strong>{upcomingReminders.length}</strong> recordatorio{upcomingReminders.length !== 1 ? 's' : ''} en los próximos días
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Versión completa para la página específica
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
              Recordatorios pendientes
            </CardTitle>
            <CardDescription>
              Administra tus pagos y recordatorios pendientes
            </CardDescription>
          </div>
          <Button onClick={goToCalendar} variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-1" />
            Ver calendario
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {dueReminders.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2 text-red-600 dark:text-red-400 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              Vencidos ({dueReminders.length})
            </h3>
            <div className="space-y-2">
              {dueReminders.slice(0, 5).map((reminder) => (
                <div key={reminder.id} className="flex items-center justify-between p-2 border rounded-md bg-red-50 dark:bg-red-900/10">
                  <div>
                    <div className="font-medium text-sm">
                      {reminder.description}
                      {reminder.isPayment && reminder.amount > 0 && (
                        <Badge className="ml-2 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200" variant="outline">
                          ${reminder.amount.toFixed(2)}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(reminder.date).toLocaleDateString()}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleMarkAsCompleted(reminder)}
                    className="h-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Completar
                  </Button>
                </div>
              ))}
              {dueReminders.length > 5 && (
                <Button 
                  variant="link" 
                  className="text-sm text-muted-foreground" 
                  onClick={goToCalendar}
                >
                  Ver {dueReminders.length - 5} más...
                </Button>
              )}
            </div>
          </div>
        )}

        {upcomingReminders.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2 text-amber-600 dark:text-amber-400 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Próximos ({upcomingReminders.length})
            </h3>
            <div className="space-y-2">
              {upcomingReminders.slice(0, 3).map((reminder) => (
                <div key={reminder.id} className="flex items-center justify-between p-2 border rounded-md bg-amber-50 dark:bg-amber-900/10">
                  <div>
                    <div className="font-medium text-sm">{reminder.description}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(reminder.date).toLocaleDateString()}
                    </div>
                  </div>
                  {reminder.isPayment && reminder.amount > 0 && (
                    <Badge className="ml-2 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200" variant="outline">
                      ${reminder.amount.toFixed(2)}
                    </Badge>
                  )}
                </div>
              ))}
              {upcomingReminders.length > 3 && (
                <Button 
                  variant="link" 
                  className="text-sm text-muted-foreground" 
                  onClick={goToCalendar}
                >
                  Ver {upcomingReminders.length - 3} más...
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 