"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@bill/_components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@bill/_components/ui/dialog";
import { Input } from "@bill/_components/ui/input";
import { Label } from "@bill/_components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@bill/_components/ui/select";
import { Checkbox } from "@bill/_components/ui/checkbox";
import { Calendar } from "@bill/_components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@bill/_components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { RecurrenceType } from "@bill/_components/calendar/types";
import { useState, useEffect } from "react";
import { addDays, addMonths } from "date-fns";
import { cn } from "@bill/_lib/utils";

interface ReminderDialogProps {
  newReminderOpen: boolean;
  setNewReminderOpen: (open: boolean) => void;
  newReminder: {
    description: string;
    amount: number;
    date: Date;
    recurrence: RecurrenceType;
    endDate: Date | null;
    isPayment: boolean;
  };
  setNewReminder: (value: React.SetStateAction<{
    description: string;
    amount: number;
    date: Date;
    recurrence: RecurrenceType;
    endDate: Date | null;
    isPayment: boolean;
  }>) => void;
  addReminder: () => void;
}

export const ReminderDialog = ({
  newReminderOpen,
  setNewReminderOpen,
  newReminder,
  setNewReminder,
  addReminder
}: ReminderDialogProps) => {
  const [useEndDate, setUseEndDate] = useState<boolean>(false);
  
  // Reiniciar el estado cuando se abre el diálogo
  useEffect(() => {
    if (newReminderOpen) {
      setUseEndDate(!!newReminder.endDate);
    }
  }, [newReminderOpen, newReminder.endDate]);
  
  // Manejar cambio en la recurrencia
  const handleRecurrenceChange = (value: RecurrenceType) => {
    if (value === "none") {
      // Si no hay recurrencia, eliminar la fecha de finalización
      setNewReminder((prev) => ({
        ...prev,
        recurrence: value,
        endDate: null
      }));
      setUseEndDate(false);
    } else {
      // Establecer una fecha de finalización por defecto (3 meses después)
      const defaultEndDate = addMonths(newReminder.date, 3);
      setNewReminder((prev) => ({
        ...prev,
        recurrence: value,
        endDate: useEndDate ? defaultEndDate : null
      }));
    }
  };
  
  // Manejar toggle de fecha de finalización
  const handleEndDateToggle = (checked: boolean) => {
    setUseEndDate(checked);
    if (checked) {
      // Si se activa, establecer fecha de finalización predeterminada
      setNewReminder((prev) => ({
        ...prev,
        endDate: addMonths(prev.date, 3)
      }));
    } else {
      // Si se desactiva, eliminar fecha de finalización
      setNewReminder((prev) => ({
        ...prev,
        endDate: null
      }));
    }
  };

  // Manejar cambio de tipo de recordatorio (pago o general)
  const handleReminderTypeChange = (isPayment: boolean) => {
    setNewReminder((prev) => ({
      ...prev,
      isPayment,
      // Si cambia de recordatorio general a pago, establecer un monto por defecto
      amount: isPayment ? prev.amount || 0 : 0
    }));
  };

  return (
    <Dialog open={newReminderOpen} onOpenChange={setNewReminderOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear recordatorio</DialogTitle>
          <DialogDescription>
            Agrega un nuevo recordatorio para mantenerte organizado.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Tipo de recordatorio */}
          <div className="rounded-lg border p-4 bg-slate-50 dark:bg-slate-900">
            <div className="text-sm font-medium mb-3">Tipo de recordatorio</div>
            <div className="flex items-center space-x-4">
              <div 
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-lg border cursor-pointer flex-1 text-center",
                  newReminder.isPayment 
                    ? "bg-white dark:bg-slate-800 border-blue-500 dark:border-blue-400 shadow-sm" 
                    : "bg-transparent hover:bg-white dark:hover:bg-slate-800"
                )}
                onClick={() => handleReminderTypeChange(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("text-blue-500", newReminder.isPayment ? "opacity-100" : "opacity-50")}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M16 8h-6.5a2.5 2.5 0 0 0 0 5h3a2.5 2.5 0 0 1 0 5H6" />
                  <path d="M12 18v2M12 6v2" />
                </svg>
                <span className={cn(
                  "text-sm font-medium",
                  newReminder.isPayment ? "text-blue-500" : ""
                )}>Pago</span>
              </div>
              <div 
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-lg border cursor-pointer flex-1 text-center",
                  !newReminder.isPayment 
                    ? "bg-white dark:bg-slate-800 border-blue-500 dark:border-blue-400 shadow-sm" 
                    : "bg-transparent hover:bg-white dark:hover:bg-slate-800"
                )}
                onClick={() => handleReminderTypeChange(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("text-blue-500", !newReminder.isPayment ? "opacity-100" : "opacity-50")}>
                  <path d="M12 17v.5M12 7v.5" />
                  <path d="M3 3a20 20 0 0 1 18 0" />
                  <path d="M3 10a20 20 0 0 1 18 0" />
                  <path d="M3 17a20 20 0 0 1 18 0" />
                </svg>
                <span className={cn(
                  "text-sm font-medium",
                  !newReminder.isPayment ? "text-blue-500" : ""
                )}>Recordatorio</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {newReminder.isPayment 
                ? "Para pagos y transacciones con un valor monetario." 
                : "Para tareas o eventos sin un valor monetario asociado."}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reminder-date" className="text-right">
              Fecha
            </Label>
            <div className="col-span-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="reminder-date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newReminder.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newReminder.date ? (
                      format(newReminder.date, "PPP", { locale: es })
                    ) : (
                      <span>Selecciona fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newReminder.date}
                    onSelect={(date) => setNewReminder({...newReminder, date: date || new Date()})}
                    initialFocus
                    locale={es}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reminder-description" className="text-right">
              Descripción
            </Label>
            <Input
              id="reminder-description"
              placeholder={newReminder.isPayment ? "Pago de servicios" : "Recordatorio importante"}
              className="col-span-3"
              value={newReminder.description}
              onChange={(e) => setNewReminder({...newReminder, description: e.target.value})}
            />
          </div>
          
          {/* Mostrar campo de monto solo para recordatorios de pago */}
          {newReminder.isPayment && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reminder-amount" className="text-right">
                Monto $
              </Label>
              <Input
                id="reminder-amount"
                type="number"
                placeholder="0.00"
                className="col-span-3"
                value={newReminder.amount || ""}
                onChange={(e) => setNewReminder({...newReminder, amount: parseFloat(e.target.value) || 0})}
              />
            </div>
          )}
          
          {/* Opciones de recurrencia */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">
              Repetir
            </Label>
            <div className="col-span-3">
              <Select 
                value={newReminder.recurrence || "none"} 
                onValueChange={(value) => handleRecurrenceChange(value as RecurrenceType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona frecuencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No repetir</SelectItem>
                  <SelectItem value="daily">Diariamente</SelectItem>
                  <SelectItem value="weekly">Semanalmente</SelectItem>
                  <SelectItem value="monthly">Mensualmente</SelectItem>
                  <SelectItem value="yearly">Anualmente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Opciones de finalización de recurrencia */}
          {newReminder.recurrence && newReminder.recurrence !== "none" && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Fecha límite
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Checkbox 
                    id="end-date-toggle"
                    checked={useEndDate}
                    onCheckedChange={handleEndDateToggle}
                  />
                  <Label htmlFor="end-date-toggle" className="cursor-pointer">
                    Establecer fecha de finalización
                  </Label>
                </div>
              </div>
              
              {useEndDate && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="col-start-2 col-span-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !newReminder.endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newReminder.endDate ? (
                            format(newReminder.endDate, "PPP", { locale: es })
                          ) : (
                            <span>Selecciona fecha límite</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={newReminder.endDate || undefined}
                          onSelect={(date) => setNewReminder({...newReminder, endDate: date || null})}
                          initialFocus
                          locale={es}
                          disabled={(date) => date < newReminder.date}
                          fromDate={newReminder.date}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setNewReminderOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={addReminder}>
            Guardar recordatorio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReminderDialog; 