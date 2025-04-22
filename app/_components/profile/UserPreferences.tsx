"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bill/_components/ui/card";
import { SettingsPanel, SettingSection } from "@bill/_components/ui/settings-panel";
import { useAuthStore } from "@bill/_store/useAuthStore";
import { useToast } from "@bill/_components/ui/use-toast";
import { UserPreferences as IUserPreferences, getUserPreferences, updateUserPreference, resetUserPreferences } from "@bill/_services/userPreferences";
import { Bell, Home, EyeOff } from "lucide-react";

export default function UserPreferences() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<IUserPreferences>({
    showDashboardReminders: true,
    showNotifications: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  // Load user preferences when component mounts
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const userPrefs = getUserPreferences();
        setPreferences(userPrefs);
      } catch (error) {
        console.error("Error loading user preferences:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar tus preferencias",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
  }, [toast]);

  // Handle preference change
  const handlePreferenceChange = <K extends keyof IUserPreferences>(
    key: K,
    value: IUserPreferences[K]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Save the change immediately
    updateUserPreference(key, value);
    
    // Show toast notification
    toast({
      title: "Preferencias actualizadas",
      description: "Tus preferencias han sido guardadas correctamente",
      duration: 2000
    });
  };

  // Handle resetting preferences to defaults
  const handleReset = () => {
    const defaultPrefs = resetUserPreferences();
    setPreferences(defaultPrefs);
    
    toast({
      title: "Preferencias restablecidas",
      description: "Tus preferencias han sido restablecidas a los valores predeterminados",
      duration: 3000
    });
  };

  // Define settings sections
  const sections: SettingSection[] = [
    {
      title: "Dashboard",
      description: "Personaliza la apariencia y el contenido de tu panel principal",
      options: [
        {
          id: "show-dashboard-reminders",
          label: "Mostrar recordatorios en el dashboard",
          description: "Muestra alertas de recordatorios pendientes y próximos en tu panel principal",
          checked: preferences.showDashboardReminders,
          onChange: (checked) => handlePreferenceChange("showDashboardReminders", checked)
        }
      ]
    },
    {
      title: "Notificaciones",
      description: "Configura cómo y cuándo recibes notificaciones",
      options: [
        {
          id: "show-notifications",
          label: "Activar notificaciones",
          description: "Recibe notificaciones sobre recordatorios pendientes y próximos",
          checked: preferences.showNotifications,
          onChange: (checked) => handlePreferenceChange("showNotifications", checked)
        }
      ]
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Preferencias de usuario</CardTitle>
        <CardDescription>
          Personaliza tu experiencia en BillExpress ajustando estas opciones
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-pulse">Cargando preferencias...</div>
          </div>
        ) : (
          <SettingsPanel
            sections={sections}
            showResetButton={true}
            onReset={handleReset}
          />
        )}
      </CardContent>
    </Card>
  );
} 