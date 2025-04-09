import { LucideIcon, Wallet, Briefcase, Gift, PiggyBank, ShoppingBag, Utensils, Bus, Home, Heart, GraduationCap, Gamepad2, Plane, Coffee, Music, Palette, Dumbbell, BookOpen, Car, Train, Ship, Bike, Building2, Hotel, Tent, HeartPulse, Stethoscope, Pill, Microscope, School, RefreshCw, HelpCircle, Lightbulb } from "lucide-react";

// Tipo para definir la configuración de una categoría
export interface CategoryConfig {
  color: string;
  darkColor: string;
  textColor: string;
  darkTextColor: string;
  bgColor: string;
  darkBgColor: string;
  icon: LucideIcon;
}

// Tipos de categorías
export type IncomeCategoryType = "Salario" | "Freelance" | "Inversiones" | "Ventas" | "Regalos" | "Reembolsos" | "Otros";

export type ExpenseCategoryType = "Comida" | "Transporte" | "Entretenimiento" | "Servicios" | "Compras" | "Salud" | "Educación" | "Vivienda" | "Otros";

// Configuración para categorías de ingresos
export const INCOME_CATEGORIES: Record<string, CategoryConfig> = {
  "Salario": {
    color: "#1a7ffa",
    darkColor: "#3b82f6",
    textColor: "#1e40af",
    darkTextColor: "#93c5fd",
    bgColor: "#eff6ff",
    darkBgColor: "#1e3a8a",
    icon: Wallet
  },
  "Freelance": {
    color: "#26b066",
    darkColor: "#22c55e",
    textColor: "#166534",
    darkTextColor: "#86efac",
    bgColor: "#f0fdf4",
    darkBgColor: "#14532d",
    icon: Briefcase
  },
  "Inversiones": {
    color: "#7c3aed",
    darkColor: "#8b5cf6",
    textColor: "#5b21b6",
    darkTextColor: "#c4b5fd",
    bgColor: "#f5f3ff",
    darkBgColor: "#2e1065",
    icon: PiggyBank
  },
  "Ventas": {
    color: "#f97316",
    darkColor: "#fb923c",
    textColor: "#9a3412",
    darkTextColor: "#fdba74",
    bgColor: "#fff7ed",
    darkBgColor: "#7c2d12",
    icon: Gift
  },
  "Regalos": {
    color: "#f97316",
    darkColor: "#fb923c",
    textColor: "#9a3412",
    darkTextColor: "#fdba74",
    bgColor: "#fff7ed",
    darkBgColor: "#7c2d12",
    icon: Gift
  },
  "Reembolsos": {
    color: "#06b6d4",
    darkColor: "#0891b2",
    textColor: "#0e7490",
    darkTextColor: "#67e8f9",
    bgColor: "#ecfeff",
    darkBgColor: "#164e63",
    icon: RefreshCw
  },
  "Otros": {
    color: "#64748b",
    darkColor: "#475569",
    textColor: "#334155",
    darkTextColor: "#cbd5e1",
    bgColor: "#f8fafc",
    darkBgColor: "#1e293b",
    icon: HelpCircle
  },
};

// Configuración para categorías de gastos
export const EXPENSE_CATEGORIES: Record<string, CategoryConfig> = {
  "Comida": {
    color: "#ef4444",
    darkColor: "#f87171",
    textColor: "#991b1b",
    darkTextColor: "#fca5a5",
    bgColor: "#fef2f2",
    darkBgColor: "#7f1d1d",
    icon: Utensils
  },
  "Transporte": {
    color: "#1a7ffa",
    darkColor: "#3b82f6",
    textColor: "#1e40af",
    darkTextColor: "#93c5fd",
    bgColor: "#eff6ff",
    darkBgColor: "#1e3a8a",
    icon: Bus
  },
  "Entretenimiento": {
    color: "#ef4444",
    darkColor: "#f87171",
    textColor: "#991b1b",
    darkTextColor: "#fca5a5",
    bgColor: "#fef2f2",
    darkBgColor: "#7f1d1d",
    icon: Gamepad2
  },
  "Servicios": {
    color: "#3b82f6",
    darkColor: "#2563eb",
    textColor: "#1e40af",
    darkTextColor: "#93c5fd",
    bgColor: "#eff6ff",
    darkBgColor: "#1e3a8a",
    icon: Lightbulb
  },
  "Compras": {
    color: "#26b066",
    darkColor: "#22c55e",
    textColor: "#166534",
    darkTextColor: "#86efac",
    bgColor: "#f0fdf4",
    darkBgColor: "#14532d",
    icon: ShoppingBag
  },
  "Salud": {
    color: "#7c3aed",
    darkColor: "#8b5cf6",
    textColor: "#5b21b6",
    darkTextColor: "#c4b5fd",
    bgColor: "#f5f3ff",
    darkBgColor: "#2e1065",
    icon: Heart
  },
  "Educación": {
    color: "#f97316",
    darkColor: "#fb923c",
    textColor: "#9a3412",
    darkTextColor: "#fdba74",
    bgColor: "#fff7ed",
    darkBgColor: "#7c2d12",
    icon: GraduationCap
  },
  "Vivienda": {
    color: "#26b066",
    darkColor: "#22c55e",
    textColor: "#166534",
    darkTextColor: "#86efac",
    bgColor: "#f0fdf4",
    darkBgColor: "#14532d",
    icon: Home
  },
  "Viajes": {
    color: "#1a7ffa",
    darkColor: "#3b82f6",
    textColor: "#1e40af",
    darkTextColor: "#93c5fd",
    bgColor: "#eff6ff",
    darkBgColor: "#1e3a8a",
    icon: Plane
  },
  "Otros": {
    color: "#64748b",
    darkColor: "#475569",
    textColor: "#334155",
    darkTextColor: "#cbd5e1",
    bgColor: "#f8fafc",
    darkBgColor: "#1e293b",
    icon: HelpCircle
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
