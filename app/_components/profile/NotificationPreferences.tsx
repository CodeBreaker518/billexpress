import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bill/_components/ui/card";
import { Switch } from "@bill/_components/ui/switch";
import { Label } from "@bill/_components/ui/label";
import { useAuthStore } from "@bill/_store/useAuthStore";
import { getUserPreferences, saveUserPreferences } from "@bill/_lib/utils/userPreferences";
import { useToast } from "@bill/_components/ui/use-toast";

export default function NotificationPreferences() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [showDueReminders, setShowDueReminders] = useState(true);
  const [showUpcomingReminders, setShowUpcomingReminders] = useState(true);
  const [loaded, setLoaded] = useState(false);

  // Cargar preferencias al inicio
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const prefs = getUserPreferences(user.uid);
      setShowDueReminders(prefs.reminders.showDueReminders);
      setShowUpcomingReminders(prefs.reminders.showUpcomingReminders);
      setLoaded(true);
    }
  }, [user]);

  // Guardar preferencias cuando cambian
  useEffect(() => {
    if (!loaded || !user) return;
    
    saveUserPreferences({
      reminders: {
        showDueReminders,
        showUpcomingReminders
      }
    }, user.uid);
    
  }, [showDueReminders, showUpcomingReminders, loaded, user]);

  // Manejadores de cambios
  const handleDueRemindersChange = (checked: boolean) => {
    setShowDueReminders(checked);
    toast({
      title: checked ? "Notificaciones activadas" : "Notificaciones desactivadas",
      description: checked 
        ? "Verás notificaciones de recordatorios vencidos en el dashboard" 
        : "No verás notificaciones de recordatorios vencidos en el dashboard",
      duration: 2000,
    });
  };

  const handleUpcomingRemindersChange = (checked: boolean) => {
    setShowUpcomingReminders(checked);
    toast({
      title: checked ? "Notificaciones activadas" : "Notificaciones desactivadas", 
      description: checked 
        ? "Verás notificaciones de próximos recordatorios en el dashboard" 
        : "No verás notificaciones de próximos recordatorios en el dashboard",
      duration: 2000,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de notificaciones</CardTitle>
        <CardDescription>
          Configura qué notificaciones quieres ver en tu tablero
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label htmlFor="dueReminders" className="text-base">Recordatorios vencidos</Label>
            <p className="text-sm text-muted-foreground">
              Mostrar notificaciones de recordatorios vencidos en el dashboard
            </p>
          </div>
          <Switch
            id="dueReminders"
            checked={showDueReminders}
            onCheckedChange={handleDueRemindersChange}
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label htmlFor="upcomingReminders" className="text-base">Recordatorios próximos</Label>
            <p className="text-sm text-muted-foreground">
              Mostrar notificaciones de próximos recordatorios en el dashboard
            </p>
          </div>
          <Switch
            id="upcomingReminders"
            checked={showUpcomingReminders}
            onCheckedChange={handleUpcomingRemindersChange}
          />
        </div>
      </CardContent>
    </Card>
  );
} 