"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
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
    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
      <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
        <Button variant="outline" size="icon" onClick={goToPreviousPeriod}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg sm:text-xl font-medium capitalize min-w-[150px] sm:min-w-[200px] text-center">
          {renderPeriodTitle()}
        </h2>
        <Button variant="outline" size="icon" onClick={goToNextPeriod}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={goToToday}>
          Hoy
        </Button>
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <Select value={currentView} onValueChange={(value) => setCurrentView(value as CalendarView)}>
          <SelectTrigger className="w-[120px] sm:w-[150px]">
            <SelectValue placeholder="Seleccionar vista" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Día</SelectItem>
            <SelectItem value="week">Semana</SelectItem>
            <SelectItem value="month">Mes</SelectItem>
            <SelectItem value="year">Año</SelectItem>
          </SelectContent>
        </Select>
        <div>
          <Button onClick={() => {
            setNewReminder({
              description: "", 
              amount: 0, 
              date: viewDate, 
              recurrence: "none", 
              endDate: null, 
              isPayment: false
            });
            setNewReminderOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Recordatorio</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CalendarControls; 