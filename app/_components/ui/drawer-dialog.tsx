'use client';

import * as React from 'react';
import { useMediaQuery } from '@bill/_hooks/useMediaQuery';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@bill/_components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@bill/_components/ui/drawer';
import { Button } from '@bill/_components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@bill/_lib/utils';

interface DrawerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  closeButtonText?: string;
  footerContent?: React.ReactNode;
  size?: 'default' | 'sm' | 'lg' | 'xl' | 'full';
}

export function DrawerDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  showCloseButton = false,
  closeButtonText = 'Cerrar',
  footerContent,
  size = 'default',
}: DrawerDialogProps) {
  // Determinar si estamos en una pantalla móvil
  const isDesktop = useMediaQuery('(min-width: 768px)');
  
  // Determinar la clase de tamaño para DialogContent
  const dialogSizeClass = React.useMemo(() => {
    switch (size) {
      case 'sm': return 'sm:max-w-sm';
      case 'lg': return 'sm:max-w-lg';
      case 'xl': return 'sm:max-w-xl';
      case 'full': return 'sm:max-w-screen-xl';
      default: return 'sm:max-w-md';
    }
  }, [size]);

  // Si estamos en escritorio, mostrar un diálogo modal
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn(dialogSizeClass, className)}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description}
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  // En móvil, mostrar un drawer desde abajo
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={className}>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          {description}
        </DrawerHeader>
        <div className="px-4 overflow-y-auto">{children}</div>
        {(showCloseButton || footerContent) && (
          <DrawerFooter className="flex flex-row justify-between items-center">
            {footerContent}
            {showCloseButton && (
              <DrawerClose asChild>
                <Button variant="outline" size="sm">
                  <X className="h-4 w-4 mr-2" />
                  {closeButtonText}
                </Button>
              </DrawerClose>
            )}
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}