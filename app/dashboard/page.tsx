"use client";

import { useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useFinanceStore } from "@bill/_store/useFinanceStore";
import DashboardSummary from "./components/DashboardSummary";
import RecentTransactions from "./components/RecentTransactions";
import CategoryCharts from "./components/CategoryCharts";
import QuickActions from "./components/QuickActions";
import FinanceFormDialog from "@bill/_components/FinanceFormDialog";
import { FinanceSkeletonLoader } from "@bill/_components/ui/skeletons";

export default function DashboardPage() {
  const { loadFinanceData, isLoading } = useFinanceStore();

  // Cargar datos al montar la página
  useEffect(() => {
    loadFinanceData();
  }, [loadFinanceData]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <FinanceSkeletonLoader />
          </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-8">
      {/* Cabecera de la página */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {format(new Date(), "EEEE, d MMM yyyy", { locale: es })} - Resumen de tus finanzas
        </p>
      </div>

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
