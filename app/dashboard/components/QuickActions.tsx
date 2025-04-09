"use client";

import { ArrowUp, ArrowDown, ArrowRightLeft } from "lucide-react";
import { Button } from "@bill/_components/ui/button";
import { useFinanceStore } from "@bill/_store/useFinanceStore";
import { useAccountStore } from "@bill/_store/useAccountStore";

export default function QuickActions() {
  const { handleNewIncome, handleNewExpense } = useFinanceStore();


  return (
    <div className="flex flex-col flex-wrap gap-3 mb-6">
        <h1 className="text-lg font-semibold">Acciones Rápidas</h1>
      <div className="flex items-center gap-2">
        
        <Button variant="outline" onClick={handleNewIncome} className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
        <ArrowUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        Registrar Ingreso
      </Button>
      <Button variant="outline" onClick={handleNewExpense} className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
        <ArrowDown className="h-4 w-4 text-red-600 dark:text-red-400" />
        Registrar Gasto
      </Button>
      </div>
    </div>
  );
}
