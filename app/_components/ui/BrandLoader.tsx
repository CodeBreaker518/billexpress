import React from 'react';
import { cn } from '@bill/_lib/utils';

// Custom keyframes need to be defined in globals.css or via a style tag if needed,
// but we can achieve a simple effect with existing Tailwind animations.
// Let's use varying pulse delays for a subtle "wind" or "activity" effect.

interface BrandLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  barClassName?: string;
}

export default function BrandLoader({ className, barClassName, ...props }: BrandLoaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center min-h-screen w-full",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-center space-x-2">
        <div
          className={cn(
            "h-12 w-2 bg-primary rounded-full animate-pulse",
            barClassName
          )}
          style={{ animationDelay: '0s' }}
        />
        <div
          className={cn(
            "h-16 w-2 bg-primary rounded-full animate-pulse",
            barClassName
          )}
          style={{ animationDelay: '0.1s' }}
        />
        <div
          className={cn(
            "h-12 w-2 bg-primary rounded-full animate-pulse",
            barClassName
          )}
          style={{ animationDelay: '0.2s' }}
        />
      </div>
    </div>
  );
} 