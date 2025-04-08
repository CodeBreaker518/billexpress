"use client";

import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@bill/_components/ui/select";
import { Label } from "@bill/_components/ui/label";
import { getCategoryConfig } from "../_lib/utils/categoryConfig";
import { incomeCategories, expenseCategories } from "../_lib/utils/categoryConfig";

interface CategorySelectProps {
  type: "income" | "expense";
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  required?: boolean;
  label?: string;
}

export function CategorySelect({ type, value, onValueChange, placeholder = "Selecciona una categoría", id = "category", required = false, label }: CategorySelectProps) {
  // Determinar las categorías según el tipo
  const categories = type === "income" ? incomeCategories : expenseCategories;

  return (
    <div className="space-y-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <Select value={value} onValueChange={onValueChange} required={required}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => {
            const config = getCategoryConfig(type, category);
            return (
              <SelectItem
                key={category}
                value={category}
                // Aplicar color suave al fondo del item cuando está seleccionado
                className="flex items-center gap-2 data-[selected]:bg-opacity-20"
                style={
                  {
                    "--selected-bg": config.color,
                    backgroundColor: value === category ? `${config.color}20` : undefined,
                  } as React.CSSProperties
                }>
                <span className="flex items-center gap-2">
                  <config.icon className="h-4 w-4" style={{ color: config.color }} />
                  <span>{category}</span>
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
