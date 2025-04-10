"use client";

import { useEffect } from "react";
import { useFinanceStore } from "@bill/_store/useFinanceStore";
import FinancialSummary from "./components/FinancialSummary";
import MonthlyEvolutionChart from "./components/MonthlyEvolutionChart";
import AccountsSection from "./components/AccountsSection";
import FinanceTabs from "./components/FinanceTabs";
import FinanceFormDialog from "./components/FinanceFormDialog";
import { FinanceSkeletonLoader } from "@bill/_components/ui/skeletons";
import QuickActions from "../components/QuickActions";

export default function FinanzasPage() {
  const { loadFinanceData, isLoading } = useFinanceStore();

  // Cargar datos al montar la página
  useEffect(() => {
    loadFinanceData();
  }, [loadFinanceData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold mb-6">Cargando Finanzas...</h1>
        <FinanceSkeletonLoader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabecera de la página */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Tu Panorama Financiero</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestiona tus cuentas, ingresos y gastos detalladamente.
        </p>
      </div>
      
      {/* Acciones rápidas */}
      <QuickActions />

      {/* Resumen financiero */}
      <FinancialSummary />

      {/* Sección de cuentas */}
      <AccountsSection />

      {/* Pestañas de ingresos y gastos */}
      <FinanceTabs />

      {/* Gráfico de evolución mensual */}
      <MonthlyEvolutionChart />

      {/* Diálogo de formulario (modal) */}
      <FinanceFormDialog />
    </div>
  );
}
