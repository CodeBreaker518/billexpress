"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Reminder } from "@bill/_components/calendar/types";
import { AlertCircle, AlertTriangle, ArrowRight, CheckCircle2, Calendar, Eye, EyeOff } from "lucide-react";
import { Button } from "@bill/_components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@bill/_components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bill/_components/ui/card";
import { Badge } from "@bill/_components/ui/badge";
import { Switch } from "@bill/_components/ui/switch";
import { useReminderStore } from "@bill/_store/useReminderStore";
import { useAuthStore } from "@bill/_store/useAuthStore";
import { getUserPreferences, updateUserPreference } from "@bill/_services/userPreferences";

export interface DueRemindersAlertProps {
  showFullSummary?: boolean;
}

export function DueRemindersAlert({ showFullSummary = false }: DueRemindersAlertProps) {
  const router = useRouter();
  const { reminders, toggleReminderStatus } = useReminderStore();
  const { user } = useAuthStore();
  const [isClient, setIsClient] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const [userPrefs, setUserPrefs] = useState({
    showReminders: true
  });

  // Solo renderizamos este componente en el cliente para evitar problemas de hidratación
  useEffect(() => {
    setIsClient(true);
    
    // Cargar preferencias del usuario
    if (typeof window !== 'undefined') {
      try {
        const prefs = getUserPreferences();
        setUserPrefs({
          showReminders: prefs.showDashboardReminders
        });
        setPrefsLoaded(true);
      } catch (error) {
        console.error("Error al cargar preferencias:", error);
        setPrefsLoaded(true);
      }
    }
  }, []);

  // Función para actualizar preferencias
  const toggleShowReminders = () => {
    const newValue = !userPrefs.showReminders;
    setUserPrefs(prev => ({
      ...prev,
      showReminders: newValue
    }));
    
    // Actualizar en localStorage
    updateUserPreference('showDashboardReminders', newValue);
  };

  // Función para verificar y corregir inconsistencias en recordatorios
  const fixInconsistentReminders = () => {
    if (!reminders || reminders.length === 0) return;
    
    let inconsistenciesFound = false;
    console.log('-------- Verificando inconsistencias en recordatorios --------');
    
    // Verificar recordatorios con fechas pasadas que deberían estar completados
    reminders.forEach(reminder => {
      const reminderDate = new Date(reminder.date);
      reminderDate.setHours(0, 0, 0, 0);
      
      // Verificar si hay recordatorios completados con el mismo patrón
      const similarReminders = reminders.filter(r => 
        r.description === reminder.description && 
        r.isPayment === reminder.isPayment &&
        r.recurrence === reminder.recurrence &&
        r.id !== reminder.id
      );
      
      if (similarReminders.length > 0) {
        console.log(`Recordatorio "${reminder.description}" tiene ${similarReminders.length} similares:`);
        similarReminders.forEach(r => {
          const rDate = new Date(r.date);
          rDate.setHours(0, 0, 0, 0);
          console.log(`- ID: ${r.id.substring(0, 8)}... | Fecha: ${new Date(r.date).toLocaleDateString()} | Completado: ${r.isCompleted}`);
        });
        
        // Verificar si hay un recordatorio recurrente completado después de otro no completado
        similarReminders.forEach(r => {
          const rDate = new Date(r.date);
          rDate.setHours(0, 0, 0, 0);
          
          if (r.isCompleted && !reminder.isCompleted && rDate > reminderDate) {
            inconsistenciesFound = true;
            console.log(`⚠️ INCONSISTENCIA: Recordatorio "${reminder.description}" (${new Date(reminder.date).toLocaleDateString()}) no está completado pero uno posterior sí lo está`);
          }
        });
      }
    });
    
    if (!inconsistenciesFound) {
      console.log('No se encontraron inconsistencias en los recordatorios');
    }
    console.log('-------- Fin de verificación --------');
  };
  
  // Ejecutar la verificación una vez cuando se cargan los recordatorios
  useEffect(() => {
    if (isClient && reminders && reminders.length > 0) {
      fixInconsistentReminders();
    }
  }, [reminders, isClient]);

  if (!isClient) return null;

  // Si no hay recordatorios, no mostrar nada
  if (!reminders || reminders.length === 0) return null;

  // Si el usuario ha desactivado los recordatorios en el dashboard y no estamos en modo completo
  if (!userPrefs.showReminders && !showFullSummary) return null;

  // Filtrar recordatorios vencidos (fecha anterior o igual a hoy y no completados)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Obtener recordatorios vencidos
  const dueReminders = reminders.filter(reminder => {
    const reminderDate = new Date(reminder.date);
    reminderDate.setHours(0, 0, 0, 0);
    const isDue = reminderDate <= today && !reminder.isCompleted;
    
    // Añadir depuración para ver qué recordatorios se están detectando como pendientes
    if (isDue) {
      console.log('Recordatorio pendiente detectado:', {
        id: reminder.id,
        descripción: reminder.description,
        fecha: new Date(reminder.date).toLocaleDateString(),
        fechaOriginal: reminder.date,
        fechaComparación: reminderDate.toISOString(),
        hoy: today.toISOString(),
        esAnteriorOIgual: reminderDate <= today,
        estaCompletado: reminder.isCompleted,
        tipo: reminder.isPayment ? 'Pago' : 'General',
        recurrencia: reminder.recurrence
      });
    }
    
    return isDue;
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
    // Si hay recordatorios vencidos, mostrar alerta de urgencia
    if (dueReminders.length > 0) {
      return (
        <Alert variant="destructive" className="mb-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 px-3 py-3 sm:px-5 sm:py-4 gap-2 max-w-xl">
          <AlertTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="truncate">Recordatorios pendientes</span>
            </div>
            <Button 
              variant="destructive" 
              onClick={goToCalendar} 
              size="sm" 
              className="ml-0 sm:ml-2 w-full sm:w-auto mt-2 sm:mt-0"
            >
              Ver todos <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </AlertTitle>
          <AlertDescription className="pl-0 sm:pl-2 mt-2">
            <div className="text-sm mb-1 break-words">
              Tienes <strong>{dueReminders.length}</strong> recordatorio{dueReminders.length !== 1 ? 's' : ''} pendiente{dueReminders.length !== 1 ? 's' : ''}
            </div>
            {upcomingReminders.length > 0 && (
              <div className="text-sm break-words">
                Y <strong>{upcomingReminders.length}</strong> recordatorio{upcomingReminders.length !== 1 ? 's' : ''} en los próximos días
              </div>
            )}
          </AlertDescription>
        </Alert>
      );
    }
    
    // Si solo hay recordatorios próximos, mostrar alerta informativa en color ámbar
    if (upcomingReminders.length > 0) {
      return (
        <Alert className="mb-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 px-3 py-3 sm:px-5 sm:py-4 max-w-xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <AlertTitle className="flex-1 truncate">
              <span>Recordatorios próximos</span>
            </AlertTitle>
            <Button 
              variant="outline" 
              onClick={goToCalendar} 
              size="sm" 
              className="ml-0 sm:ml-2 w-full sm:w-auto mt-2 sm:mt-0 border-amber-200 hover:bg-amber-100"
            >
              Ver todos <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
          <AlertDescription className="mt-2">
            <div className="text-sm break-words">
              Tienes <strong>{upcomingReminders.length}</strong> recordatorio{upcomingReminders.length !== 1 ? 's' : ''} en los próximos días
            </div>
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
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
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowReminderSettings(!showReminderSettings)}
                className="text-xs px-2 h-8"
              >
                {showReminderSettings ? "Ocultar opciones" : "Opciones"}
              </Button>
              <Button onClick={goToCalendar} variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-1" />
                Ver calendario
              </Button>
            </div>
            {showReminderSettings && (
              <div className="flex items-center gap-2 bg-muted rounded-md p-2 text-xs">
                <Switch 
                  checked={userPrefs.showReminders} 
                  onCheckedChange={toggleShowReminders}
                  id="show-reminders-switch"
                />
                <label htmlFor="show-reminders-switch" className="cursor-pointer">
                  {userPrefs.showReminders ? (
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> Mostrar en dashboard</span>
                  ) : (
                    <span className="flex items-center gap-1"><EyeOff className="h-3 w-3" /> Ocultar en dashboard</span>
                  )}
                </label>
              </div>
            )}
          </div>
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
                <div key={reminder.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 border rounded-md bg-red-50 dark:bg-red-900/10">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
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
                    className="h-8 text-green-600 hover:text-green-700 hover:bg-green-100 w-full sm:w-auto"
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
                <div key={reminder.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 border rounded-md bg-amber-50 dark:bg-amber-900/10">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{reminder.description}</div>
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

        {/* Mensaje para cuando no hay recordatorios para mostrar */}
        {dueReminders.length === 0 && upcomingReminders.length === 0 && (
          <div className="text-center p-4 text-muted-foreground">
            No hay recordatorios pendientes.
          </div>
        )}
      </CardContent>
    </Card>
  );
} 