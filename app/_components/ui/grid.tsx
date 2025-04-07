'use client';

import * as React from 'react';
import { cn } from '../../../app/_lib/utils';

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  numItems?: number;
  numItemsSm?: number;
  numItemsMd?: number;
  numItemsLg?: number;
  numItemsXl?: number;
  className?: string;
}

export function Grid({
  children,
  numItems = 1,
  numItemsSm,
  numItemsMd,
  numItemsLg,
  numItemsXl,
  className,
  ...props
}: GridProps) {
  const getGridCols = () => {
    const cols = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
      7: 'grid-cols-7',
      8: 'grid-cols-8',
      9: 'grid-cols-9',
      10: 'grid-cols-10',
      11: 'grid-cols-11',
      12: 'grid-cols-12',
    };
    
    const sm = numItemsSm ? `sm:${cols[numItemsSm as keyof typeof cols]}` : '';
    const md = numItemsMd ? `md:${cols[numItemsMd as keyof typeof cols]}` : '';
    const lg = numItemsLg ? `lg:${cols[numItemsLg as keyof typeof cols]}` : '';
    const xl = numItemsXl ? `xl:${cols[numItemsXl as keyof typeof cols]}` : '';
    
    return cn(cols[numItems as keyof typeof cols], sm, md, lg, xl);
  };
  
  return (
    <div 
      className={cn(
        "grid",
        getGridCols(),
        "gap-4",
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
} 