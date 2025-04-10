"use client";

import React from "react";
import { Badge, BadgeProps } from "./badge";
import { cn } from "@bill/_lib/utils";
import { getCategoryConfig } from "../../_lib/utils/categoryConfig";

export interface CategoryBadgeProps extends BadgeProps {
  category: string;
  type: "income" | "expense";
  showIcon?: boolean;
}

export function CategoryBadge({ category, type, className, showIcon = false, ...props }: CategoryBadgeProps) {
  // Obtener la configuración de la categoría
  const config = getCategoryConfig(type, category);

  // En lugar de usar clases, usar estilos inline para los colores
  return (
    <Badge 
      variant="outline" 
      className={cn("gap-1", className)} 
      style={{
        backgroundColor: config.bgColor,
        color: config.textColor,
        borderColor: config.color
      }}
      {...props}
    >
      {showIcon && <config.icon className="h-3 w-3" style={{ color: config.color }} />}
      {category}
    </Badge>
  );
}
