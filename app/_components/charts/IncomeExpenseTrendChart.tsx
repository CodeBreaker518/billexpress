'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@bill/_components/ui/card';
import { LineChart } from '@bill/_components/ui/charts';
import { Button } from '@bill/_components/ui/button';
import { useIncomeStore } from '@bill/_store/useIncomeStore';
import { useExpenseStore } from '@bill/_store/useExpenseStore';
import { useFinanceStore } from '@bill/_store/useFinanceStore'; // Para formatCurrency
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, isWithinInterval, subDays, startOfYear, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

// Define la estructura de datos para el gráfico
interface MonthlyData {
  date: string; // Formato 'MMM yy' o 'dd MMM' para rangos cortos
  Ingresos: number;
  Gastos: number;
  [key: string]: string | number; // Añadir firma de índice para compatibilidad
}

// Definir los presets
type PresetKey = 'last30d' | 'last6m' | 'last12m' | 'ytd';

interface Preset {
  key: PresetKey;
  label: string;
  getInterval: () => { start: Date; end: Date };
}

const PRESETS: Preset[] = [
  {
    key: 'last30d',
    label: 'Últimos 30 días',
    getInterval: () => ({ start: startOfDay(subDays(new Date(), 29)), end: endOfDay(new Date()) }),
  },
  {
    key: 'last6m',
    label: 'Últimos 6 meses',
    getInterval: () => ({ start: startOfMonth(subMonths(new Date(), 5)), end: endOfMonth(new Date()) }),
  },
  {
    key: 'last12m',
    label: 'Últimos 12 meses',
    getInterval: () => ({ start: startOfMonth(subMonths(new Date(), 11)), end: endOfMonth(new Date()) }),
  },
  {
    key: 'ytd',
    label: 'Año Actual',
    getInterval: () => ({ start: startOfYear(new Date()), end: endOfMonth(new Date()) }),
  },
];

export default function IncomeExpenseTrendChart() {
  const { incomes } = useIncomeStore();
  const { expenses } = useExpenseStore();
  const { formatCurrency } = useFinanceStore();
  const [selectedPresetKey, setSelectedPresetKey] = useState<PresetKey>('last12m'); // Estado para el preset

  // Encontrar el preset seleccionado
  const selectedPreset = useMemo(() => PRESETS.find((p) => p.key === selectedPresetKey) || PRESETS.find((p) => p.key === 'last12m')!, [selectedPresetKey]);

  // Calcular el intervalo y los datos del gráfico usando useMemo
  const chartData = useMemo(() => {
    const interval = selectedPreset.getInterval();
    const monthsInInterval = eachMonthOfInterval(interval);
    // TODO: Adaptar para mostrar días si el rango es corto (ej. last30d)
    // Por ahora, siempre agrupa por mes

    console.log(`Calculando datos para: ${selectedPreset.label}`, interval);

    return monthsInInterval.map((monthStart) => {
      const monthEnd = endOfMonth(monthStart);
      const monthInterval = { start: monthStart, end: monthEnd };

      const monthlyIncome = incomes
        .filter((income) => {
          try {
            const incomeDate = income.date instanceof Date ? income.date : new Date(income.date);
            return isWithinInterval(incomeDate, monthInterval);
          } catch {
            return false;
          }
        })
        .reduce((sum, income) => sum + income.amount, 0);

      const monthlyExpense = expenses
        .filter((expense) => {
          try {
            const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date);
            return isWithinInterval(expenseDate, monthInterval);
          } catch {
            return false;
          }
        })
        .reduce((sum, expense) => sum + expense.amount, 0);

      return {
        date: format(monthStart, 'MMM yy', { locale: es }),
        Ingresos: monthlyIncome,
        Gastos: monthlyExpense,
      };
    });
  }, [incomes, expenses, selectedPreset]); // Recalcular si cambian los datos o el preset

  const valueFormatter = (number: number) => formatCurrency(number);

  const hasData = chartData.some((d) => d.Ingresos > 0 || d.Gastos > 0);

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-base font-medium'>Tendencia Ingresos vs. Gastos ({selectedPreset.label})</CardTitle>
        {/* Botones de Preset */}
        <div className='flex items-center space-x-1'>
          {PRESETS.map((preset) => (
            <Button key={preset.key} variant={selectedPresetKey === preset.key ? 'default' : 'outline'} size='sm' onClick={() => setSelectedPresetKey(preset.key)} className='h-7'>
              {preset.label.startsWith('Últimos') ? preset.label.split(' ')[1] + ' ' + preset.label.split(' ')[2] : preset.label} {/* Acortar etiquetas */}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <LineChart
            className='mt-4 h-72'
            data={chartData}
            index='date'
            categories={['Ingresos', 'Gastos']}
            colors={['#3b82f6', '#ef4444']}
            valueFormatter={valueFormatter}
            yAxisWidth={65}
            showLegend={true}
            curveType='monotone'
          />
        ) : (
          <div className='h-72 flex items-center justify-center'>
            <p className='text-center text-muted-foreground'>No hay datos suficientes en el periodo "{selectedPreset.label}" para mostrar la tendencia.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
