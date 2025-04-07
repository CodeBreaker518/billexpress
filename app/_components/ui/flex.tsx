'use client';

import * as React from 'react';
import { cn } from '../../../app/_lib/utils';

interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  justifyContent?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  alignItems?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  flexDirection?: 'row' | 'row-reverse' | 'col' | 'col-reverse';
  flexWrap?: 'wrap' | 'wrap-reverse' | 'nowrap';
  gap?: 'none' | 'px' | '0.5' | '1' | '1.5' | '2' | '3' | '4' | '5' | '6' | '8' | '10';
  className?: string;
}

export function Flex({
  children,
  justifyContent = 'start',
  alignItems = 'center',
  flexDirection = 'row',
  flexWrap = 'nowrap',
  gap = 'none',
  className,
  ...props
}: FlexProps) {
  // Convert props to tailwind classes
  const justifyClasses = {
    'start': 'justify-start',
    'end': 'justify-end',
    'center': 'justify-center',
    'between': 'justify-between',
    'around': 'justify-around',
    'evenly': 'justify-evenly',
  };

  const alignClasses = {
    'start': 'items-start',
    'end': 'items-end',
    'center': 'items-center',
    'baseline': 'items-baseline',
    'stretch': 'items-stretch',
  };

  const directionClasses = {
    'row': 'flex-row',
    'row-reverse': 'flex-row-reverse',
    'col': 'flex-col',
    'col-reverse': 'flex-col-reverse',
  };

  const wrapClasses = {
    'wrap': 'flex-wrap',
    'wrap-reverse': 'flex-wrap-reverse',
    'nowrap': 'flex-nowrap',
  };

  const gapClasses = {
    'none': '',
    'px': 'gap-px',
    '0.5': 'gap-0.5',
    '1': 'gap-1',
    '1.5': 'gap-1.5',
    '2': 'gap-2',
    '3': 'gap-3',
    '4': 'gap-4',
    '5': 'gap-5',
    '6': 'gap-6',
    '8': 'gap-8',
    '10': 'gap-10',
  };

  return (
    <div
      className={cn(
        'flex',
        justifyClasses[justifyContent],
        alignClasses[alignItems],
        directionClasses[flexDirection],
        wrapClasses[flexWrap],
        gapClasses[gap],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
} 