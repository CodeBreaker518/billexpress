"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Calendar } from "lucide-react";
import { Button } from "@bill/_components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@bill/_components/ui/select";
import { CalendarView, RecurrenceType } from "./types";

interface CalendarControlsProps {
  currentView: CalendarView;
  viewDate: Date;
  isMobile: boolean;
  goToPreviousPeriod: () => void;
  goToNextPeriod: () => void;
  goToToday: () => void;
  setCurrentView: (view: CalendarView) => void;
  setNewReminder: (value: React.SetStateAction<{
    description: string; 
    amount: number; 
    date: Date;
    recurrence: RecurrenceType;
    endDate: Date | null;
    isPayment: boolean;
  }>) => void;
  setNewReminderOpen: (open: boolean) => void;
  renderPeriodTitle: () => string;
}

export const CalendarControls = ({
  currentView,
  viewDate,
  isMobile,
  goToPreviousPeriod,
  goToNextPeriod,
  goToToday,
  setCurrentView,
  setNewReminder,
  setNewReminderOpen,
  renderPeriodTitle
}: CalendarControlsProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-3 sm:gap-4">
      <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
        <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0" onClick={goToPreviousPeriod}>
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        <h2 className="text-sm sm:text-base md:text-lg font-medium capitalize truncate flex-1 text-center">
          {renderPeriodTitle()}
        </h2>
        <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0" onClick={goToNextPeriod}>
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        {currentView !== 'year' && (
          <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-9 flex-shrink-0 whitespace-nowrap" onClick={goToToday}>
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 flex-shrink-0" />
            <span>Hoy</span>
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
        <Select value={currentView} onValueChange={(value) => setCurrentView(value as CalendarView)}>
          <SelectTrigger className="w-[120px] sm:w-[130px] text-xs sm:text-sm h-8 sm:h-9">
            <SelectValue placeholder="Vista" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day" className="text-xs sm:text-sm">Día</SelectItem>
            <SelectItem value="week" className="text-xs sm:text-sm">Semana</SelectItem>
            <SelectItem value="month" className="text-xs sm:text-sm">Mes</SelectItem>
            <SelectItem value="year" className="text-xs sm:text-sm">Año</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          className="text-xs sm:text-sm h-8 sm:h-9 whitespace-nowrap flex-shrink-0"
          onClick={() => {
            setNewReminder({
              description: "", 
              amount: 0, 
              date: viewDate, 
              recurrence: "none", 
              endDate: null, 
              isPayment: false
            });
            setNewReminderOpen(true);
          }}
        >
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
          <span className="hidden sm:inline">Recordatorio</span>
          <span className="sm:hidden">Nuevo</span>
        </Button>
      </div>
    </div>
  );
};

export default CalendarControls; 