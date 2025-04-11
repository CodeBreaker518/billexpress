"use client";

import React, { useState } from 'react';
import { Button } from '@bill/_components/ui/button';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@bill/_components/ui/popover';
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle, DrawerClose, DrawerFooter } from '@bill/_components/ui/drawer';
import { Calendar } from '@bill/_components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { 
  format, 
  startOfDay, 
  endOfDay, 
  subDays, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear 
} from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@bill/_lib/utils';
import { useMediaQuery } from "@bill/_hooks/useMediaQuery";

interface DateRangePickerWithPresetsProps {
  date: DateRange | undefined;
  onDateChange: (range: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePickerWithPresets({
  date,
  onDateChange,
  className,
}: DateRangePickerWithPresetsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const setPresetRange = (range: DateRange) => {
    onDateChange(range);
    setIsOpen(false);
  };

  // Calcular fechas para presets
  const today = new Date();
  const presets = {
    hoy: { from: startOfDay(today), to: endOfDay(today) },
    ayer: { from: startOfDay(subDays(today, 1)), to: endOfDay(subDays(today, 1)) },
    ultimos7dias: { from: startOfDay(subDays(today, 6)), to: endOfDay(today) },
    esteMes: { from: startOfMonth(today), to: endOfMonth(today) },
    mesAnterior: { 
      from: startOfMonth(subMonths(today, 1)), 
      to: endOfMonth(subMonths(today, 1))
    },
    esteAno: { from: startOfYear(today), to: endOfYear(today) },
  };

  // Contenido común para Popover y Drawer
  const PickerContent = (
    <div className={cn("flex", isDesktop ? "flex-row" : "flex-col h-[calc(90vh-100px)]")}>
      <div className={cn(
          "flex flex-col space-y-1 p-3 pr-2 whitespace-nowrap",
          isDesktop ? "border-r" : "border-b"
        )}>
        <Button variant="ghost" size="sm" className="justify-start text-xs h-8" onClick={() => setPresetRange(presets.hoy)}>Hoy</Button>
        <Button variant="ghost" size="sm" className="justify-start text-xs h-8" onClick={() => setPresetRange(presets.ayer)}>Ayer</Button>
        <Button variant="ghost" size="sm" className="justify-start text-xs h-8" onClick={() => setPresetRange(presets.ultimos7dias)}>Últimos 7 días</Button>
        <Button variant="ghost" size="sm" className="justify-start text-xs h-8" onClick={() => setPresetRange(presets.esteMes)}>Este Mes</Button>
        <Button variant="ghost" size="sm" className="justify-start text-xs h-8" onClick={() => setPresetRange(presets.mesAnterior)}>Mes Anterior</Button>
        <Button variant="ghost" size="sm" className="justify-start text-xs h-8" onClick={() => setPresetRange(presets.esteAno)}>Este Año</Button>
      </div>
      <div className={cn("p-1", !isDesktop && "overflow-y-auto flex-1")}>
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={date?.from}
          selected={date}
          onSelect={(range) => {
            onDateChange(range);
          }}
          numberOfMonths={isDesktop ? 2 : 1}
          locale={es}
          className={!isDesktop ? "w-full" : ""}
        />
      </div>
    </div>
  );

  // Botón que activa el Popover/Drawer
  const TriggerButton = (
    <Button
      id="date"
      variant={"outline"}
      className={cn(
        "w-full sm:w-[300px] justify-start text-left font-normal",
        !date && "text-muted-foreground"
      )}
    >
      <CalendarIcon className="mr-2 h-4 w-4" />
      {date?.from ? (
        date.to ? (
          <>
            {format(date.from, "LLL dd, y", { locale: es })} - {" "}
            {format(date.to, "LLL dd, y", { locale: es })}
          </>
        ) : (
          format(date.from, "LLL dd, y", { locale: es })
        )
      ) : (
        <span>Seleccionar rango</span>
      )}
    </Button>
  );

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {isDesktop ? (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>{TriggerButton}</PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            {PickerContent}
          </PopoverContent>
        </Popover>
      ) : (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerTrigger asChild>{TriggerButton}</DrawerTrigger>
          <DrawerContent className="h-[90vh]">
            <DrawerHeader className="text-left">
              <DrawerTitle>Seleccionar Rango</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto px-1">
              {PickerContent}
            </div>
            <DrawerFooter className="pt-2">
              <DrawerClose asChild>
                <Button variant="outline">Cerrar</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}

      {date && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onDateChange(undefined)}
          className="h-9 text-muted-foreground"
          title="Limpiar rango"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
} 