'use client';

import React from 'react';
import { Card, CardContent } from './card';
import { cn } from '@bill/_lib/utils';

interface StatsCardProps {
  title: string;
  value: string;
  subValue?: string;
  subTitle?: string;
  icon?: React.ReactNode;
  className?: string;
  iconContainerClassName?: string;
  decorationColor?: 'green' | 'red' | 'blue' | 'amber' | 'purple' | 'gray';
  valueClassName?: string; // Add this line
}

export function StatsCard({
  title,
  value,
  subValue,
  subTitle,
  icon,
  className,
  iconContainerClassName,
  decorationColor = 'gray',
  valueClassName
}: StatsCardProps) {
  const decorationColorClass = {
    green: 'border-t-4 border-green-500 dark:border-green-400',
    red: 'border-t-4 border-red-500 dark:border-red-400',
    blue: 'border-t-4 border-primary dark:border-primary',
    amber: 'border-t-4 border-accent dark:border-accent',
    purple: 'border-t-4 border-purple-500 dark:border-purple-400',
    gray: 'border-t-4 border-gray-400 dark:border-gray-500',
  }[decorationColor];

  return (
    <Card className={cn(decorationColorClass, className)}>
      <CardContent className="pt-6">
        <div className="flex items-start space-x-4">
          {icon && (
            <div className={cn("p-2 rounded-md", iconContainerClassName)}>
              {icon}
            </div>
          )}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={cn("text-xl md:text-2xl font-bold", valueClassName)}>{value}</p>
            {(subValue || subTitle) && (
              <p className="text-xs md:text-sm text-muted-foreground">
                {subTitle && <span className="font-semibold">{subTitle}:</span>}{' '}
                {subValue}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 