"use client";

import { useState, useEffect } from "react";
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  isToday, 
  isSameDay, 
  isSameMonth,
  getMonth,
  getYear,
  isAfter,
  isBefore,
  getDay,
  getDate,
  differenceInDays
} from "date-fns";
import { es } from "date-fns/locale";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  ArrowRight, 
  CreditCard, 
  ArrowLeft,
  AlertCircle,
  DollarSign,
  Bookmark,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  Check,
  X,
  BellRing,
  ArrowLeftRight
} from "lucide-react";
import { Button } from "@bill/_components/ui/button";
import { cn } from "@bill/_lib/utils";
import { Transaction, Reminder, CalendarItem, RecurrenceType } from "./types";
import { Badge } from "@bill/_components/ui/badge";

// Define recurrence labels in Spanish
const recurrenceLabels = {
  daily: "Diario",
  weekly: "Semanal",
  monthly: "Mensual",
  yearly: "Anual",
  none: "Sin repetición"
};

interface CalendarViewsProps {
  currentView: 'day' | 'week' | 'month' | 'year';
  viewDate: Date;
  selectedDate: Date;
  daysToDisplay: Date[] | Array<{month: Date; days: Date[]}>;
  transactions: Transaction[];
  reminders: Reminder[];
  isMobile: boolean;
  setSelectedDate: (date: Date) => void;
  setViewDate: (date: Date) => void;
  setCurrentView: (view: 'day' | 'week' | 'month' | 'year') => void;
  toggleReminderStatus: (id: string, isCompleted: boolean) => void;
  deleteReminder: (id: string) => void;
  handleItemClick: (e: React.MouseEvent, item: CalendarItem) => void;
  setNewReminder: (value: React.SetStateAction<{
    description: string; 
    amount: number; 
    date: Date;
    recurrence: RecurrenceType;
    endDate: Date | null;
    isPayment: boolean;
  }>) => void;
  setNewReminderOpen: (open: boolean) => void;
}

export const CalendarViews = ({
  currentView,
  viewDate,
  selectedDate,
  daysToDisplay,
  transactions,
  reminders,
  isMobile,
  setSelectedDate,
  setViewDate,
  setCurrentView,
  toggleReminderStatus,
  deleteReminder,
  handleItemClick,
  setNewReminder,
  setNewReminderOpen
}: CalendarViewsProps) => {
  // Funciones auxiliares
  const getTransactionsForDay = (day: Date) => {
    return transactions.filter(transaction => isSameDay(transaction.date, day));
  };

  const getRemindersForDay = (day: Date) => {
    // Filtrar recordatorios directos para este día
    const directReminders = reminders.filter(reminder => isSameDay(reminder.date, day));
    
    // Si la fecha es futura, agregar recordatorios recurrentes
    if (isAfter(day, new Date())) {
      // Buscar recordatorios recurrentes que caigan en este día
      const recurringReminders = reminders.filter(reminder => {
        // Solo considerar recordatorios recurrentes activos que no estén completados
        if (!reminder.recurrence || reminder.recurrence === "none" || reminder.isCompleted) return false;
        
        // Antes de procesar, verificar si ya existe un recordatorio directo en este día
        // que coincida con la recurrencia de este recordatorio (para evitar duplicados)
        const hasFutureDirectReminder = directReminders.some(direct => {
          // Si hay un recordatorio directo con el mismo userId y descripción, es probable
          // que sea una ocurrencia futura ya creada para este recordatorio original
          return direct.description === reminder.description && 
                 direct.userId === reminder.userId && 
                 direct.recurrence === reminder.recurrence && 
                 direct.isPayment === reminder.isPayment;
        });
        
        // Si ya existe un recordatorio directo para este día, no crear ocurrencia visual
        if (hasFutureDirectReminder) return false;
        
        // Verificar si este día es una ocurrencia futura del recordatorio
        const originalDate = new Date(reminder.date);
        let isRecurringDay = false;
        
        // Para diarios, verificar cada día
        if (reminder.recurrence === "daily") {
          // Comprobar si hay días entre la fecha original y la fecha a comprobar
          const diffDays = differenceInDays(day, originalDate);
          isRecurringDay = diffDays > 0;
        }
        // Para semanales, verificar el mismo día de la semana
        else if (reminder.recurrence === "weekly") {
          isRecurringDay = getDay(day) === getDay(originalDate) && 
                          isAfter(day, originalDate) && 
                          differenceInDays(day, originalDate) % 7 === 0;
        }
        // Para mensuales, verificar el mismo día del mes
        else if (reminder.recurrence === "monthly") {
          isRecurringDay = getDate(day) === getDate(originalDate) && 
                          (getMonth(day) > getMonth(originalDate) || 
                          getYear(day) > getYear(originalDate));
        }
        // Para anuales, verificar el mismo día del año
        else if (reminder.recurrence === "yearly") {
          isRecurringDay = getDate(day) === getDate(originalDate) && 
                          getMonth(day) === getMonth(originalDate) && 
                          getYear(day) > getYear(originalDate);
        }
        
        // Verificar fecha límite si existe
        if (isRecurringDay && reminder.endDate) {
          isRecurringDay = isBefore(day, reminder.endDate);
        }
        
        return isRecurringDay;
      });
      
      // Para cada recordatorio recurrente que aplica, crear una copia visual
      const futureRecurrences = recurringReminders.map(reminder => ({
        ...reminder,
        id: `future-${reminder.id}-${format(day, 'yyyy-MM-dd')}`,
        date: day,
        isFutureRecurrence: true // Marca para identificarlo como recurrencia futura
      }));
      
      return [...directReminders, ...futureRecurrences];
    }
    
    return directReminders;
  };

  const getItemsForDay = (day: Date) => {
    const transactionsForDay = getTransactionsForDay(day);
    const remindersForDay = getRemindersForDay(day);
    const allItems = [
      ...transactionsForDay.map(t => ({ ...t, itemType: 'transaction' as const })),
      ...remindersForDay.map(r => ({ ...r, itemType: 'reminder' as const }))
    ];
    return allItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };
  
  // Renderizar la vista de día
  const renderDayView = () => {
    const items = getItemsForDay(selectedDate);
    const today = new Date();

    return (
      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="mr-2 text-xs sm:text-sm"
              onClick={() => {
                setCurrentView('week');
              }}
            >
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Volver a Semana
            </Button>
          </div>
          
        </div>

        {items.length === 0 ? (
          <div className="text-center p-6 sm:p-8 text-gray-500 dark:text-gray-400 text-sm sm:text-base min-h-[60vh]">
            No hay eventos para este día
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3 min-h-[60vh]">
            {items.map((item) => (
              <div 
                key={item.id}
                className={cn(
                  "p-2 sm:p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow",
                  item.itemType === 'transaction' 
                    ? item.type === 'income' 
                      ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800" 
                      : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                    : (item as any).isCompleted
                      ? "bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700"
                      : "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
                )}
                onClick={(e) => {
                  // No mostramos detalles en la vista diaria
                  e.stopPropagation();
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    {item.itemType === 'transaction' ? (
                      item.type === 'income' ? (
                        <ArrowUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mt-0.5" />
                      ) : (
                        <ArrowDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mt-0.5" />
                      )
                    ) : (item as any).isCompleted ? (
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 mt-0.5" />
                    ) : (item as any).isPayment ? (
                      <div className="flex items-center space-x-1.5">
                        <BellRing className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5" />
                        <div className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-100 border border-green-400">
                          <DollarSign className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600" />
                        </div>
                      </div>
                    ) : (
                      <BellRing className="h-4 w-4 sm:h-5 sm:w-5 text-amber-700 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center">
                        <h3 className={cn(
                          "font-medium text-sm sm:text-base",
                          (item as any).isCompleted && "line-through text-gray-500 dark:text-gray-400"
                        )}>
                          {item.description}
                        </h3>
                        {(item as any).isPayment && (
                          <Badge className="ml-2 text-xs sm:text-sm bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 hover:bg-green-100 hover:text-green-800 border border-green-400">
                            <div className="flex items-center space-x-1">
                              <BellRing className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600" />
                              <DollarSign className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600" />
                            </div>
                            Pago
                          </Badge>
                        )}
                        {item.itemType === 'reminder' && !(item as any).isPayment && (
                          <Badge className="ml-2 text-xs sm:text-sm bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 hover:bg-amber-100 hover:text-amber-800 border border-amber-300">
                            <BellRing className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 text-amber-700" />
                            Recordatorio
                          </Badge>
                        )}
                      </div>
                      {(item as Reminder).recurrence && (item as Reminder).recurrence !== "none" && 
                        <Badge
                          className="ml-2 mt-1 text-xs"
                          variant="outline"
                        >
                          {recurrenceLabels[(item as Reminder).recurrence as keyof typeof recurrenceLabels] || 'No recurrente'}
                        </Badge>
                      }
                    </div>
                  </div>
                  <div className="text-right">
                    {item.amount > 0 && (
                      <span className={cn(
                        "font-semibold text-sm sm:text-base",
                        item.itemType === 'transaction'
                          ? item.type === 'income'
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-red-600 dark:text-red-400"
                          : (item as any).isPayment
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-800 dark:text-gray-200"
                      )}>
                        {item.itemType === 'transaction' && item.type === 'expense' ? '-' : ''}
                        ${item.amount.toFixed(0)}
                      </span>
                    )}
                    {item.itemType === 'reminder' && (
                      <div className="mt-1">
                        {!(item as any).isCompleted ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs sm:text-sm h-7 sm:h-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleReminderStatus(item.id, !item.isCompleted);
                            }}
                          >
                            <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline ml-1">Completar</span>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs sm:text-sm h-7 sm:h-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleReminderStatus(item.id, !item.isCompleted);
                            }}
                          >
                            <X className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline ml-1">Deshacer</span>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Renderizar la vista de semana
  const renderWeekView = () => {
    // Asegurar que solo trabajamos con fechas y no con la estructura de año
    const days = daysToDisplay as Date[];
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs sm:text-sm"
            onClick={() => {
              setCurrentView('month');
            }}
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            Volver a Mes
          </Button>
          {isMobile && (
            <div className="text-[10px] text-gray-400 flex items-center">
              <ArrowLeft className="h-3 w-3 mr-1" />
              Desliza
              <ArrowRight className="h-3 w-3 ml-1" />
            </div>
          )}
        </div>
        <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          <div className="grid grid-cols-7 min-w-[700px]">
            {/* Day headers */}
            <div className="col-span-7 grid grid-cols-7 text-center border-b border-gray-200 dark:border-gray-700">
              {days.map((day, i) => (
                <div key={i} className="p-1 sm:p-2 text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0">
                  <div className="text-xs sm:text-sm font-medium">{format(day, 'E', { locale: es })}</div>
                  <div className={cn(
                    "flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 mx-auto rounded-full text-xs sm:text-sm font-semibold",
                    isToday(day) ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-100" : "text-gray-700 dark:text-gray-300"
                  )}>
                    {format(day, 'd', { locale: es })}
                  </div>
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="col-span-7 grid grid-cols-7 h-[50vh] sm:h-[60vh] md:h-[70vh]">
              {days.map((day, i) => {
                const items = getItemsForDay(day);
                
                return (
                  <div 
                    key={i} 
                    className={cn(
                      "border-r border-gray-200 dark:border-gray-700 last:border-r-0 p-1 group",
                      !isSameMonth(day, viewDate) && "bg-gray-50 dark:bg-gray-900/20",
                      isToday(day) && "bg-blue-50 dark:bg-blue-900/10",
                      items.length > 0 && "overflow-y-auto"
                    )}
                    onClick={() => {
                      setSelectedDate(day);
                      setViewDate(day);
                      setCurrentView('day');
                    }}
                  >
                    <div className="flex justify-end mb-1">
                      <button 
                        className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewReminder({description: "", amount: 0, date: day, recurrence: "none", endDate: null, isPayment: false});
                          setNewReminderOpen(true);
                        }}
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                    
                    {items.length > 0 && (
                      <div className="space-y-1">
                        {items.map((item) => (
                          <div 
                            key={item.id} 
                            className={cn(
                              "py-0.5 px-1 text-[9px] sm:text-xs rounded truncate cursor-pointer flex items-center",
                              item.itemType === 'transaction' 
                                ? item.type === 'income' 
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" 
                                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                : (item as any).isCompleted
                                  ? "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 line-through"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                            )}
                            onClick={(e) => handleItemClick(e, item)}
                          >
                            <span className="flex-shrink-0 mr-1">
                              {item.itemType === 'transaction' 
                                ? item.type === 'income' ? <ArrowUp className="h-2 w-2 sm:h-3 sm:w-3 text-blue-600" /> : <ArrowDown className="h-2 w-2 sm:h-3 sm:w-3 text-red-600" />
                                : (item as any).isPayment 
                                  ? <div className="inline-flex items-center space-x-1">
                                      <BellRing className="h-2 w-2 sm:h-3 sm:w-3 text-green-700 dark:text-green-500" />
                                      <div className="inline-flex items-center justify-center w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-200 border border-green-500">
                                        <DollarSign className="h-1.5 w-1.5 sm:h-2 sm:w-2 text-green-700 dark:text-green-500" />
                                      </div>
                                    </div>
                                  : <BellRing className="h-2 w-2 sm:h-3 sm:w-3 text-amber-700 dark:text-amber-400" />}
                            </span>
                            <span className="flex-1 truncate">{item.description.substring(0, isMobile ? 8 : 12)}{item.description.length > (isMobile ? 8 : 12) ? '...' : ''}</span>
                            {(item.itemType === 'transaction' || (item as any).isPayment) && item.amount > 0 && 
                              <span className="flex-shrink-0 ml-1 font-medium text-[9px] sm:text-xs">
                                ${item.amount.toFixed(0)}
                              </span>
                            }
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar la vista de mes
  const renderMonthView = () => {
    // Asegurar que solo trabajamos con fechas y no con la estructura de año
    const days = daysToDisplay as Date[];
    const weekCount = Math.ceil(days.length / 7);
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs sm:text-sm"
            onClick={() => {
              setCurrentView('year');
            }}
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            Volver a Año
          </Button>
          {isMobile && (
            <div className="text-[10px] text-gray-400 flex items-center">
              <ArrowLeft className="h-3 w-3 mr-1" />
              Desliza
              <ArrowRight className="h-3 w-3 ml-1" />
            </div>
          )}
        </div>
        <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          <div className="grid grid-cols-7 min-w-[700px]">
            {/* Day headers */}
            <div className="col-span-7 grid grid-cols-7 text-center border-b border-gray-200 dark:border-gray-700">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, i) => (
                <div key={i} className="p-1 sm:p-2 text-center font-medium">
                  <span className="text-xs sm:text-sm">{day}</span>
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="col-span-7 grid grid-cols-7 grid-rows-6 auto-rows-fr h-[50vh] sm:h-[60vh] md:h-[70vh]">
              {days.map((day, i) => {
                const items = getItemsForDay(day);
                
                return (
                  <div 
                    key={i} 
                    className={cn(
                      "border-t border-r border-gray-200 dark:border-gray-700 first:border-t-0 last:border-r-0 p-0.5 sm:p-1 overflow-hidden group",
                      !isSameMonth(day, viewDate) && "bg-gray-50 dark:bg-gray-900/20",
                      isToday(day) && "bg-blue-50 dark:bg-blue-900/10"
                    )}
                    onClick={() => {
                      setSelectedDate(day);
                      setViewDate(day);
                      setCurrentView('week');
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span className={cn(
                        "text-[10px] sm:text-xs font-semibold p-0.5 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center",
                        isToday(day) && "bg-blue-500 text-white rounded-full"
                      )}>
                        {format(day, 'd')}
                      </span>
                      <button 
                        className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewReminder({description: "", amount: 0, date: day, recurrence: "none", endDate: null, isPayment: false});
                          setNewReminderOpen(true);
                        }}
                      >
                        <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      </button>
                    </div>
                    <div className="mt-0.5 space-y-0.5 max-h-[80%] overflow-hidden">
                      {items.length === 0 ? (
                        <div className="h-3 sm:h-6"></div>
                      ) : (
                        <>
                          {items.slice(0, 3).map((item) => (
                            <div 
                              key={item.id} 
                              className={cn(
                                "p-0.5 text-[9px] sm:text-xs rounded truncate cursor-pointer flex items-center",
                                item.itemType === 'transaction' 
                                  ? item.type === 'income' 
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" 
                                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                  : (item as any).isCompleted
                                    ? "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 line-through"
                                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                              )}
                              onClick={(e) => handleItemClick(e, item)}
                            >
                              <span className="flex-shrink-0 mr-0.5">
                                {item.itemType === 'transaction' 
                                  ? item.type === 'income' ? <ArrowUp className="h-2 w-2 sm:h-3 sm:w-3 text-blue-600" /> : <ArrowDown className="h-2 w-2 sm:h-3 sm:w-3 text-red-600" />
                                  : (item as any).isPayment 
                                    ? <div className="inline-flex items-center space-x-0.5">
                                        <BellRing className="h-2 w-2 sm:h-3 sm:w-3 text-green-700 dark:text-green-500" />
                                        <div className="inline-flex items-center justify-center w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-200 border border-green-500">
                                          <DollarSign className="h-1.5 w-1.5 sm:h-2 sm:w-2 text-green-700 dark:text-green-500" />
                                        </div>
                                      </div>
                                    : <BellRing className="h-2 w-2 sm:h-3 sm:w-3 text-amber-700 dark:text-amber-400" />}
                              </span>
                              <span className="flex-1 truncate">{item.description.substring(0, isMobile ? 8 : 12)}{item.description.length > (isMobile ? 8 : 12) ? '...' : ''}</span>
                              {(item.itemType === 'transaction' || (item as any).isPayment) && item.amount > 0 && 
                                <span className="flex-shrink-0 ml-0.5 font-medium text-[9px] sm:text-xs">
                                  ${item.amount.toFixed(0)}
                                </span>
                              }
                            </div>
                          ))}
                          {items.length > 3 && (
                            <div className="text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 pl-0.5">
                              {items.length - 3} más...
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar la vista de año
  const renderYearView = () => {
    const today = new Date();
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 min-h-[60vh]">
        {Array.from({ length: 12 }, (_, i) => {
          const monthDate = new Date(getYear(viewDate), i, 1);
          const monthName = format(monthDate, 'MMMM', { locale: es });
          
          // Contar elementos por tipo
          const incomesInMonth = transactions.filter(t => 
            getMonth(t.date) === i && 
            getYear(t.date) === getYear(viewDate) &&
            t.type === 'income'
          );
          
          const expensesInMonth = transactions.filter(t => 
            getMonth(t.date) === i && 
            getYear(t.date) === getYear(viewDate) &&
            t.type === 'expense'
          );
          
          // Para detectar transferencias, buscamos en la categoría o la descripción
          const transfersInMonth = transactions.filter(t => 
            getMonth(t.date) === i &&
            getYear(t.date) === getYear(viewDate) &&
            ((t as any).type === 'transfer' || 
             t.category?.toLowerCase().includes('transfer') ||
             t.description.toLowerCase().includes('transfer'))
          );
          
          // Combinar todos los recordatorios en un grupo
          const allRemindersInMonth = reminders.filter(r => 
            getMonth(r.date) === i && getYear(r.date) === getYear(viewDate)
          );
          
          const hasContent = incomesInMonth.length > 0 || expensesInMonth.length > 0 || 
                             transfersInMonth.length > 0 || allRemindersInMonth.length > 0;
          
          return (
            <div 
              key={i}
              className={cn(
                "p-2 sm:p-3 border rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 text-center",
                (i === getMonth(today) && getYear(today) === getYear(viewDate)) && "bg-blue-50 dark:bg-blue-900/10",
                hasContent && "ring-1 ring-gray-200 dark:ring-gray-700"
              )}
              onClick={() => {
                setViewDate(monthDate);
                setCurrentView('month');
              }}
            >
              <h3 className="text-xs sm:text-sm font-medium capitalize mb-2">{monthName}</h3>
              
              {hasContent ? (
                <div className="flex justify-center gap-2 sm:gap-3">
                  {incomesInMonth.length > 0 && (
                    <div className="flex items-center">
                      <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                    </div>
                  )}
                  {expensesInMonth.length > 0 && (
                    <div className="flex items-center">
                      <ArrowDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                    </div>
                  )}
                  {transfersInMonth.length > 0 && (
                    <div className="flex items-center">
                      <ArrowLeftRight className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                    </div>
                  )}
                  {allRemindersInMonth.length > 0 && (
                    <div className="flex items-center">
                      <BellRing className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-4 sm:h-5"></div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Renderizar la vista actual
  return (
    <div className="transition-all duration-300 ease-in-out">
      {currentView === 'day' && (
        <div className="animate-fade-in">
          {renderDayView()}
        </div>
      )}
      {currentView === 'week' && (
        <div className="animate-fade-in">
          {renderWeekView()}
        </div>
      )}
      {currentView === 'month' && (
        <div className="animate-fade-in">
          {renderMonthView()}
        </div>
      )}
      {currentView === 'year' && (
        <div className="animate-fade-in">
          {renderYearView()}
        </div>
      )}
    </div>
  );
};

export default CalendarViews; 