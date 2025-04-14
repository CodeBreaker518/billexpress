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
  Bookmark
} from "lucide-react";
import { Button } from "@bill/_components/ui/button";
import { cn } from "@bill/_lib/utils";
import { Transaction, Reminder, CalendarItem, RecurrenceType } from "./types";

interface CalendarViewsProps {
  currentView: 'day' | 'week' | 'month' | 'year';
  viewDate: Date;
  selectedDate: Date;
  previousView: 'day' | 'week' | 'month' | 'year';
  daysToDisplay: Date[] | Array<{month: Date; days: Date[]}>;
  transactions: Transaction[];
  reminders: Reminder[];
  isMobile: boolean;
  setPreviousView: (view: 'day' | 'week' | 'month' | 'year') => void;
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
  previousView,
  daysToDisplay,
  transactions,
  reminders,
  isMobile,
  setPreviousView,
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
  
  // Renderizado de la vista día
  const renderDayView = () => {
    const items = getItemsForDay(viewDate);

    const getBackButtonText = () => {
      switch (previousView) {
        case 'week':
          return 'Volver a semana';
        case 'month':
          return 'Volver a mes';
        case 'year':
          return 'Volver a año';
        default:
          return 'Volver';
      }
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all hover:translate-x-[-2px]" 
              onClick={() => setCurrentView(previousView)}
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">{getBackButtonText()}</span>
            </Button>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {format(viewDate, "EEEE d 'de' MMMM", { locale: es })}
          </h2>
        </div>
        <div className="p-4 min-h-[50vh]">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-10">
              <CalendarIcon className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No hay elementos para este día</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setNewReminder({description: "", amount: 0, date: viewDate, recurrence: "none", endDate: null, isPayment: false});
                  setNewReminderOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar recordatorio
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <div 
                  key={item.id} 
                  className={cn(
                    "p-3 rounded-lg border flex items-center",
                    item.itemType === 'reminder' && (item as any).isCompleted ? "opacity-60" : ""
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    item.itemType === 'transaction' 
                      ? item.type === 'income' 
                        ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" 
                        : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                  )}>
                    {item.itemType === 'transaction' 
                      ? item.type === 'income' ? '+' : '-'
                      : '!'}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className={cn(
                      "font-medium",
                      item.itemType === 'reminder' && (item as any).isCompleted ? "line-through text-gray-400" : ""
                    )}>
                      {item.description}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.itemType === 'transaction' ? item.category : 'Recordatorio'}
                    </div>
                  </div>
                  <div className={cn(
                    "text-lg font-medium",
                    item.itemType === 'transaction'
                      ? item.type === 'income' ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"
                      : "text-yellow-600 dark:text-yellow-400"
                  )}>
                    ${item.amount.toFixed(2)}
                  </div>
                  {item.itemType === 'reminder' && (
                    <div className="ml-2 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleReminderStatus(item.id, !item.isCompleted);
                        }}
                        className={cn(
                          "px-2 py-1 text-xs rounded-md",
                          (item as any).isCompleted 
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        )}
                      >
                        {(item as any).isCompleted ? "Completado" : "Pendiente"}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteReminder(item.id);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"></path>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Renderizar la vista de semana
  const renderWeekView = () => {
    // Asegurar que solo trabajamos con fechas y no con la estructura de año
    const days = daysToDisplay as Date[];
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {days.map((day, i) => (
            <div key={i} className="p-1 sm:p-2 text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0">
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{format(day, isMobile ? 'EEEEEE' : 'EEEE', { locale: es })}</div>
              <div className={cn(
                "mt-1 text-sm font-semibold",
                isToday(day) && "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full w-7 h-7 mx-auto flex items-center justify-center"
              )}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 h-[50vh] sm:h-[65vh] border-b border-gray-200 dark:border-gray-700">
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
                  setPreviousView(currentView);
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
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                
                {items.length > 0 && (
                  <div className="space-y-1">
                    {items.map((item) => (
                      <div 
                        key={item.id} 
                        className={cn(
                          "p-1 text-xs rounded truncate cursor-pointer flex items-center",
                          item.itemType === 'transaction' 
                            ? item.type === 'income' 
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" 
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            : (item as any).isCompleted
                              ? "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 line-through"
                              : (item as any).isPayment
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" 
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                        )}
                        onClick={(e) => handleItemClick(e, item)}
                      >
                        <span className="flex-shrink-0 mr-1">
                          {item.itemType === 'transaction' 
                            ? item.type === 'income' ? '+' : '-'
                            : (item as any).isPayment 
                              ? <DollarSign className="h-3 w-3 text-blue-700 dark:text-blue-400" /> 
                              : <Bookmark className="h-3 w-3 text-yellow-700 dark:text-yellow-400" />}
                        </span>
                        <span className="flex-1 truncate">{item.description}</span>
                        {(item.itemType === 'transaction' || (item as any).isPayment) && 
                          <span className="flex-shrink-0 ml-1 font-medium">
                            ${item.amount.toFixed(2)}
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
    );
  };

  // Renderizar la vista de mes
  const renderMonthView = () => {
    // Asegurar que solo trabajamos con fechas y no con la estructura de año
    const days = daysToDisplay as Date[];
    const weekCount = Math.ceil(days.length / 7);
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, i) => (
            <div key={i} className="p-1 sm:p-2 text-center font-medium">
              <span className="text-xs sm:text-sm">{day}</span>
            </div>
          ))}
        </div>
        <div 
          className={cn(
            "grid grid-cols-7 auto-rows-fr border-b border-gray-200 dark:border-gray-700",
            weekCount === 4 ? "h-[45vh] sm:h-[55vh]" : weekCount === 5 ? "h-[55vh] sm:h-[65vh]" : "h-[65vh] sm:h-[75vh]"
          )}
        >
          {days.map((day, i) => {
            const items = getItemsForDay(day);
            
            return (
              <div 
                key={i} 
                className={cn(
                  "border-t border-r border-gray-200 dark:border-gray-700 first:border-t-0 last:border-r-0 p-1 overflow-hidden group",
                  !isSameMonth(day, viewDate) && "bg-gray-50 dark:bg-gray-900/20",
                  isToday(day) && "bg-blue-50 dark:bg-blue-900/10"
                )}
                onClick={() => {
                  setPreviousView(currentView);
                  setSelectedDate(day);
                  setViewDate(day);
                  setCurrentView('day');
                }}
              >
                <div className="flex justify-between items-center">
                  <span className={cn(
                    "text-xs sm:text-sm font-semibold p-1 h-5 w-5 sm:h-7 sm:w-7 flex items-center justify-center",
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
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                </div>
                <div className="mt-1 space-y-1 max-h-[80%] overflow-hidden">
                  {items.length === 0 ? (
                    <div className="h-5 sm:h-10"></div>
                  ) : (
                    <>
                      {items.slice(0, 3).map((item) => (
                        <div 
                          key={item.id} 
                          className={cn(
                            "p-0.5 sm:p-1 text-[10px] sm:text-xs rounded truncate cursor-pointer",
                            item.itemType === 'transaction' 
                              ? item.type === 'income' 
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" 
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                              : (item as any).isCompleted
                                ? "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 line-through"
                                : (item as any).isPayment
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" 
                                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                          )}
                          onClick={(e) => handleItemClick(e, item)}
                        >
                          {item.description.substring(0, isMobile ? 10 : 15)}{item.description.length > (isMobile ? 10 : 15) ? '...' : ''}
                          {(item as any).isPayment 
                            ? <DollarSign className="inline h-2.5 w-2.5 ml-1 text-blue-700 dark:text-blue-400" />
                            : item.itemType === 'reminder' && !((item as any).isCompleted) && 
                              <Bookmark className="inline h-2.5 w-2.5 ml-1 text-yellow-700 dark:text-yellow-400" />
                          }
                          {(item as any).isPayment && item.amount > 0 && <span className="ml-1">${item.amount.toFixed(0)}</span>}
                        </div>
                      ))}
                      {items.length > 3 && (
                        <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 pl-1">
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
    );
  };

  // Renderizar la vista de año
  const renderYearView = () => {
    const today = new Date();
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 12 }, (_, i) => {
          const monthDate = new Date(getYear(viewDate), i, 1);
          const monthName = format(monthDate, 'MMMM', { locale: es });
          const monthHasTransactions = transactions.some(t => 
            getMonth(t.date) === i && getYear(t.date) === getYear(viewDate)
          );
          const monthHasReminders = reminders.some(r => 
            getMonth(r.date) === i && getYear(r.date) === getYear(viewDate)
          );
          
          return (
            <div 
              key={i}
              className={cn(
                "p-4 border rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800",
                (i === getMonth(today) && getYear(today) === getYear(viewDate)) && "bg-blue-50 dark:bg-blue-900/10",
                monthHasTransactions && "border-blue-200 dark:border-blue-800",
                monthHasReminders && "border-yellow-200 dark:border-yellow-800"
              )}
              onClick={() => {
                setViewDate(monthDate);
                setCurrentView('month');
              }}
            >
              <h3 className="text-center font-medium capitalize">{monthName}</h3>
              <div className="mt-2 flex justify-center gap-2">
                {monthHasTransactions && (
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                )}
                {monthHasReminders && (
                  <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                )}
              </div>
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