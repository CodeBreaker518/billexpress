// Definición de tipos para la página de finanzas

// Tipo base para elementos financieros
export interface FinanceItem {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
  time?: string;
  accountId?: string;
  userId: string;
}

// Tipo para ingresos
export interface Income extends Omit<FinanceItem, "date"> {
  date: Date | string;
  userId: string;
  accountId?: string;
}

// Tipo para gastos
export interface Expense extends Omit<FinanceItem, "date"> {
  date: Date | string;
  userId: string;
  accountId?: string;
}

// Tipo para estadísticas de categorías
export interface CategoryStats {
  category: string;
  amount: number;
  percentage: number;
  [key: string]: string | number; // Índice para compatibilidad con ChartData
}

// Tipo para datos financieros mensuales
export interface MonthlyFinanceData {
  month: string;
  Ingresos: number;
  Gastos: number;
  Balance: number;
  [key: string]: string | number; // Índice para compatibilidad con ChartData
}

// Namespace para agrupar los tipos
export namespace FinanceTypes {
  export type FinanceItemType = FinanceItem;
  export type IncomeType = Income;
  export type ExpenseType = Expense;
  export type CategoryStatsType = CategoryStats;
  export type MonthlyFinanceDataType = MonthlyFinanceData;
}
