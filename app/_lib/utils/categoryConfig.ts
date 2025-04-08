import { Briefcase, Coffee, ShoppingBag, Bus, Film, HomeIcon, LightbulbIcon, BookOpen, PiggyBank, Calculator, RefreshCw, Gift, HelpCircle, BarChart2 } from "lucide-react";

// Tipo para definir la configuración de una categoría
export interface CategoryConfig {
  color: string;
  darkColor: string;
  textColor: string;
  darkTextColor: string;
  bgColor: string;
  darkBgColor: string;
  icon: typeof Briefcase;
}

// Tipos de categorías
export type IncomeCategoryType = "Salario" | "Freelance" | "Inversiones" | "Ventas" | "Regalos" | "Reembolsos" | "Otros";

export type ExpenseCategoryType = "Comida" | "Transporte" | "Entretenimiento" | "Servicios" | "Compras" | "Salud" | "Educación" | "Vivienda" | "Otros";

// Configuración para categorías de ingresos
export const INCOME_CATEGORIES: Record<IncomeCategoryType, CategoryConfig> = {
  Salario: {
    color: "#3b82f6", // blue-500
    darkColor: "#2563eb", // blue-600
    textColor: "text-blue-600",
    darkTextColor: "dark:text-blue-300",
    bgColor: "bg-blue-100",
    darkBgColor: "dark:bg-blue-950",
    icon: Briefcase,
  },
  Freelance: {
    color: "#10b981", // emerald-500
    darkColor: "#059669", // emerald-600
    textColor: "text-green-600",
    darkTextColor: "dark:text-green-300",
    bgColor: "bg-green-100",
    darkBgColor: "dark:bg-green-950",
    icon: Calculator,
  },
  Inversiones: {
    color: "#8b5cf6", // violet-500
    darkColor: "#7c3aed", // violet-600
    textColor: "text-purple-600",
    darkTextColor: "dark:text-purple-300",
    bgColor: "bg-purple-100",
    darkBgColor: "dark:bg-purple-950",
    icon: BarChart2,
  },
  Ventas: {
    color: "#f97316", // orange-500
    darkColor: "#ea580c", // orange-600
    textColor: "text-orange-600",
    darkTextColor: "dark:text-orange-300",
    bgColor: "bg-orange-100",
    darkBgColor: "dark:bg-orange-950",
    icon: ShoppingBag,
  },
  Regalos: {
    color: "#ec4899", // pink-500
    darkColor: "#db2777", // pink-600
    textColor: "text-pink-600",
    darkTextColor: "dark:text-pink-300",
    bgColor: "bg-pink-100",
    darkBgColor: "dark:bg-pink-950",
    icon: Gift,
  },
  Reembolsos: {
    color: "#06b6d4", // cyan-500
    darkColor: "#0891b2", // cyan-600
    textColor: "text-cyan-600",
    darkTextColor: "dark:text-cyan-300",
    bgColor: "bg-cyan-100",
    darkBgColor: "dark:bg-cyan-950",
    icon: RefreshCw,
  },
  Otros: {
    color: "#64748b", // slate-500
    darkColor: "#475569", // slate-600
    textColor: "text-gray-600",
    darkTextColor: "dark:text-gray-300",
    bgColor: "bg-gray-100",
    darkBgColor: "dark:bg-gray-800",
    icon: HelpCircle,
  },
};

// Configuración para categorías de gastos
export const EXPENSE_CATEGORIES: Record<ExpenseCategoryType, CategoryConfig> = {
  Comida: {
    color: "#ef4444", // red-500
    darkColor: "#dc2626", // red-600
    textColor: "text-red-500",
    darkTextColor: "dark:text-red-300",
    bgColor: "bg-red-100",
    darkBgColor: "dark:bg-red-950",
    icon: Coffee,
  },
  Transporte: {
    color: "#f97316", // orange-500
    darkColor: "#ea580c", // orange-600
    textColor: "text-orange-500",
    darkTextColor: "dark:text-orange-300",
    bgColor: "bg-orange-100",
    darkBgColor: "dark:bg-orange-950",
    icon: Bus,
  },
  Entretenimiento: {
    color: "#8b5cf6", // violet-500
    darkColor: "#7c3aed", // violet-600
    textColor: "text-purple-500",
    darkTextColor: "dark:text-purple-300",
    bgColor: "bg-purple-100",
    darkBgColor: "dark:bg-purple-950",
    icon: Film,
  },
  Servicios: {
    color: "#3b82f6", // blue-500
    darkColor: "#2563eb", // blue-600
    textColor: "text-blue-500",
    darkTextColor: "dark:text-blue-300",
    bgColor: "bg-blue-100",
    darkBgColor: "dark:bg-blue-950",
    icon: LightbulbIcon,
  },
  Compras: {
    color: "#f59e0b", // amber-500
    darkColor: "#d97706", // amber-600
    textColor: "text-amber-500",
    darkTextColor: "dark:text-amber-300",
    bgColor: "bg-amber-100",
    darkBgColor: "dark:bg-amber-950",
    icon: ShoppingBag,
  },
  Salud: {
    color: "#10b981", // emerald-500
    darkColor: "#059669", // emerald-600
    textColor: "text-green-500",
    darkTextColor: "dark:text-green-300",
    bgColor: "bg-green-100",
    darkBgColor: "dark:bg-green-950",
    icon: PiggyBank,
  },
  Educación: {
    color: "#6366f1", // indigo-500
    darkColor: "#4f46e5", // indigo-600
    textColor: "text-indigo-500",
    darkTextColor: "dark:text-indigo-300",
    bgColor: "bg-indigo-100",
    darkBgColor: "dark:bg-indigo-950",
    icon: BookOpen,
  },
  Vivienda: {
    color: "#14b8a6", // teal-500
    darkColor: "#0d9488", // teal-600
    textColor: "text-teal-500",
    darkTextColor: "dark:text-teal-300",
    bgColor: "bg-teal-100",
    darkBgColor: "dark:bg-teal-950",
    icon: HomeIcon,
  },
  Otros: {
    color: "#64748b", // slate-500
    darkColor: "#475569", // slate-600
    textColor: "text-gray-500",
    darkTextColor: "dark:text-gray-300",
    bgColor: "bg-gray-100",
    darkBgColor: "dark:bg-gray-800",
    icon: HelpCircle,
  },
};

// Arrays de categorías para uso general
export const incomeCategories = Object.keys(INCOME_CATEGORIES) as IncomeCategoryType[];
export const expenseCategories = Object.keys(EXPENSE_CATEGORIES) as ExpenseCategoryType[];

// Función auxiliar para obtener configuración según tipo y categoría
export function getCategoryConfig(type: "income" | "expense", category: string): CategoryConfig {
  if (type === "income") {
    return INCOME_CATEGORIES[category as IncomeCategoryType] || INCOME_CATEGORIES["Otros"];
  } else {
    return EXPENSE_CATEGORIES[category as ExpenseCategoryType] || EXPENSE_CATEGORIES["Otros"];
  }
}

// Función para obtener array de colores para gráficos
export function getCategoryColors(type: "income" | "expense"): string[] {
  if (type === "income") {
    return incomeCategories.map((cat) => INCOME_CATEGORIES[cat].color);
  } else {
    return expenseCategories.map((cat) => EXPENSE_CATEGORIES[cat].color);
  }
}
