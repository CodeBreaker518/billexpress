"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@bill/_components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type ViewType = "day" | "week" | "month" | "year";

interface NavigationMenuProps {
  view: ViewType;
  currentDate: Date;
  onNavigate: (direction: "prev" | "next") => void;
  onToday: () => void;
}

export const NavigationMenu = ({
  view,
  currentDate,
  onNavigate,
  onToday,
}: NavigationMenuProps) => {
  const getDateLabel = () => {
    switch (view) {
      case "day":
        return format(currentDate, "EEEE, d 'de' MMMM yyyy", { locale: es });
      case "week":
        // First day of week
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);
        // Last day of week
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        // Format based on same month or different months
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${format(weekStart, "d", { locale: es })} - ${format(
            weekEnd,
            "d 'de' MMMM yyyy",
            { locale: es }
          )}`;
        } else if (weekStart.getFullYear() === weekEnd.getFullYear()) {
          return `${format(weekStart, "d 'de' MMMM", { locale: es })} - ${format(
            weekEnd,
            "d 'de' MMMM yyyy",
            { locale: es }
          )}`;
        } else {
          return `${format(weekStart, "d 'de' MMMM yyyy", { locale: es })} - ${format(
            weekEnd,
            "d 'de' MMMM yyyy",
            { locale: es }
          )}`;
        }
      case "month":
        return format(currentDate, "MMMM yyyy", { locale: es });
      case "year":
        return format(currentDate, "yyyy");
      default:
        return "";
    }
  };

  return (
    <div className="flex items-center">
      <Button
        variant="outline"
        className="mr-2 text-sm h-8"
        onClick={onToday}
        size="sm"
      >
        Hoy
      </Button>
      <div className="flex items-center rounded-md border">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0 rounded-r-none"
          onClick={() => onNavigate("prev")}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Anterior</span>
        </Button>
        <div className="px-3 py-1 min-w-[150px] text-center">
          {getDateLabel()}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0 rounded-l-none"
          onClick={() => onNavigate("next")}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Siguiente</span>
        </Button>
      </div>
    </div>
  );
};

export default NavigationMenu; 