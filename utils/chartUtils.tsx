import { CategoryType } from "../types";

// Standard colors for financial types
export const FINANCIAL_COLORS = {
  income: "#10b981", // Green
  expense: "#ef4444", // Red
  balance: "#3b82f6", // Blue
};

// Generate a shade of the base color for category variations
export function generateCategoryColor(baseColor: string, index: number): string {
  // Create different shades based on the index
  const darkenFactor = 1 - (index % 3) * 0.15;
  return manipulateColor(baseColor, darkenFactor);
}

// Helper to manipulate hex color brightness
function manipulateColor(hexColor: string, factor: number): string {
  // Parse the hex color
  const r = parseInt(hexColor.substring(1, 3), 16);
  const g = parseInt(hexColor.substring(3, 5), 16);
  const b = parseInt(hexColor.substring(5, 7), 16);
  
  // Adjust brightness
  const newR = Math.floor(r * factor);
  const newG = Math.floor(g * factor);
  const newB = Math.floor(b * factor);
  
  // Convert back to hex
  return `#${(newR).toString(16).padStart(2, '0')}${
    (newG).toString(16).padStart(2, '0')}${
    (newB).toString(16).padStart(2, '0')}`;
}

// Generate colors for a set of categories based on their financial type
export function getCategoryColors(categories: string[], type: 'income' | 'expense'): string[] {
  const baseColor = type === 'income' ? FINANCIAL_COLORS.income : FINANCIAL_COLORS.expense;
  return categories.map((_, index) => generateCategoryColor(baseColor, index));
}
