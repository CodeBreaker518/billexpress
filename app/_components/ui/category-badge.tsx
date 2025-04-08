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

  // Construir la clase de color basada en la configuración
  const colorClass = `${config.bgColor} ${config.textColor} ${config.darkBgColor} ${config.darkTextColor}`;

  return (
    <Badge variant="outline" className={cn(colorClass, "gap-1", className)} {...props}>
      {showIcon && <config.icon className="h-3 w-3" />}
      {category}
    </Badge>
  );
}
