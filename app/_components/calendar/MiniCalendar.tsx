"use client";

import { useState } from "react";
import { Calendar } from "@bill/_components/ui/calendar";
import { cn } from "@bill/_lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@bill/_components/ui/button";
import { es } from "date-fns/locale";
import { format } from "date-fns";

interface MiniCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  disabledDates?: (date: Date) => boolean;
  className?: string;
}

export const MiniCalendar = ({
  selectedDate,
  onDateSelect,
  disabledDates,
  className,
}: MiniCalendarProps) => {
  const [calendarDate, setCalendarDate] = useState<Date>(selectedDate);

  const handleCalendarDateChange = (date: Date | undefined) => {
    if (date) {
      setCalendarDate(date);
    }
  };

  const handleMonthChange = (increment: number) => {
    const newDate = new Date(calendarDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setCalendarDate(newDate);
  };

  const currentMonth = format(calendarDate, "MMMM yyyy", { locale: es });
  
  return (
    <div className={cn("mb-4", className)}>
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => handleMonthChange(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Mes anterior</span>
        </Button>
        <div className="text-sm font-medium capitalize">
          {currentMonth}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => handleMonthChange(1)}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Mes siguiente</span>
        </Button>
      </div>
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(date) => date && onDateSelect(date)}
        onMonthChange={handleCalendarDateChange}
        month={calendarDate}
        locale={es}
        disabled={disabledDates}
        className="w-full rounded-md border"
        showOutsideDays
      />
    </div>
  );
};

export default MiniCalendar; 