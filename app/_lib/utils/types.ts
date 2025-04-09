export type IncomeCategoryType =
  | "salary"
  | "freelance"
  | "investments"
  | "rental"
  | "other";

export type ExpenseCategoryType =
  | "food"
  | "transport"
  | "utilities"
  | "entertainment"
  | "health"
  | "education"
  | "shopping"
  | "other";

export interface CategoryConfig {
  label: string;
  icon?: string;
  color?: string;
}

export interface FinanceItem {
  id: string;
  amount: number;
  category: IncomeCategoryType | ExpenseCategoryType;
  description?: string;
  date: string;
  type: "income" | "expense";
  accountId?: string;
} 