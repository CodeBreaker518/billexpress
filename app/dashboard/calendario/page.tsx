"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear,
  endOfYear,
  eachDayOfInterval, 
  eachMonthOfInterval,
  isToday, 
  isSameDay, 
  isSameMonth,
  addDays,
  addMonths,
  addYears,
  subDays,
  subMonths,
  subYears,
  getMonth,
  getYear
} from "date-fns";
import { es } from "date-fns/locale";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  ArrowRight, 
  PiggyBank, 
  CreditCard, 
  AlertCircle,
  Filter,
  ArrowLeft
} from "lucide-react";
import { useAuthStore } from "@bill/_store/useAuthStore";
import { useExpenseStore } from "@bill/_store/useExpenseStore";
import { useIncomeStore } from "@bill/_store/useIncomeStore";
import { useAccountStore } from "@bill/_store/useAccountStore";
import { useFinanceStore } from "@bill/_store/useFinanceStore";
import { useReminderStore } from "@bill/_store/useReminderStore";
import { Button } from "@bill/_components/ui/button";
import { Dialog } from "@bill/_components/ui/dialog";
import { toast } from "@bill/_components/ui/use-toast";
import { cn } from "@bill/_lib/utils";
import { CalendarViews } from "@bill/_components/calendar/CalendarViews";
import { CalendarControls } from "@bill/_components/calendar/CalendarControls";
import { ReminderDialog } from "@bill/_components/calendar/ReminderDialog";
import { DetailCard } from "@bill/_components/calendar/DetailCard";
import { RecurrenceType, Reminder } from "@bill/_components/calendar/types";

interface Transaction {
  id: string;
  date: Date;
  amount: number;
  description: string;
  category: string;
  type: 'expense' | 'income';
}

interface SelectedItemDetail {
  item: (Transaction & { itemType: 'transaction' }) | (Reminder & { itemType: 'reminder' });
  position: {
    x: number;
    y: number;
  };
  isRightSide?: boolean;
}

type CalendarView = 'day' | 'week' | 'month' | 'year';

export default function CalendarioPage() {
  // Estado para la fecha seleccionada y la vista actual
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [currentView, setCurrentView] = useState<CalendarView>('month');
  const [previousView, setPreviousView] = useState<CalendarView>('month');
  const [viewDate, setViewDate] = useState<Date>(today);
  const [windowWidth, setWindowWidth] = useState(0);
  const isMobile = windowWidth > 0 && windowWidth < 640;
  
  // Nuevo estado para el detalle seleccionado
  const [selectedItemDetail, setSelectedItemDetail] = useState<SelectedItemDetail | null>(null);

  // Estados para datos y recordatorios
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [newReminderOpen, setNewReminderOpen] = useState(false);
  const [newReminder, setNewReminder] = useState<{
    description: string;
    amount: number;
    date: Date;
    recurrence: RecurrenceType;
    endDate: Date | null;
    isPayment: boolean;
  }>({
    description: "",
    amount: 0,
    date: new Date(),
    recurrence: "none",
    endDate: null,
    isPayment: false
  });
  
  // Obtener datos desde los stores
  const { user } = useAuthStore();
  const { expenses, loading: expensesLoading } = useExpenseStore();
  const { incomes, loading: incomesLoading } = useIncomeStore();
  const { accounts, loading: accountsLoading } = useAccountStore();
  const { loadFinanceData, isLoading: financeLoading } = useFinanceStore();
  const { 
    reminders, 
    loading: remindersLoading, 
    loadReminders, 
    addReminder, 
    toggleReminderStatus, 
    deleteReminder 
  } = useReminderStore();

  // Efecto para detectar el ancho de la ventana
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    // Establecer el ancho inicial
    setWindowWidth(window.innerWidth);
    
    // Agregar listener para redimensiones
    window.addEventListener('resize', handleResize);
    
    // Limpiar
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Usar useFinanceStore para cargar todos los datos necesarios
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      // Usar loadFinanceData para cargar todos los datos de una vez
      await loadFinanceData();
      
      // Cargar los recordatorios desde Firebase
      await loadReminders(user.uid);
      
      // Procesar los datos una vez disponibles
      // Convertir gastos a transacciones
      const expensesTransactions = expenses.map(expense => ({
        id: expense.id,
        date: new Date(expense.date),
        amount: expense.amount,
        description: expense.description,
        category: expense.category,
        type: 'expense' as const
      }));

      // Convertir ingresos a transacciones
      const incomesTransactions = incomes.map(income => ({
        id: income.id,
        date: new Date(income.date),
        amount: income.amount,
        description: income.description,
        category: income.category,
        type: 'income' as const
      }));

      // Combinar y ordenar transacciones por fecha
      const allTransactions = [...expensesTransactions, ...incomesTransactions]
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      setTransactions(allTransactions);
    };

    loadData();
  }, [user, expenses, incomes, accounts, loadFinanceData, loadReminders]);

  // Toggle estado del recordatorio (completado/pendiente)
  const handleToggleReminderStatus = async (id: string, isCompleted: boolean) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para gestionar recordatorios",
        variant: "destructive",
      });
      return;
    }

    // Si estamos intentando marcar como completado un recordatorio con fecha futura
    if (isCompleted) {
      const reminder = reminders.find(r => r.id === id);
      if (reminder) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const reminderDate = new Date(reminder.date);
        reminderDate.setHours(0, 0, 0, 0);
        
        if (reminderDate > today) {
          toast({
            title: "No permitido",
            description: "No puedes completar un recordatorio con fecha futura",
            variant: "destructive",
          });
          return;
        }
      }
    }

    const success = await toggleReminderStatus(id, isCompleted);
    if (success) {
      toast({
        title: isCompleted ? "Recordatorio completado" : "Recordatorio pendiente",
        description: isCompleted ? "El recordatorio se ha marcado como completado" : "El recordatorio se ha marcado como pendiente"
      });
    } else {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del recordatorio",
        variant: "destructive"
      });
    }
  };

  // Agregar un nuevo recordatorio
  const handleAddReminder = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para crear recordatorios",
        variant: "destructive",
      });
      return;
    }

    if (!newReminder.description) {
      toast({
        title: "Error",
        description: "La descripción no puede estar vacía",
        variant: "destructive",
      });
      return;
    }

    // Solo validar el monto cuando es un recordatorio de pago
    if (newReminder.isPayment && newReminder.amount <= 0) {
      toast({
        title: "Error",
        description: "El monto debe ser mayor a cero",
        variant: "destructive",
      });
      return;
    }

    const reminderData = {
      description: newReminder.description,
      amount: newReminder.isPayment ? newReminder.amount : 0, // Asegurar que siempre haya un valor válido
      date: newReminder.date,
      isCompleted: false,
      userId: user.uid,
      recurrence: newReminder.recurrence,
      endDate: newReminder.endDate,
      isPayment: newReminder.isPayment
    };

    const result = await addReminder(reminderData);
    
    if (result) {
      setNewReminderOpen(false);
      setNewReminder({
        description: "",
        amount: 0,
        date: new Date(),
        recurrence: "none",
        endDate: null,
        isPayment: false
      });

      toast({
        title: "Recordatorio creado",
        description: "Se ha agregado un nuevo recordatorio"
      });
    } else {
      toast({
        title: "Error",
        description: "No se pudo crear el recordatorio",
        variant: "destructive"
      });
    }
  };

  // Eliminar un recordatorio
  const handleDeleteReminder = async (id: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para gestionar recordatorios",
        variant: "destructive",
      });
      return;
    }

    // Verificar si es un recordatorio recurrente
    const reminderToDelete = reminders.find(r => r.id === id);
    if (!reminderToDelete) return;

    const isRecurrent = reminderToDelete.recurrence && reminderToDelete.recurrence !== "none";
    
    // Eliminar sin pedir confirmación
    const success = await deleteReminder(id);
    if (success) {
      toast({
        title: isRecurrent ? "Serie dada de baja" : "Recordatorio eliminado",
        description: isRecurrent 
          ? "Se han eliminado todos los recordatorios relacionados" 
          : "El recordatorio ha sido eliminado"
      });
    } else {
      toast({
        title: "Error",
        description: "No se pudo eliminar el recordatorio",
        variant: "destructive"
      });
    }
  };

  // Navegar entre fechas
  const goToNextPeriod = () => {
    if (currentView === 'day') setViewDate(addDays(viewDate, 1));
    else if (currentView === 'week') setViewDate(addDays(viewDate, 7));
    else if (currentView === 'month') setViewDate(addMonths(viewDate, 1));
    else if (currentView === 'year') setViewDate(addYears(viewDate, 1));
  };

  const goToPreviousPeriod = () => {
    if (currentView === 'day') setViewDate(subDays(viewDate, 1));
    else if (currentView === 'week') setViewDate(subDays(viewDate, 7));
    else if (currentView === 'month') setViewDate(subMonths(viewDate, 1));
    else if (currentView === 'year') setViewDate(subYears(viewDate, 1));
  };

  const goToToday = () => {
    setViewDate(today);
  };

  // Calcular días para la vista actual
  const daysToDisplay = useMemo(() => {
    switch (currentView) {
      case 'day':
        return [viewDate];
      case 'week':
        return eachDayOfInterval({
          start: startOfWeek(viewDate, { weekStartsOn: 1 }),
          end: endOfWeek(viewDate, { weekStartsOn: 1 })
        });
      case 'month':
        const monthStart = startOfMonth(viewDate);
        const monthEnd = endOfMonth(viewDate);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
        return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
      case 'year':
        const yearStart = startOfYear(viewDate);
        const yearEnd = endOfYear(viewDate);
        const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
        return months.map(month => {
          return {
            month,
            days: eachDayOfInterval({
              start: startOfMonth(month),
              end: endOfMonth(month)
            })
          };
        });
      default:
        return [viewDate];
    }
  }, [viewDate, currentView]);

  // Obtener transacciones para un día específico
  const getTransactionsForDay = (day: Date) => {
    return transactions.filter(transaction => isSameDay(transaction.date, day));
  };

  // Obtener recordatorios para un día específico
  const getRemindersForDay = (day: Date) => {
    return reminders.filter(reminder => isSameDay(new Date(reminder.date), day));
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

  // Modificar la función de manejo de clicks en elementos
  const handleItemClick = (e: React.MouseEvent, item: any) => {
    e.stopPropagation(); // Evitar que se propague al día
    
    // Calcular posición para la tarjeta informativa
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Determinar si el elemento está en la mitad derecha de la pantalla
    const isRightSide = rect.left > windowWidth / 2;
    
    // En móvil, centrar en pantalla, en escritorio, alinear según la posición
    let position;
    if (isMobile) {
      position = {
        x: windowWidth / 2,
        y: Math.min(rect.bottom + window.scrollY, window.innerHeight / 2)
      };
    } else {
      position = {
        // Si está en la mitad derecha, alinear a la izquierda del elemento
        // Si está en la mitad izquierda, alinear a la derecha del elemento
        x: isRightSide ? rect.left - 10 : rect.right + 10,
        y: rect.bottom + window.scrollY
      };
    }
    
    setSelectedItemDetail({ 
      item, 
      position,
      isRightSide 
    });
  };

  // Función para cerrar el detalle
  const closeItemDetail = () => {
    setSelectedItemDetail(null);
  };

  // Renderizar el título del período actual
  const renderPeriodTitle = () => {
    switch (currentView) {
      case 'day':
        return format(viewDate, "EEEE d 'de' MMMM", { locale: es });
      case 'week': {
        const weekStart = startOfWeek(viewDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(viewDate, { weekStartsOn: 1 });
        
        if (getMonth(weekStart) !== getMonth(weekEnd)) {
          return `${format(weekStart, "d MMM", { locale: es })} - ${format(weekEnd, "d MMM", { locale: es })}`;
        }
        
        return `${format(weekStart, "d")} - ${format(weekEnd, "d 'de' MMMM", { locale: es })}`;
      }
      case 'month':
        return format(viewDate, "MMMM yyyy", { locale: es });
      case 'year':
        return format(viewDate, "yyyy");
      default:
        return "";
    }
  };

  // Determinar si la aplicación está cargando
  const isLoading = expensesLoading || incomesLoading || accountsLoading || financeLoading || remindersLoading;

  const resetNewReminder = () => {
    setNewReminder({
      description: "",
      amount: 0,
      date: new Date(),
      recurrence: "none",
      endDate: null,
      isPayment: false
    });
    setCurrentView("week");
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col xl:flex-row space-y-6 xl:space-y-0 xl:space-x-6">
        <div className="flex-1">
          {/* Controles del calendario */}
          <CalendarControls 
            currentView={currentView}
            viewDate={viewDate}
            isMobile={isMobile}
            goToPreviousPeriod={goToPreviousPeriod}
            goToNextPeriod={goToNextPeriod}
            goToToday={goToToday}
            setCurrentView={setCurrentView}
            setNewReminder={setNewReminder}
            setNewReminderOpen={setNewReminderOpen}
            renderPeriodTitle={renderPeriodTitle}
          />
        
          {/* Vista principal del calendario */}
          {isLoading ? (
            <div className="animate-pulse flex flex-col items-center justify-center h-[50vh] bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 mb-4"></div>
              <div className="h-6 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ) : (
            <CalendarViews 
              currentView={currentView}
              viewDate={viewDate}
              selectedDate={selectedDate}
              previousView={previousView}
              daysToDisplay={daysToDisplay}
              transactions={transactions}
              reminders={reminders}
              isMobile={isMobile}
              setPreviousView={setPreviousView}
              setSelectedDate={setSelectedDate}
              setViewDate={setViewDate}
              setCurrentView={setCurrentView}
              toggleReminderStatus={(id: string, isCompleted: boolean) => handleToggleReminderStatus(id, isCompleted)}
              deleteReminder={handleDeleteReminder}
              handleItemClick={handleItemClick}
              setNewReminder={setNewReminder}
              setNewReminderOpen={setNewReminderOpen}
            />
          )}
        </div>
        

      </div>
      
      {/* Diálogo para nuevo recordatorio */}
      <ReminderDialog 
        newReminderOpen={newReminderOpen}
        setNewReminderOpen={setNewReminderOpen}
        newReminder={newReminder}
        setNewReminder={setNewReminder}
        addReminder={handleAddReminder}
      />
      
      {/* Tarjeta de detalle del elemento seleccionado */}
      {selectedItemDetail && (
        <DetailCard 
          selectedItemDetail={selectedItemDetail}
          isMobile={isMobile}
          windowWidth={windowWidth}
          closeItemDetail={closeItemDetail}
          toggleReminderStatus={(id: string, isCompleted: boolean) => handleToggleReminderStatus(id, isCompleted)}
          deleteReminder={handleDeleteReminder}
          setPreviousView={setPreviousView}
          setSelectedDate={setSelectedDate}
          setViewDate={setViewDate}
          setCurrentView={setCurrentView}
          currentView={currentView}
        />
      )}
    </div>
  );
} 