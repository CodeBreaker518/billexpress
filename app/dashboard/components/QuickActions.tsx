"use client";

import { ArrowUp, ArrowDown, ArrowRightLeft } from "lucide-react";
import { Button } from "@bill/_components/ui/button";
import { useFinanceStore } from "@bill/_store/useFinanceStore";
import { useAccountStore } from "@bill/_store/useAccountStore";

export default function QuickActions() {
  const { handleNewIncome, handleNewExpense } = useFinanceStore();

  return (
    <div className="flex flex-col gap-3 mb-6 max-w-full">
      <h1 className="text-lg font-semibold">Acciones Rápidas</h1>
      <div className="flex flex-col sm:flex-row gap-2 w-full">
        <Button 
          variant="outline" 
          onClick={handleNewIncome} 
          className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1 sm:gap-2 w-full sm:w-auto px-2 sm:px-3"
        >
          <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
          <span className="whitespace-nowrap">Registrar Ingreso</span>
        </Button>
        <Button 
          variant="outline" 
          onClick={handleNewExpense} 
          className="text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-center justify-center gap-1 sm:gap-2 w-full sm:w-auto px-2 sm:px-3"
        >
          <ArrowDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
          <span className="whitespace-nowrap">Registrar Gasto</span>
        </Button>
      </div>
    </div>
  );
}
