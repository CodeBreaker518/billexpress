'use client';

import { useEffect } from 'react';
import { BanknoteIcon, Receipt } from 'lucide-react';
import { useFinanceStore } from '@bill/_store/useFinanceStore';
import AccountsSection from './components/AccountsSection';
import TransactionsTable from './components/TransactionsTable';
import TransferHistory from '@bill/_components/finanzas/TransferHistory';
import FinanceFormDialog from './components/FinanceFormDialog';
import { FinanceSkeletonLoader } from '@bill/_components/ui/skeletons';
import { Button } from '@bill/_components/ui/button';

export default function FinanzasPage() {
  const { loadFinanceData, isLoading, handleNewExpense, handleNewIncome } = useFinanceStore();

  // Cargar datos al montar la página
  useEffect(() => {
    loadFinanceData();
  }, [loadFinanceData]);

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <h1 className='text-2xl font-bold mb-6'>Cargando Finanzas...</h1>
        <FinanceSkeletonLoader />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Cabecera con título y acciones principales */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 w-full">
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left w-full max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight">Finanzas</h1>
          <p className="text-sm text-muted-foreground mt-1">Registra y revisa tus ingresos y gastos.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center sm:items-end justify-center sm:justify-end">
          <Button onClick={handleNewExpense} className="w-full sm:w-auto text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-1 sm:gap-2">
            <Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="whitespace-nowrap">Registrar Gasto</span>
          </Button>
          <Button onClick={handleNewIncome} className="w-full sm:w-auto text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1 sm:gap-2">
            <BanknoteIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="whitespace-nowrap">Registrar Ingreso</span>
          </Button>
        </div>
      </div>

      {/* Sección de cuentas */}
      <AccountsSection />

      {/* Tabla de ingresos y gastos */}
      <TransactionsTable />

      {/* Tabla de transferencias */}
      <TransferHistory />

      {/* Diálogo de formulario (modal) */}
      <FinanceFormDialog />
    </div>
  );
}
