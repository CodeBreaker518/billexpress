'use client';

import React from 'react';
import { cn } from '@bill/_lib/utils';
import { Separator } from './separator';

interface ListProps extends React.HTMLAttributes<HTMLUListElement> {
  children: React.ReactNode;
  className?: string;
}

export function List({ children, className, ...props }: ListProps) {
  return (
    <ul className={cn("divide-y divide-border", className)} {...props}>
      {children}
    </ul>
  );
}

interface ListItemProps extends React.HTMLAttributes<HTMLLIElement> {
  children: React.ReactNode;
  className?: string;
}

export function ListItem({ children, className, ...props }: ListItemProps) {
  return (
    <li 
      className={cn("flex items-center justify-between py-3", className)} 
      {...props}
    >
      {children}
    </li>
  );
} 