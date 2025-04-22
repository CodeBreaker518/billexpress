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
        <p className='text-sm text-muted-foreground mt-1'>Analiza tus finanzas y exporta tus datos por periodo.</p>
      </div>

      <IncomeExpenseTrendChart />

      <ExpenseBreakdownChart />

      <TransactionExporter isLoading={isLoading} />
    </div>
  );
}
