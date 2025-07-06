'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@bill/_components/ui/card';
import { Badge } from '@bill/_components/ui/badge';
import { useExpenseStore } from '@bill/_store/useExpenseStore';
import { useFinanceStore } from '@bill/_store/useFinanceStore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from 'lucide-react';

// Función para obtener color basado en intensidad (0-1)
const getIntensityColor = (intensity: number) => {
  // Escala de colores más distintiva pero manteniendo solo los niveles principales
  if (intensity === 0) return 'bg-gray-50 dark:bg-gray-800';
  if (intensity < 0.5) return 'bg-emerald-200 dark:bg-emerald-900/40'; // Gasto bajo - verde esmeralda
  return 'bg-purple-300 dark:bg-purple-800/60'; // Gasto alto - púrpura
};

interface DaySpending {
  date: Date;
  totalSpent: number;
  dayOfWeek: number;
  intensity: number;
}

const DAYS_OF_WEEK = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const SHORT_DAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

export default function SpendingPatternCalendar() {
  const { expenses } = useExpenseStore();
  const { formatCurrency } = useFinanceStore();

  // Obtener el mes actual
  const currentDate = new Date();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Calcular los gastos por día
  const spendingData = useMemo(() => {
    // Obtener todos los días del mes
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Mapear los gastos a cada día
    const dailySpending: DaySpending[] = daysInMonth.map(day => {
      // Filtrar gastos para este día
      const dayExpenses = expenses.filter(expense => {
        const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date);
        return isSameDay(expenseDate, day);
      });

      // Calcular gasto total del día
      const totalSpent = dayExpenses.reduce((sum, expense) => sum + expense.amount, 0);

      return {
        date: day,
        totalSpent,
        dayOfWeek: getDay(day),
        intensity: 0 // Se calculará después
      };
    });

    // Encontrar el gasto máximo para normalizar la intensidad
    const maxSpending = Math.max(...dailySpending.map(day => day.totalSpent), 1);

    // Calcular intensidad normalizada
    const spendingWithIntensity = dailySpending.map(day => ({
      ...day,
      intensity: day.totalSpent / maxSpending
    }));

    // Encontrar el día con mayor gasto
    const dayWithMaxSpending = [...spendingWithIntensity]
      .filter(day => day.totalSpent > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent)[0] || null;
      
    // Encontrar el día con menor gasto (que tenga gastos)
    const dayWithMinSpending = [...spendingWithIntensity]
      .filter(day => day.totalSpent > 0)
      .sort((a, b) => a.totalSpent - b.totalSpent)[0] || null;
    
    // Análisis de patrones semanales
    // Agrupar gastos por día de la semana
    const spendingByDayOfWeek = [0, 1, 2, 3, 4, 5, 6].map(dayOfWeek => {
      const daysWithThisDayOfWeek = spendingWithIntensity.filter(day => day.dayOfWeek === dayOfWeek);
      const totalSpent = daysWithThisDayOfWeek.reduce((sum, day) => sum + day.totalSpent, 0);
      const count = daysWithThisDayOfWeek.length;
      
      return {
        dayOfWeek,
        totalSpent,
        averageSpent: count > 0 ? totalSpent / count : 0,
        count
      };
    });
    
    // Encontrar el día de la semana con mayor gasto promedio
    const dayOfWeekWithMaxSpending = [...spendingByDayOfWeek]
      .filter(day => day.count > 0)
      .sort((a, b) => b.averageSpent - a.averageSpent)[0] || null;
    
    // Encontrar el día de la semana con menor gasto promedio
    const dayOfWeekWithMinSpending = [...spendingByDayOfWeek]
      .filter(day => day.count > 0 && day.averageSpent > 0)
      .sort((a, b) => a.averageSpent - b.averageSpent)[0] || null;

    return {
      dailySpending: spendingWithIntensity,
      dayWithMaxSpending,
      dayWithMinSpending,
      dayOfWeekWithMaxSpending,
      dayOfWeekWithMinSpending,
      totalMonthSpending: dailySpending.reduce((sum, day) => sum + day.totalSpent, 0)
    };
  }, [expenses, monthStart, monthEnd]);

  // Crear una matriz de semanas para mostrar el calendario
  const calendarWeeks = useMemo(() => {
    const result: DaySpending[][] = [];
    let currentWeek: DaySpending[] = [];

    // Añadir espacios vacíos para los días anteriores al primer día del mes
    const firstDay = spendingData.dailySpending[0];
    const firstDayOfWeek = firstDay ? firstDay.dayOfWeek : 0;
    
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({
        date: new Date(0), // fecha inválida para espacios vacíos
        totalSpent: 0,
        dayOfWeek: i,
        intensity: 0
      });
    }

    // Añadir todos los días del mes
    spendingData.dailySpending.forEach(day => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        result.push([...currentWeek]);
        currentWeek = [];
      }
    });

    // Añadir la última semana si tiene días
    if (currentWeek.length > 0) {
      // Rellenar con días vacíos hasta completar la semana
      while (currentWeek.length < 7) {
        currentWeek.push({
          date: new Date(0),
          totalSpent: 0,
          dayOfWeek: currentWeek.length,
          intensity: 0
        });
      }
      result.push(currentWeek);
    }

    return result;
  }, [spendingData.dailySpending]);

  return (
    <Card className="shadow-soft">
      <CardHeader className="px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Patrón de Gastos Diarios
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              Visualiza tus gastos diarios: verde (gasto bajo), morado (gasto alto)
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-blue-500 border-blue-200 bg-blue-50 dark:bg-blue-900/20 text-center">
            {format(monthStart, "MMMM yyyy", { locale: es })}
          </Badge>
        </div>
        
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        {spendingData.totalMonthSpending > 0 ? (
          <div className="space-y-5">
            {/* Calendario de calor */}
            <div className="mt-2">
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {SHORT_DAYS.map((day, i) => (
                  <div key={day} className="text-xs text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                {calendarWeeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="grid grid-cols-7 gap-1">
                    {week.map((day, dayIndex) => {
                      const isValidDate = day.date.getTime() !== 0;
                      const isToday = isValidDate && isSameDay(day.date, new Date());
                      
                      return (
                        <div
                          key={`${weekIndex}-${dayIndex}`}
                          className={`
                            relative aspect-square rounded-md flex items-center justify-center
                            ${isValidDate ? getIntensityColor(day.intensity) : 'bg-transparent'}
                            ${isToday ? 'ring-2 ring-blue-400' : ''}
                          `}
                          title={isValidDate ? `${format(day.date, 'd MMM')} - ${formatCurrency(day.totalSpent)}` : ''}
                        >
                          {isValidDate && (
                            <>
                              <span className={`text-xs ${day.totalSpent > 0 ? 'font-semibold' : ''}`}>
                                {format(day.date, 'd')}
                              </span>
                              {day.totalSpent > 0 && (
                                <span className="absolute bottom-0.5 text-[9px] font-medium">
                                  {formatCurrency(day.totalSpent).replace('$', '')}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

             {/* Leyenda */}
            <div className="flex flex-wrap justify-center items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span className="w-3 h-3 inline-block bg-gray-50 dark:bg-gray-800 rounded"></span>
              <span>Sin gastos</span>
              <span className="w-3 h-3 inline-block bg-emerald-200 dark:bg-emerald-900/40 rounded ml-2"></span>
              <span>Gasto bajo</span>
              <span className="w-3 h-3 inline-block bg-purple-300 dark:bg-purple-800/60 rounded ml-2"></span>
              <span>Gasto alto</span>
            </div>
            
            {/* Insights de patrones */}
            {spendingData.dayWithMaxSpending && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="bg-purple-100 dark:bg-purple-900/20 rounded-lg p-3">
                  <h4 className="text-sm font-medium mb-1">Día con mayor gasto:</h4>
                  <div className="flex justify-between items-center">
                    <p className="text-base font-semibold">
                      {format(spendingData.dayWithMaxSpending.date, 'EEEE d', { locale: es })}
                    </p>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                      {formatCurrency(spendingData.dayWithMaxSpending.totalSpent)}
                    </p>
                  </div>
                </div>
                
                {spendingData.dayWithMinSpending && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
                    <h4 className="text-sm font-medium mb-1">Día con menor gasto:</h4>
                    <div className="flex justify-between items-center">
                      <p className="text-base font-semibold">
                        {format(spendingData.dayWithMinSpending.date, 'EEEE d', { locale: es })}
                      </p>
                      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(spendingData.dayWithMinSpending.totalSpent)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Análisis de patrones semanales */}
            {spendingData.dayOfWeekWithMaxSpending && spendingData.dayOfWeekWithMinSpending && (
              <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <h4 className="text-sm font-medium mb-2">Patrones semanales:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start">
                    <span className="w-2 h-2 mt-1.5 mr-2 rounded-full bg-purple-400"></span>
                    <p>
                      <span className="font-medium">
                        {DAYS_OF_WEEK[spendingData.dayOfWeekWithMaxSpending.dayOfWeek]}
                      </span> es cuando más gastas en promedio 
                      <span className="font-medium ml-1 text-purple-600 dark:text-purple-400">
                        ({formatCurrency(spendingData.dayOfWeekWithMaxSpending.averageSpent)})
                      </span>
                    </p>
                  </div>
                  <div className="flex items-start">
                    <span className="w-2 h-2 mt-1.5 mr-2 rounded-full bg-emerald-400"></span>
                    <p>
                      <span className="font-medium">
                        {DAYS_OF_WEEK[spendingData.dayOfWeekWithMinSpending.dayOfWeek]}
                      </span> es cuando menos gastas en promedio
                      <span className="font-medium ml-1 text-emerald-600 dark:text-emerald-400">
                        ({formatCurrency(spendingData.dayOfWeekWithMinSpending.averageSpent)})
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
            
           
            
            <div className="bg-muted/50 rounded-lg p-3 mt-4">
              <p className="text-xs text-muted-foreground">
                <strong>Tip:</strong> Identifica los días con mayor gasto y analiza qué tipo de transacciones realizas.
                Planifica tus compras importantes, pagos de facturas o transferencias en días específicos para 
                tener un mejor control de tu flujo de efectivo y evitar desbalances en tus finanzas.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 py-6 text-center">
            <Calendar className="w-10 h-10 text-muted-foreground mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">No hay gastos registrados este mes</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 