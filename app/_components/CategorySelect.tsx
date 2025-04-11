'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@bill/_components/ui/select';
import { Label } from '@bill/_components/ui/label';
import { getCategoryConfig } from '../_lib/utils/categoryConfig';
import { incomeCategories, expenseCategories } from '../_lib/utils/categoryConfig';

interface CategorySelectProps {
  type: 'income' | 'expense';
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  required?: boolean;
  label?: string;
}

export function CategorySelect({ type, value, onValueChange, placeholder = 'Selecciona una categoría', id = 'category', required = false, label }: CategorySelectProps) {
  // Determinar las categorías según el tipo
  const categories = type === 'income' ? incomeCategories : expenseCategories;

  return (
    <div className='space-y-2'>
      {label && <Label htmlFor={id}>{label}</Label>}
      <Select value={value} onValueChange={onValueChange} required={required}>
        <SelectTrigger id={id}>
          {value ? (
            <div className='flex items-center gap-2'>
              {(() => {
                const config = getCategoryConfig(type, value);
                const Icon = config.icon;
                return <Icon className='h-4 w-4' style={{ color: config.color }} />;
              })()}
              <span>{value}</span>
            </div>
          ) : (
            <SelectValue placeholder={placeholder} />
          )}
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => {
            const config = getCategoryConfig(type, category);
            const Icon = config.icon;
            return (
              <SelectItem
                key={category}
                value={category}
                className='flex items-center gap-2'
                style={{
                  backgroundColor: value === category ? `${config.bgColor}` : undefined,
                }}>
                <div className='flex items-center gap-2'>
                  <Icon className='h-4 w-4' style={{ color: config.color }} />
                  <span>{category}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
