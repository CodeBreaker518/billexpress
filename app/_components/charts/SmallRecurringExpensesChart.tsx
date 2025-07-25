'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@bill/_components/ui/card';
import { BarChart } from '@bill/_components/ui/charts';
import { Badge } from '@bill/_components/ui/badge';
import { CategoryBadge } from '@bill/_components/ui/category-badge';
import { List, ListItem } from '@bill/_components/ui/list';
import { Text } from '@bill/_components/ui/typography';
import { useExpenseStore } from '@bill/_store/useExpenseStore';
import { useFinanceStore } from '@bill/_store/useFinanceStore';
import { format, startOfMonth, endOfMonth, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { CoinsIcon, InfoIcon } from 'lucide-react';
import { EXPENSE_CATEGORIES, getCategoryConfig } from '@bill/_lib/utils/categoryConfig';
import { getUserPreferences } from '@bill/_services/userPreferences';
import Link from 'next/link';
import { useMediaQuery } from "@bill/_hooks/useMediaQuery";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@bill/_components/ui/alert-dialog";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@bill/_components/ui/tooltip";

// Frecuencia mínima para considerar un patrón
const MIN_FREQUENCY = 2;

interface AntExpenseGroup {
  category: string;
  totalAmount: number;
  count: number;
  averageAmount: number;
  examples: string[];
}

export default function SmallRecurringExpensesChart() {
  const { expenses } = useExpenseStore();
  const { formatCurrency } = useFinanceStore();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  
  // Obtener el umbral configurado por el usuario
  const userPreferences = getUserPreferences();
  const ANT_EXPENSE_THRESHOLD = userPreferences.antExpenseThreshold;
  
  // Obtener el mes actual
  const currentDate = new Date();
  const currentMonthStart = startOfMonth(currentDate);

  // Calcular los gastos hormiga
  const antExpensesData = useMemo(() => {
    // Filtrar gastos del mes actual
    const currentMonthExpenses = expenses.filter(expense => {
      const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date);
      return isSameMonth(expenseDate, currentDate);
    });

    // Filtrar gastos pequeños (bajo el umbral)
    const smallExpenses = currentMonthExpenses.filter(expense => 
      expense.amount <= ANT_EXPENSE_THRESHOLD
    );
    
    // Total de TODOS los gastos hormiga del mes (sin importar categoría o frecuencia)
    const totalAllAntExpenses = smallExpenses.reduce(
      (sum, expense) => sum + expense.amount, 0
    );

    // Agrupar por categoría
    const expensesByCategory: Record<string, AntExpenseGroup> = {};
    
    smallExpenses.forEach(expense => {
      const category = expense.category || 'Sin categoría';
      const description = expense.description || 'Sin descripción';
      
      if (!expensesByCategory[category]) {
        expensesByCategory[category] = {
          category,
          totalAmount: 0,
          count: 0,
          averageAmount: 0,
          examples: []
        };
      }
      
      expensesByCategory[category].totalAmount += expense.amount;
      expensesByCategory[category].count += 1;
      
      // Guardar ejemplos únicos de gastos (máximo 2 por categoría)
      if (expensesByCategory[category].examples.length < 2 && 
          !expensesByCategory[category].examples.includes(description)) {
        expensesByCategory[category].examples.push(description);
      }
    });
    
    // Calcular promedio y filtrar solo los que tienen frecuencia suficiente
    const significantCategories = Object.values(expensesByCategory)
      .filter(group => group.count >= MIN_FREQUENCY)
      .map(group => ({
        ...group,
        averageAmount: group.totalAmount / group.count
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
    
    // Total de gastos hormiga recurrentes (que cumplen la frecuencia mínima)
    const totalRecurringAntExpenses = significantCategories.reduce(
      (sum, group) => sum + group.totalAmount, 0
    );
    
    // Calcular proyección anual (multiplicar por 12 el gasto mensual)
    const yearlyProjection = totalAllAntExpenses * 12;
    
    // Colores para cada categoría según la configuración global
    const colorMap: Record<string, string> = {};
    const categoryData = significantCategories.slice(0, 5);
    
    // Datos para el gráfico con la misma estructura que se usa en otros gráficos
    const chartData = categoryData.map(group => {
      const displayName = group.category.length > 10 ? group.category.substring(0, 10) + '...' : group.category;
      // Obtener el color de la categoría
      const config = EXPENSE_CATEGORIES[group.category as keyof typeof EXPENSE_CATEGORIES] || EXPENSE_CATEGORIES['Otros'];
      colorMap[displayName] = config.color;
      
      // Usamos un objeto con estructura consistente para BarChart: cada categoría tiene su propio valor
      const dataPoint: Record<string, string | number> = { category: displayName };
      dataPoint[displayName] = group.totalAmount;
      return dataPoint;
    });
    
    return {
      groups: significantCategories,
      totalMonthly: totalAllAntExpenses,
      yearlyProjection,
      chartData,
      colorMap,
      smallExpensesCount: smallExpenses.length
    };
  }, [expenses, currentDate]);
  
  // Preparar datos para gráfico
  const chartData = antExpensesData.chartData;
  
  // Obtener las categorías como array de nombres (para usar como dataKeys)
  const categoryNames = chartData.map(item => item.category as string);
  
  // Crear array de colores en el mismo orden que las categorías
  const colors = useMemo(() => {
    return categoryNames.map(category => {
      return antExpensesData.colorMap[category] || '#64748b'; // Color por defecto si no se encuentra
    });
  }, [categoryNames, antExpensesData.colorMap]);

  // Contenido del tooltip/dialog
  const infoContent = (
    <p>
      El umbral para considerar un gasto como &quot;hormiga&quot; puede personalizarse en la sección de{' '}
      <Link href="/dashboard/perfil" className="text-primary font-medium hover:underline">
        Preferencias
      </Link>
    </p>
  );

  return (
    <Card className="shadow-soft">
      <CardHeader className="px-2 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2 sm:gap-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center">
              <CoinsIcon className="h-5 w-5 text-amber-500 mr-2" />
              <CardTitle className="text-base sm:text-lg">
                Análisis de Gastos Hormiga
              </CardTitle>
            </div>
            
            {isDesktop ? (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} className="cursor-help inline-flex items-center justify-center">
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right" align="start" className="max-w-[250px] sm:max-w-sm text-xs sm:text-sm p-2 sm:p-3">
                    {infoContent}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button aria-label="Información sobre gastos hormiga">
                    <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Gastos Hormiga</AlertDialogTitle>
                    <AlertDialogDescription asChild className="pt-2">
                      <div>{infoContent}</div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogAction>Entendido</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          <Badge variant="outline" className="text-amber-500 border-amber-200 bg-amber-50 dark:bg-amber-900/20 text-center">
            {format(currentMonthStart, "MMMM yyyy", { locale: es })}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <p className="text-xs sm:text-sm text-muted-foreground mb-4">
          Pequeños gastos recurrentes (menores a {formatCurrency(ANT_EXPENSE_THRESHOLD)}) que suman grandes cantidades con el tiempo.
        </p>
        {antExpensesData.smallExpensesCount > 0 ? (
          <div className="space-y-4 sm:space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <div className="flex flex-col items-center justify-center h-full py-2">
                  <div className="text-center space-y-1 sm:space-y-2">
                    <p className="text-xs sm:text-sm text-muted-foreground">Total en gastos hormiga este mes</p>
                    <p className="text-2xl sm:text-3xl font-bold text-amber-500">
                      {formatCurrency(antExpensesData.totalMonthly)}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Pequeños gastos (menos de {formatCurrency(ANT_EXPENSE_THRESHOLD)}) • {antExpensesData.smallExpensesCount} transacciones
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                      Proyección anual: {formatCurrency(antExpensesData.yearlyProjection)}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                {chartData.length > 0 ? (
                  <BarChart
                    className="h-52 sm:h-60"
                    data={chartData}
                    index="category"
                    categories={categoryNames}
                    colors={colors}
                    valueFormatter={formatCurrency}
                  />
                ) : (
                  <div className="h-52 sm:h-60 flex items-center justify-center">
                    <Text className="text-xs sm:text-sm text-muted-foreground">No hay datos suficientes</Text>
                  </div>
                )}
              </div>
            </div>
            
            {chartData.length > 0 && (
              <div className="border-t pt-2 sm:pt-3">
                <h4 className="text-xs sm:text-sm font-medium mb-1 sm:mb-2">Principales categorías:</h4>
                <List className="space-y-1 sm:space-y-2">
                  {antExpensesData.groups.slice(0, 3).map((group) => (
                    <ListItem key={group.category} className="flex items-center justify-between gap-2 border-b pb-1 sm:pb-2">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <CategoryBadge category={group.category} type="expense" showIcon={true} />
                        <Text className="text-[10px] sm:text-xs">{group.count} transacciones</Text>
                      </div>
                      <Text className="text-xs sm:text-sm font-medium">
                        {formatCurrency(group.totalAmount)}
                      </Text>
                    </ListItem>
                  ))}
                </List>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 sm:h-40 py-4 sm:py-6 text-center">
            <CoinsIcon className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground mb-2 opacity-50" />
            <Text className="text-xs sm:text-sm text-muted-foreground">No hay gastos pequeños este mes</Text>
            <Text className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              Gastos menores a {formatCurrency(ANT_EXPENSE_THRESHOLD)}
            </Text>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 