'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@bill/_components/ui/card';
import { BarChart } from '@bill/_components/ui/charts'; // Usaremos el BarChart existente
import { Button } from '@bill/_components/ui/button';
import { useExpenseStore } from '@bill/_store/useExpenseStore';
import { useFinanceStore } from '@bill/_store/useFinanceStore';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, isWithinInterval, subDays, startOfYear, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { EXPENSE_CATEGORIES } from '@bill/_lib/utils/categoryConfig';

// Reutilizamos tipos y presets
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

// Estructura para datos del gráfico apilado
interface MonthlyExpenseBreakdown {
  date: string; // 'MMM yy'
  [category: string]: string | number; // Claves dinámicas para cada categoría de gasto
}

export default function ExpenseBreakdownChart() {
  const { expenses } = useExpenseStore();
  const { formatCurrency, expenseCategories } = useFinanceStore(); // Obtenemos categorías y colores
  const [selectedPresetKey, setSelectedPresetKey] = useState<PresetKey>('last12m');

  const selectedPreset = useMemo(() => PRESETS.find((p) => p.key === selectedPresetKey) || PRESETS.find((p) => p.key === 'last12m')!, [selectedPresetKey]);

  // Procesar datos para el gráfico de barras apiladas
  const chartData = useMemo(() => {
    const interval = selectedPreset.getInterval();
    const monthsInInterval = eachMonthOfInterval(interval);
    // TODO: Adaptar granularidad para "Últimos 30 días" si se desea mostrar por día

    return monthsInInterval.map((monthStart) => {
      const monthEnd = endOfMonth(monthStart);
      const monthInterval = { start: monthStart, end: monthEnd };

      // Gastos del mes actual
      const monthlyExpenses = expenses.filter((expense) => {
        try {
          const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date);
          return isWithinInterval(expenseDate, monthInterval);
        } catch {
          return false;
        }
      });

      // Agrupar por categoría y sumar
      const breakdown: Record<string, number> = {};
      for (const category of expenseCategories) {
        breakdown[category] = 0; // Inicializar todas las categorías a 0
      }
      for (const expense of monthlyExpenses) {
        if (expense.category && breakdown.hasOwnProperty(expense.category)) {
          breakdown[expense.category] += expense.amount;
        }
      }

      // Formato final para el gráfico
      const result: MonthlyExpenseBreakdown = {
        date: format(monthStart, 'MMM yy', { locale: es }),
      };
      for (const category of expenseCategories) {
        result[category] = breakdown[category];
      }
      return result;
    });
  }, [expenses, selectedPreset, expenseCategories]);

  // Determinar qué categorías tienen gastos en el periodo actual
  const activeCategoriesData = useMemo(() => {
    const categoriesWithExpenses = new Set<string>();
    chartData.forEach((monthData) => {
      expenseCategories.forEach((category) => {
        if ((monthData[category] as number) > 0) {
          categoriesWithExpenses.add(category);
        }
      });
    });

    // Filtrar la lista base para obtener solo las activas
    const activeCategories = expenseCategories.filter((cat) => categoriesWithExpenses.has(cat));

    // Obtener los colores para las categorías activas, manteniendo el orden
    const activeCategoryColors = activeCategories.map((category) => {
      const config = EXPENSE_CATEGORIES[category as keyof typeof EXPENSE_CATEGORIES];
      return config ? config.color : '#8884d8'; // Fallback color
    });

    return { activeCategories, activeCategoryColors };
  }, [chartData, expenseCategories]); // Depende de los datos calculados y la lista base

  const { activeCategories, activeCategoryColors } = activeCategoriesData;

  const valueFormatter = (number: number) => formatCurrency(number);
  // Consideramos que hay datos si existe al menos una categoría activa
  const hasData = activeCategories.length > 0;

  // --- INICIO: Logs de depuración ---
  if (process.env.NODE_ENV === 'development') {
    // Mostrar solo en desarrollo
    console.log('[ExpenseBreakdownChart] Lista de categorías base:', expenseCategories);
    console.log('[ExpenseBreakdownChart] Categorías activas en periodo:', activeCategories);
    if (chartData && chartData.length > 0) {
      console.log('[ExpenseBreakdownChart] Ejemplo de datos procesados para el primer mes (completo):', chartData[0]);
    }
    console.log('[ExpenseBreakdownChart] Colores activos ordenados:', activeCategoryColors);
  }
  // --- FIN: Logs de depuración ---

  return (
    <Card>
      <CardHeader className='flex flex-col sm:flex-row items-center justify-between space-y-1 pb-2'>
        <CardTitle className='text-base font-medium'>Desglose de Gastos Mensual ({selectedPreset.label})</CardTitle>
        <div className='w-full sm:w-auto grid grid-cols-2 sm:grid-cols-4 gap-2'>
          {PRESETS.map((preset) => (
            <Button key={preset.key} variant={selectedPresetKey === preset.key ? 'default' : 'outline'} size='sm' onClick={() => setSelectedPresetKey(preset.key)} className='h-7'>
              {preset.label.startsWith('Últimos') ? preset.label.split(' ')[1] + ' ' + preset.label.split(' ')[2] : preset.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <BarChart
            className='mt-4 h-72'
            data={chartData} // Pasamos los datos completos que incluyen todas las keys
            index='date'
            categories={activeCategories} // <-- Solo las categorías activas
            colors={activeCategoryColors} // <-- Solo los colores de las activas
            valueFormatter={valueFormatter}
            stack={true}
            yAxisWidth={65}
          />
        ) : (
          <div className='h-72 flex items-center justify-center'>
            <p className='text-center text-muted-foreground'>No hay gastos en el periodo &apos;{selectedPreset.label}&apos; para mostrar el desglose.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
