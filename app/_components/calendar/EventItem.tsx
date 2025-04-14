"use client";

import { cn } from "@bill/_lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertCircle, CalendarCheck, CreditCard, ArrowUpCircle, ArrowDownCircle, CheckCircle2, DollarSign, Bookmark, Repeat } from "lucide-react";
import { Expense } from "@bill/_store/useExpenseStore";
import { Income } from "@bill/_store/useIncomeStore";
import { Reminder } from "@bill/_components/calendar/types";

export type EventType = "expense" | "income" | "reminder" | "upcoming";

// Type for any other event with different properties
interface GenericEvent {
  id: string;
  title?: string;
  description?: string;
  date?: Date;
  dueDate?: Date;
  amount?: number;
}

interface EventItemProps {
  event: Expense | Income | Reminder | GenericEvent;
  type: EventType;
  className?: string;
  showDate?: boolean;
  compact?: boolean;
}

export const EventItem = ({
  event,
  type,
  className,
  showDate = false,
  compact = false,
}: EventItemProps) => {
  const getEventIcon = () => {
    // Utilizar el tipo proporcionado para determinar el icono
    switch (type) {
      case "expense":
        return <ArrowDownCircle className="h-3.5 w-3.5 mr-1.5 text-red-500" />;
      case "income":
        return <ArrowUpCircle className="h-3.5 w-3.5 mr-1.5 text-blue-500" />;
      case "reminder":
        // Para recordatorios, verificar propiedades específicas
        if ("isFutureRecurrence" in event && event.isFutureRecurrence) {
          // Icono especial para recordatorios recurrentes futuros
          return <Repeat className="h-3.5 w-3.5 mr-1.5 text-blue-500" />;
        } else if ("isCompleted" in event && event.isCompleted) {
          return <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-green-500" />;
        } else if ("isPayment" in event && event.isPayment) {
          return <DollarSign className="h-3.5 w-3.5 mr-1.5 text-blue-500" />;
        } else {
          return <Bookmark className="h-3.5 w-3.5 mr-1.5 text-yellow-500" />;
        }
      case "upcoming":
      default:
        return <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-gray-500" />;
    }
  };

  const getEventTitle = () => {
    if ("description" in event && event.description) {
      return event.description;
    }
    if ("title" in event && event.title) {
      return event.title;
    }
    return "Evento sin título";
  };

  const getEventAmount = () => {
    if ("amount" in event && event.amount) {
      // Formato simple con signo $
      return `$${event.amount.toFixed(2)}`;
    }
    return null;
  };

  const getEventDate = () => {
    if ("date" in event && event.date) {
      return format(new Date(event.date), "d MMM", { locale: es });
    }
    if ("dueDate" in event && event.dueDate) {
      return format(new Date(event.dueDate), "d MMM", { locale: es });
    }
    return null;
  };

  const getBgColor = () => {
    switch (type) {
      case "expense":
        return "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400";
      case "income":
        return "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400";
      case "reminder":
        // Para recordatorios, verificar propiedades específicas
        if ("isFutureRecurrence" in event && event.isFutureRecurrence) {
          // Estilo especial para recordatorios recurrentes futuros con borde punteado
          return "bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 border border-dashed border-indigo-300 dark:border-indigo-700";
        } else if ("isCompleted" in event && event.isCompleted) {
          return "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 line-through opacity-70";
        } else if ("isPayment" in event && event.isPayment) {
          return "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400";
        } else {
          return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400";
        }
      case "upcoming":
      default:
        return "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700";
    }
  };

  return (
    <div 
      className={cn(
        "rounded-md px-2 py-1.5 transition-colors",
        getBgColor(),
        compact ? "text-xs" : "text-sm",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {getEventIcon()}
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">
            {getEventTitle()}
          </div>
          {showDate && getEventDate() && (
            <div className="text-xs opacity-70">
              {getEventDate()}
            </div>
          )}
        </div>
        {getEventAmount() && (
          <div className={cn(
            "font-medium", 
            type === "expense" ? "text-red-600 dark:text-red-400" : 
            type === "income" ? "text-blue-600 dark:text-blue-400" : 
            "text-current"
          )}>
            {type === "expense" ? "-" : type === "income" ? "+" : ""}{getEventAmount()}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventItem; 