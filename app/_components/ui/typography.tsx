'use client';

import React from 'react';
import { cn } from '@bill/_lib/utils';

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  as?: React.ElementType;
  className?: string;
}

export function Text({ 
  children, 
  className, 
  as: Component = "p", 
  ...props 
}: TypographyProps) {
  return (
    <Component 
      className={cn("leading-7 text-foreground", className)} 
      {...props}
    >
      {children}
    </Component>
  );
}

export function Title({ 
  children, 
  className, 
  as: Component = "h2", 
  ...props 
}: TypographyProps) {
  return (
    <Component 
      className={cn("text-xl font-semibold tracking-tight", className)} 
      {...props}
    >
      {children}
    </Component>
  );
}

export function Metric({ 
  children, 
  className, 
  as: Component = "p", 
  ...props 
}: TypographyProps) {
  return (
    <Component 
      className={cn("text-3xl font-bold", className)} 
      {...props}
    >
      {children}
    </Component>
  );
}

export function Bold({ 
  children, 
  className, 
  as: Component = "span", 
  ...props 
}: TypographyProps) {
  return (
    <Component 
      className={cn("font-semibold", className)} 
      {...props}
    >
      {children}
    </Component>
  );
} 