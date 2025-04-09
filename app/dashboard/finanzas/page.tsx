"use client";

import { useEffect } from "react";
import { useFinanceStore } from "@bill/_store/useFinanceStore";
import FinancialSummary from "./components/FinancialSummary";
import MonthlyEvolutionChart from "./components/MonthlyEvolutionChart";
import AccountsSection from "./components/AccountsSection";
import FinanceTabs from "./components/FinanceTabs";
import FinanceFormDialog from "./components/FinanceFormDialog";
import { FinanceSkeletonLoader } from "@bill/_components/ui/skeletons";

export default function FinanzasPage() {
  const { loadFinanceData, isLoading } = useFinanceStore();

  // Cargar datos al montar la página
  useEffect(() => {
    loadFinanceData();
  }, [loadFinanceData]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-8">
        <h1 className="text-2xl font-bold mb-6">Finanzas</h1>
        <FinanceSkeletonLoader />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-8">
      <h1 className="text-2xl font-bold mb-6">Finanzas</h1>

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
