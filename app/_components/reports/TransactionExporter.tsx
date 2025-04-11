"use client";

import React, { useState } from 'react';
import { Button } from '@bill/_components/ui/button';
import { Download } from 'lucide-react';
import { useIncomeStore } from '@bill/_store/useIncomeStore';
import { useExpenseStore } from '@bill/_store/useExpenseStore';
import { useAccountStore } from '@bill/_store/useAccountStore';
import { exportTransactionsToCsv } from '@bill/_lib/utils/export';
import { format, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@bill/_components/ui/use-toast';
import { DateRange } from 'react-day-picker';
import { DateRangePickerWithPresets } from '@bill/_components/ui/DateRangePickerWithPresets';

interface TransactionExporterProps {
  isLoading: boolean; // Recibir estado de carga como prop
}

export default function TransactionExporter({ isLoading }: TransactionExporterProps) {
  const { incomes } = useIncomeStore();
  const { expenses } = useExpenseStore();
  const { accounts } = useAccountStore();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const handleExport = () => {
    let filteredIncomes = incomes;
    let filteredExpenses = expenses;
    let filenameSuffix = '';
    const todayStr = format(new Date(), 'dd-MMM-yyyy', { locale: es });

    if (dateRange?.from && dateRange?.to) {
      const from = startOfDay(dateRange.from);
      const to = endOfDay(dateRange.to);
      const interval = { start: from, end: to };

      filteredIncomes = incomes.filter(income => {
        try {
          const incomeDate = income.date instanceof Date ? income.date : new Date(income.date);
          return isWithinInterval(incomeDate, interval);
        } catch { return false; }
      });
      filteredExpenses = expenses.filter(expense => {
        try {
          const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date);
          return isWithinInterval(expenseDate, interval);
        } catch { return false; }
      });
      
      const fromStr = format(from, 'dd-MMM-yyyy', { locale: es });
      const toStr = format(to, 'dd-MMM-yyyy', { locale: es });
      if (fromStr === toStr) {
        filenameSuffix = fromStr;
      } else {
        filenameSuffix = `desde_${fromStr}_a_${toStr}`;
      }
      
    } else if (dateRange?.from) {
      const from = startOfDay(dateRange.from);
      filteredIncomes = incomes.filter(income => {
         try {
          const incomeDate = income.date instanceof Date ? income.date : new Date(income.date);
          return incomeDate >= from;
        } catch { return false; }
      });
      filteredExpenses = expenses.filter(expense => {
        try {
          const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date);
          return expenseDate >= from;
        } catch { return false; }
      });
      filenameSuffix = `desde_${format(from, 'dd-MMM-yyyy', { locale: es })}`;
    } else {
      filenameSuffix = `Todo_al_${todayStr}`;
    }

    if (filteredIncomes.length === 0 && filteredExpenses.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay transacciones en el rango seleccionado para exportar.",
        variant: "warning",
      });
      return;
    }

    const filename = `BillExpress_Reporte_${filenameSuffix}.csv`;
    
    try {
      exportTransactionsToCsv(filename, filteredIncomes, filteredExpenses, accounts);
      toast({
        title: "Exportación Iniciada",
        description: `Se ha iniciado la descarga de ${filename}.`,
      });
    } catch (error) {
      console.error("Error al exportar a CSV:", error);
      toast({
        title: "Error de Exportación",
        description: "No se pudo generar el archivo CSV.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-card p-4 rounded-lg shadow-sm border space-y-4">
      <h2 className="text-lg font-semibold">Exportar Datos</h2>
      
      <DateRangePickerWithPresets 
        date={dateRange} 
        onDateChange={setDateRange} 
      />

      <p className="text-sm text-muted-foreground">
        Selecciona un rango de fechas (opcional) y descarga un archivo CSV con las transacciones correspondientes.
        Si no seleccionas rango, se exportarán todas las transacciones.
      </p>
      
      <Button 
        onClick={handleExport} 
        disabled={isLoading || (incomes.length === 0 && expenses.length === 0)}
      >
        <Download className="mr-2 h-4 w-4" />
        Exportar {dateRange?.from ? "Rango Seleccionado" : "Todo"} a CSV
      </Button>
    </div>
  );
} 