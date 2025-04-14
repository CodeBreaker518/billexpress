// Tipos para las transacciones
export interface Transaction {
  id: string;
  date: Date;
  amount: number;
  description: string;
  category: string;
  type: 'expense' | 'income';
}

// Tipos para los recordatorios
export type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "yearly";

export interface Reminder {
  id: string;
  date: Date;
  description: string;
  amount: number;
  isCompleted: boolean;
  userId?: string;
  recurrence?: RecurrenceType;
  endDate?: Date | null;
  nextOccurrence?: Date;
  isPayment?: boolean;
  isFutureRecurrence?: boolean;
}

// Tipos para elementos en el calendario
export type CalendarItem = (Transaction & { itemType: 'transaction' }) | (Reminder & { itemType: 'reminder' });

// Tipos para la tarjeta de detalles
export interface SelectedItemDetail {
  item: CalendarItem;
  position: {
    x: number;
    y: number;
  };
  isRightSide?: boolean;
}

// Tipos para vistas del calendario
export type CalendarView = 'day' | 'week' | 'month' | 'year'; 