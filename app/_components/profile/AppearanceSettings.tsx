"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bill/_components/ui/card";
import { Button } from "@bill/_components/ui/button";
import { useThemeStore } from "@bill/_store/useThemeStore";
import { Sun, Moon, Laptop } from "lucide-react";
import { SettingsPanel, SettingSection } from "@bill/_components/ui/settings-panel";

export default function AppearanceSettings() {
  const { theme, setTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Handle theme change
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
  };

  // Theme options for the visual button selection
  const themeOptions = [
    {
      name: "Claro",
      value: "light",
      icon: Sun,
      description: "Modo claro para todas las pantallas"
    },
    {
      name: "Oscuro",
      value: "dark",
      icon: Moon,
      description: "Modo oscuro para todas las pantallas"
    },
    {
      name: "Sistema",
      value: "system",
      icon: Laptop,
      description: "Sigue la configuración de tu dispositivo"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sun className="h-5 w-5" />
          <span>Apariencia</span>
        </CardTitle>
        <CardDescription>
          Personaliza la apariencia visual de BillExpress
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {/* Theme buttons for visual selection */}
          <div className="grid grid-cols-3 gap-4">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = theme === option.value;
              return (
                <Button
                  key={option.value}
                  variant={isActive ? "default" : "outline"}
                  className="flex flex-col items-center justify-center h-24 space-y-2"
                  onClick={() => handleThemeChange(option.value as 'light' | 'dark' | 'system')}
                >
                  <Icon className="h-6 w-6" />
                  <div className="text-sm">{option.name}</div>
                </Button>
              );
            })}
          </div>
          
          {/* Descriptive text for selected theme */}
          <p className="text-sm text-muted-foreground mt-2">
            {themeOptions.find(option => option.value === theme)?.description || "Personaliza la apariencia de la aplicación"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 