import { getCategoryColors as getConfigColors } from "./categoryConfig";

// Standard colors for financial types
export const FINANCIAL_COLORS = {
  income: "#10b981", // Green
  expense: "#ef4444", // Red
  balance: "#3b82f6", // Blue
};

// Manipular color (darken/lighten)
export function manipulateColor(hexColor: string, factor: number): string {
  // Convert hex to RGB
  let r = parseInt(hexColor.substring(1, 3), 16);
  let g = parseInt(hexColor.substring(3, 5), 16);
  let b = parseInt(hexColor.substring(5, 7), 16);

  // Adjust the color
  r = Math.floor(r * factor);
  g = Math.floor(g * factor);
  b = Math.floor(b * factor);

  // Ensure values are in valid range
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  // Convert back to hex
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// Generate a shade of the base color for category variations
export function generateCategoryColor(baseColor: string, index: number): string {
  // Create different shades based on the index
  const darkenFactor = 1 - (index % 3) * 0.15;
  return manipulateColor(baseColor, darkenFactor);
}

// Generate colors for a set of categories based on their financial type
export function getCategoryColors(categories: string[], type: "income" | "expense"): string[] {
  // Usar la nueva función de configuración centralizada
  return getConfigColors(type);
}
