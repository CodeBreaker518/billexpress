"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bill/_components/ui/card";
import { SettingsPanel, SettingSection } from "@bill/_components/ui/settings-panel";
import { useAuthStore } from "@bill/_store/useAuthStore";
import { useToast } from "@bill/_components/ui/use-toast";
import { UserPreferences as IUserPreferences, getUserPreferences, updateUserPreference, resetUserPreferences } from "@bill/_services/userPreferences";
import { Bell, Home, EyeOff, BarChart3, PlusCircle, MinusCircle, Save } from "lucide-react";
import { Input } from "@bill/_components/ui/input";
import { Label } from "@bill/_components/ui/label";
import { Button } from "@bill/_components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@bill/_components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Esquema de validación para el umbral de gastos hormiga
const antExpenseSchema = z.object({
  antExpenseThreshold: z.coerce.number().min(10).max(1000)
});

type AntExpenseFormValues = z.infer<typeof antExpenseSchema>;

export default function UserPreferences() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<IUserPreferences>({
    showDashboardReminders: true,
    showNotifications: true,
    antExpenseThreshold: 100
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  // Configurar el formulario con react-hook-form y zod
  const form = useForm<AntExpenseFormValues>({
    resolver: zodResolver(antExpenseSchema),
    defaultValues: {
      antExpenseThreshold: 100
    },
    mode: "onChange" // Validar al cambiar el valor
  });

  // Load user preferences when component mounts
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const userPrefs = getUserPreferences();
        setPreferences(userPrefs);
        
        // Actualizar el valor del formulario
        form.reset({ antExpenseThreshold: userPrefs.antExpenseThreshold });
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
  }, [toast, form]);

  // Handle preference change
  const handlePreferenceChange = <K extends keyof IUserPreferences>(
    key: K,
    value: IUserPreferences[K]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Para opciones de switch, guardar inmediatamente
    if (typeof value === 'boolean') {
      // Save the change immediately
      updateUserPreference(key, value);
      
      // Show toast notification
      toast({
        title: "Preferencias actualizadas",
        description: "Tus preferencias han sido guardadas correctamente",
        duration: 2000
      });
    } else {
      // Para valores numéricos, marcar como modificado pero no guardar aún
      setIsDirty(true);
    }
  };

  // Guardar el umbral de gastos hormiga
  const saveAntExpenseThreshold = (values: AntExpenseFormValues) => {
    try {
      // Asegurarse de que el valor es un número válido
      const thresholdValue = Number(values.antExpenseThreshold);
      
      if (isNaN(thresholdValue) || thresholdValue < 10 || thresholdValue > 1000) {
        toast({
          title: "Error",
          description: "El valor debe ser un número entre 10 y 1000",
          variant: "destructive"
        });
        return;
      }
      
      // Guardar el valor
      updateUserPreference("antExpenseThreshold", thresholdValue);
      
      // Actualizar el estado local
      setPreferences(prev => ({
        ...prev,
        antExpenseThreshold: thresholdValue
      }));
      
      setIsDirty(false);
      
      toast({
        title: "Umbral actualizado",
        description: "El umbral para gastos hormiga ha sido guardado correctamente",
        duration: 2000
      });
      
      // Registrar en consola para depuración
      console.log("Umbral guardado:", thresholdValue);
    } catch (error) {
      console.error("Error al guardar el umbral:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el umbral para gastos hormiga",
        variant: "destructive"
      });
    }
  };

  // Handle resetting preferences to defaults
  const handleReset = () => {
    const defaultPrefs = resetUserPreferences();
    setPreferences(defaultPrefs);
    form.reset({ antExpenseThreshold: defaultPrefs.antExpenseThreshold });
    setIsDirty(false);
    
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
      icon: <Home className="h-5 w-5 text-primary mr-2" />,
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
      icon: <Bell className="h-5 w-5 text-primary mr-2" />,
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
    },
    {
      title: "Analíticas",
      icon: <BarChart3 className="h-5 w-5 text-primary mr-2" />,
      description: "Configura los parámetros para el análisis de tus finanzas",
      customContent: (
        <div className="space-y-4 mt-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(saveAntExpenseThreshold)} className="space-y-4">
              <FormField
                control={form.control}
                name="antExpenseThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Umbral para gastos hormiga</FormLabel>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                      <div className="flex items-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const newValue = Math.max(10, field.value - 10);
                            form.setValue("antExpenseThreshold", newValue);
                            setIsDirty(true);
                          }}
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                        <FormControl>
                          <div className="flex-1 mx-2">
                            <Input
                              type="number"
                              min={10}
                              max={1000}
                              step={10}
                              {...field}
                              value={field.value}
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                if (!isNaN(value)) {
                                  field.onChange(value);
                                  setIsDirty(true);
                                }
                              }}
                              className="w-24 text-center"
                              onBlur={() => {
                                // Si el valor está fuera de rango, ajustarlo
                                const value = field.value;
                                if (value < 10) {
                                  form.setValue("antExpenseThreshold", 10);
                                } else if (value > 1000) {
                                  form.setValue("antExpenseThreshold", 1000);
                                }
                              }}
                            />
                          </div>
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const newValue = Math.min(1000, field.value + 10);
                            form.setValue("antExpenseThreshold", newValue);
                            setIsDirty(true);
                          }}
                        >
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormDescription className="flex-1 min-w-[200px]">
                        Monto máximo para considerar un gasto como "hormiga" (entre $10 y $1000)
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end mt-4">
                <Button 
                  type="submit"
                  disabled={!isDirty}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar cambios
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )
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