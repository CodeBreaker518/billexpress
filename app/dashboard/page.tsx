"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useFinanceStore } from "@bill/_store/useFinanceStore";
import { useAuthStore } from "@bill/_store/useAuthStore";
import { useReminderStore } from "@bill/_store/useReminderStore";
import DashboardSummary from "./components/DashboardSummary";
import RecentTransactions from "./components/RecentTransactions";
import CategoryCharts from "./components/CategoryCharts";
import QuickActions from "./components/QuickActions";
import { DueRemindersAlert } from "@bill/_components/dashboard/DueRemindersAlert";
import FinanceFormDialog from "@bill/_components/FinanceFormDialog";
import { FinanceSkeletonLoader } from "@bill/_components/ui/skeletons";
import { getGreeting } from "@bill/_lib/utils/greeting";
import { getUserPreferences } from "@bill/_services/userPreferences";

export default function DashboardPage() {
  const { reminders } = useReminderStore();
  const { user } = useAuthStore();
  const { loadFinanceData, isLoading } = useFinanceStore();
  const [isClient, setIsClient] = useState(false);
  const [showReminders, setShowReminders] = useState(true);

  useEffect(() => {
    setIsClient(true);
    
    // Cargar preferencias de usuario
    if (typeof window !== "undefined") {
      try {
        const prefs = getUserPreferences();
        setShowReminders(prefs.showDashboardReminders);
      } catch (error) {
        console.error("Error loading user preferences:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadFinanceData();
    }
  }, [user, loadFinanceData]);

  // Obtener la fecha actual
  const now = new Date();
  const formattedDate = format(now, "EEEE d 'de' MMMM", { locale: es });
  const greeting = getGreeting();

  // Capitalizar primera letra
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  if (!isClient) return null;

  if (isLoading) {
    return <FinanceSkeletonLoader />;
  }

  return (
    <div className="container space-y-6 py-6">
      {/* Encabezado con saludo y fecha */}
      <div className="flex flex-col gap-4 mb-4 w-full">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {greeting}, {user?.displayName?.split(" ")[0] || "Usuario" } 👋
        </h1>
        <p className="text-muted-foreground">{capitalizedDate}</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-4 mb-4 w-full">
        {/* Recordatorios vencidos (si hay alguno) */}
        {showReminders && <DueRemindersAlert />}
      {/* Acciones rápidas */}
      <QuickActions />
      </div>


      {/* Resumen financiero */}
      <DashboardSummary />

      {/* Gráficos de categorías */}
      <CategoryCharts />

      {/* Transactions recientes */}
      <RecentTransactions />


      {/* Diálogo para añadir transacciones */}
      <FinanceFormDialog />
    </div>
  );
}
