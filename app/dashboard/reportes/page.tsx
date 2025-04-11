"use client";

import React, { useEffect } from 'react';
import { useFinanceStore } from '@bill/_store/useFinanceStore';
import { useIncomeStore } from '@bill/_store/useIncomeStore';
import { useExpenseStore } from '@bill/_store/useExpenseStore';
import { Skeleton } from '@bill/_components/ui/skeleton';
import TransactionExporter from '@bill/_components/reports/TransactionExporter';

export default function ReportesPage() {
  const { loadFinanceData, isLoading } = useFinanceStore();
  const { incomes } = useIncomeStore();
  const { expenses } = useExpenseStore();

  useEffect(() => {
    if (incomes.length === 0 && expenses.length === 0) {
       loadFinanceData();
    }
  }, [loadFinanceData, incomes, expenses]);

  if (isLoading && (incomes.length === 0 && expenses.length === 0)) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="bg-card p-4 rounded-lg shadow-sm border space-y-4">
          <Skeleton className="h-6 w-40 mb-3" />
          <Skeleton className="h-9 w-full sm:w-[300px]" />
          <Skeleton className="h-4 w-full mt-2" />
          <Skeleton className="h-10 w-52 mt-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Reportes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Analiza tus finanzas y exporta tus datos por periodo.
        </p>
      </div>

      <TransactionExporter isLoading={isLoading} />

    </div>
  );
} 