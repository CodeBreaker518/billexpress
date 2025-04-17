"use client";

import { useEffect } from "react";
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

export default function DashboardPage() {
  const { loadFinanceData, isLoading } = useFinanceStore();
  const { loadReminders, loading: remindersLoading } = useReminderStore();
  const { user } = useAuthStore();

  // Cargar datos al montar la página
  useEffect(() => {
    loadFinanceData();
    
    // Cargar recordatorios si hay un usuario
    if (user) {
      loadReminders(user.uid);
    }
  }, [loadFinanceData, loadReminders, user]);

  // Obtener el saludo y el nombre del usuario
  const greeting = getGreeting();
  const firstName = user?.displayName?.split(' ')[0] || "Usuario";

  if (isLoading || remindersLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold mb-6">Cargando Dashboard...</h1>
        <FinanceSkeletonLoader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabecera personalizada */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{greeting}, {firstName}! 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {format(new Date(), "EEEE, d MMM yyyy", { locale: es })} - Aquí tienes un resumen rápido.
        </p>
      </div>

      {/* Alerta de recordatorios vencidos */}
      <DueRemindersAlert />

      {/* Botones de acciones rápidas */}
      <QuickActions />

      {/* Resumen financiero */}
      <DashboardSummary />

      {/* Transacciones recientes */}
      <RecentTransactions />

      {/* Gráficos de categorías */}
      <CategoryCharts />

      {/* Diálogo de formulario (modal) */}
      <FinanceFormDialog />
    </div>
  );
}
