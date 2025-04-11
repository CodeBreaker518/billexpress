"use client";

import React, { useState } from 'react';
import { Button } from '@bill/_components/ui/button';
import { Download } from 'lucide-react';
import { useIncomeStore } from '@bill/_store/useIncomeStore';
import { useExpenseStore } from '@bill/_store/useExpenseStore';
import { useAccountStore } from '@bill/_store/useAccountStore';
import { exportTransactionsToCsv } from '@bill/_lib/utils/csvExport';
import { exportTransactionsToPdf, SummaryData as PdfSummaryData } from '@bill/_lib/utils/pdfExport';
import { generateChartDataUrl } from '@bill/_lib/utils/chartImageGenerator';
import { format, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@bill/_components/ui/use-toast';
import { DateRange } from 'react-day-picker';
import { DateRangePickerWithPresets } from '@bill/_components/ui/DateRangePickerWithPresets';
import { Label } from "@bill/_components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@bill/_components/ui/select";
import { Info } from 'lucide-react';
import FormatInfoHint from './FormatInfoHint';
import { cn } from "@bill/_lib/utils";
import { getCategoryColors } from "@bill/_lib/utils/categoryConfig";

interface TransactionExporterProps {
  isLoading: boolean; // Recibir estado de carga como prop
}

export default function TransactionExporter({ isLoading }: TransactionExporterProps) {
  const { incomes } = useIncomeStore();
  const { expenses } = useExpenseStore();
  const { accounts } = useAccountStore();
  const { toast, dismiss } = useToast();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [exportFormat, setExportFormat] = useState('csv');

  const handleExport = async () => {
    let filteredIncomes = incomes;
    let filteredExpenses = expenses;
    let filenameSuffix = '';
    let dateRangeString = 'Todo';
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
        dateRangeString = format(from, 'dd/MM/yyyy', { locale: es });
      } else {
        filenameSuffix = `desde_${fromStr}_a_${toStr}`;
        dateRangeString = `Desde ${format(from, 'dd/MM/yyyy', { locale: es })} hasta ${format(to, 'dd/MM/yyyy', { locale: es })}`;
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
      dateRangeString = `Desde ${format(from, 'dd/MM/yyyy', { locale: es })}`;
    } else {
      filenameSuffix = `Todo_al_${todayStr}`;
      dateRangeString = `Todo (hasta ${format(new Date(), 'dd/MM/yyyy', { locale: es })})`;
    }

    if (filteredIncomes.length === 0 && filteredExpenses.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay transacciones en el rango seleccionado para exportar.",
        variant: "warning",
      });
      return;
    }

    const filenameBase = `BillExpress_Reporte_${filenameSuffix}`;
    const filename = `${filenameBase}.${exportFormat}`;

    let loadingToastId: string | undefined;
    if (exportFormat === 'pdf') {
      const { id } = toast({
        title: "Generando PDF...",
        description: "Por favor espera mientras se crea el reporte.",
      });
      loadingToastId = id;
    }

    try {
      if (exportFormat === 'csv') {
        exportTransactionsToCsv(filename, filteredIncomes, filteredExpenses, accounts);
        toast({ title: "Exportación CSV Iniciada", description: `Se ha iniciado la descarga de ${filename}.` });
      } else if (exportFormat === 'pdf') {
        const totalIncome = filteredIncomes.reduce((sum, inc) => sum + inc.amount, 0);
        const totalExpense = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const summaryData: PdfSummaryData = {
          totalIncome,
          totalExpense,
          netFlow: totalIncome - totalExpense,
          dateRange: dateRangeString,
        };

        const incomeCategoryTotals = filteredIncomes.reduce((acc, inc) => {
          acc[inc.category] = (acc[inc.category] || 0) + inc.amount;
          return acc;
        }, {} as Record<string, number>);

        const expenseCategoryTotals = filteredExpenses.reduce((acc, exp) => {
          acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
          return acc;
        }, {} as Record<string, number>);

        const incomeChartData = Object.entries(incomeCategoryTotals).map(([name, value]) => ({ name, value }));
        const expenseChartData = Object.entries(expenseCategoryTotals).map(([name, value]) => ({ name, value }));

        const incomeColors = getCategoryColors('income');
        const expenseColors = getCategoryColors('expense');

        const [incomeChartUrl, expenseChartUrl] = await Promise.all([
          generateChartDataUrl(incomeChartData, { colors: incomeColors, width: 400, height: 300 }),
          generateChartDataUrl(expenseChartData, { colors: expenseColors, width: 400, height: 300 })
        ]);

        if (loadingToastId) dismiss(loadingToastId);

        exportTransactionsToPdf(
          filename, 
          filteredIncomes, 
          filteredExpenses, 
          accounts, 
          summaryData,
          incomeChartUrl, 
          expenseChartUrl
        );
        
        toast({ title: "Reporte PDF Generado", description: `Se ha iniciado la descarga de ${filename}.` });
      }
    } catch (error) {
      console.error(`Error al exportar a ${exportFormat.toUpperCase()}:`, error);
      if (loadingToastId) dismiss(loadingToastId);
      toast({
        title: `Error de Exportación (${exportFormat.toUpperCase()})`,
        description: `No se pudo generar el archivo ${exportFormat}.`,
        variant: "destructive",
      });
    } finally {
      // Optional: Ensure dismissal if something went very wrong
      // However, the try/catch should handle most cases.
      // if (loadingToastId) dismiss(loadingToastId);
    }
  };

  const isExportDisabled = isLoading || (incomes.length === 0 && expenses.length === 0);

  return (
    <div className="bg-card p-4 rounded-lg shadow-sm border space-y-4">
      <h2 className="text-lg font-semibold">Exportar Datos</h2>
      
      <DateRangePickerWithPresets 
        date={dateRange} 
        onDateChange={setDateRange} 
      />
      
      <div className="pt-2">
        <div className="space-y-1">
          <div className="flex items-center space-x-1.5 mb-1">
            <Label htmlFor="export-format" className="text-sm font-medium">
              Formato de Exportación
            </Label>
            <FormatInfoHint />
          </div>
          <Select value={exportFormat} onValueChange={setExportFormat}>
            <SelectTrigger id="export-format" className="w-full sm:w-[240px] h-9">
              <SelectValue placeholder="Seleccionar formato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV (Datos sin Procesar)</SelectItem>
              <SelectItem value="pdf">PDF (Reporte Completo)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Selecciona un rango de fechas (opcional) y el formato de exportación.
      </p>
      
      <Button 
        onClick={handleExport} 
        disabled={isExportDisabled}
      >
        <Download className="mr-2 h-4 w-4" />
        Generar Reporte
      </Button>
    </div>
  );
} 