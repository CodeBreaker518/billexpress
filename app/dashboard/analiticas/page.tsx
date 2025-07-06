'use client';

import React, { useEffect } from 'react';
import { useFinanceStore } from '@bill/_store/useFinanceStore';
import { useIncomeStore } from '@bill/_store/useIncomeStore';
import { useExpenseStore } from '@bill/_store/useExpenseStore';
import { Skeleton } from '@bill/_components/ui/skeleton';
import TransactionExporter from '@bill/_components/reports/TransactionExporter';
import IncomeExpenseTrendChart from '@bill/_components/charts/IncomeExpenseTrendChart';
import ExpenseBreakdownChart from '@bill/_components/charts/ExpenseBreakdownChart';
import { AnaliticasSkeleton } from "@bill/_components/ui/skeletons";
import DashboardSummary from '../components/DashboardSummary';
import CategoryCharts from '../components/CategoryCharts';
import SmallRecurringExpensesChart from '@bill/_components/charts/SmallRecurringExpensesChart';
import SpendingPatternCalendar from '@bill/_components/charts/SpendingPatternCalendar';
import { Card, CardContent, CardHeader, CardTitle } from "@bill/_components/ui/card";
import { ListFilter } from 'lucide-react';

export default function ReportesPage() {
  const { loadFinanceData, isLoading } = useFinanceStore();
  const { incomes } = useIncomeStore();
  const { expenses } = useExpenseStore();

  useEffect(() => {
    if (incomes.length === 0 && expenses.length === 0) {
      console.log('ReportesPage: Datos no encontrados, iniciando carga...');
      loadFinanceData();
    }
  }, [loadFinanceData, incomes.length, expenses.length]);

  if (isLoading && incomes.length === 0 && expenses.length === 0) {
    return <AnaliticasSkeleton />;
  }

  return (
    <div className='space-y-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-semibold tracking-tight'>Analíticas</h1>
        <p className='text-sm text-muted-foreground mt-1'>Análisis detallado de tus finanzas e indicadores clave.</p>
      </div>
      
      {/* Resumen de métricas clave */}
      <DashboardSummary />
      
      {/* Gráficas por categoría */}
      <CategoryCharts />

      {/* NUEVOS GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Análisis de Gastos Hormiga */}
        <SmallRecurringExpensesChart />
        
        {/* Patrón de Gastos Diarios */}
        <SpendingPatternCalendar />
      </div>
      
      {/* Tendencia de Ingresos y Gastos */}
      <Card className="shadow-soft">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg">Tendencia de Ingresos y Gastos</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <IncomeExpenseTrendChart />
        </CardContent>
      </Card>

      {/* Distribución de Gastos */}
      <Card className="shadow-soft">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg">Distribución de Gastos por Mes</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <ExpenseBreakdownChart />
        </CardContent>
      </Card>

      {/* Exportación de datos */}
      <Card className="shadow-soft">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <ListFilter className="h-5 w-5 text-primary" />
            Exportar Datos
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <TransactionExporter isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
