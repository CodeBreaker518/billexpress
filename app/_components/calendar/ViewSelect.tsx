"use client";

import { CalendarIcon, ListIcon, GridIcon, Clock4Icon } from "lucide-react";
import { Button } from "@bill/_components/ui/button";
import { cn } from "@bill/_lib/utils";

type ViewType = "day" | "week" | "month" | "year";

interface ViewSelectProps {
  view: ViewType;
  setView: (view: ViewType) => void;
}

export const ViewSelect = ({ view, setView }: ViewSelectProps) => {
  return (
    <div className="flex items-center space-x-2 rounded-md border p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setView("day")}
        className={cn(
          "h-8 w-8 p-0",
          view === "day" && "bg-muted text-muted-foreground"
        )}
      >
        <span className="sr-only">Día</span>
        <Clock4Icon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setView("week")}
        className={cn(
          "h-8 w-8 p-0",
          view === "week" && "bg-muted text-muted-foreground"
        )}
      >
        <span className="sr-only">Semana</span>
        <ListIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setView("month")}
        className={cn(
          "h-8 w-8 p-0",
          view === "month" && "bg-muted text-muted-foreground"
        )}
      >
        <span className="sr-only">Mes</span>
        <CalendarIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setView("year")}
        className={cn(
          "h-8 w-8 p-0",
          view === "year" && "bg-muted text-muted-foreground"
        )}
      >
        <span className="sr-only">Año</span>
        <GridIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ViewSelect; 