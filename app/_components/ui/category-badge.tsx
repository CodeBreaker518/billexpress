'use client';

import React from 'react';
import { Badge, BadgeProps } from './badge';
import { cn } from '@bill/_lib/utils';

export interface CategoryBadgeProps extends BadgeProps {
  category: string;
  type: 'income' | 'expense';
}

export function CategoryBadge({ category, type, className, ...props }: CategoryBadgeProps) {
  const getIncomeCategoryColor = (category: string) => {
    switch (category) {
      case 'Salario': return 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300';
      case 'Freelance': return 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-300';
      case 'Inversiones': return 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-300';
      case 'Ventas': return 'bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-300';
      case 'Regalos': return 'bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-300';
      case 'Reembolsos': return 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-300';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getExpenseCategoryColor = (category: string) => {
    switch (category) {
      case 'Comida': return 'bg-red-100 text-red-500 dark:bg-red-950 dark:text-red-300';
      case 'Transporte': return 'bg-orange-100 text-orange-500 dark:bg-orange-950 dark:text-orange-300';
      case 'Entretenimiento': return 'bg-purple-100 text-purple-500 dark:bg-purple-950 dark:text-purple-300';
      case 'Servicios': return 'bg-blue-100 text-blue-500 dark:bg-blue-950 dark:text-blue-300';
      case 'Compras': return 'bg-amber-100 text-amber-500 dark:bg-amber-950 dark:text-amber-300';
      case 'Salud': return 'bg-green-100 text-green-500 dark:bg-green-950 dark:text-green-300';
      case 'Educación': return 'bg-indigo-100 text-indigo-500 dark:bg-indigo-950 dark:text-indigo-300';
      case 'Vivienda': return 'bg-teal-100 text-teal-500 dark:bg-teal-950 dark:text-teal-300';
      default: return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const colorClass = type === 'income' 
    ? getIncomeCategoryColor(category) 
    : getExpenseCategoryColor(category);

  return (
    <Badge 
      variant="outline" 
      className={cn(colorClass, className)}
      {...props}
    >
      {category}
    </Badge>
  );
} 