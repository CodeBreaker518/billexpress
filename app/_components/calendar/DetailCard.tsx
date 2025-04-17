"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, ArrowRight, CreditCard, AlertCircle, DollarSign, BellRing } from "lucide-react";
import { Button } from "@bill/_components/ui/button";
import { cn } from "@bill/_lib/utils";
import { SelectedItemDetail, CalendarView } from "./types";
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerFooter,
  DrawerClose,
  DrawerTitle,
} from "@bill/_components/ui/drawer";

interface DetailCardProps {
  selectedItemDetail: SelectedItemDetail;
  isMobile: boolean;
  windowWidth: number;
  closeItemDetail: () => void;
  toggleReminderStatus: (id: string, isCompleted: boolean) => void;
  deleteReminder: (id: string) => void;
  setPreviousView: (view: CalendarView) => void;
  setSelectedDate: (date: Date) => void;
  setViewDate: (date: Date) => void;
  setCurrentView: (view: CalendarView) => void;
  currentView: CalendarView;
}

export const DetailCard = ({
  selectedItemDetail,
  isMobile,
  windowWidth,
  closeItemDetail,
  toggleReminderStatus,
  deleteReminder,
  setPreviousView,
  setSelectedDate,
  setViewDate,
  setCurrentView,
  currentView
}: DetailCardProps) => {
  // Verificar si es un recordatorio y si es de tipo pago o general
  const isReminder = selectedItemDetail.item.itemType === 'reminder';
  const isPaymentReminder = isReminder && (selectedItemDetail.item as any).isPayment === true;
  const isGeneralReminder = isReminder && (selectedItemDetail.item as any).isPayment === false;
  
  // Determinar el tipo de recordatorio para mostrar en la cabecera
  const reminderTypeText = isPaymentReminder ? 'Recordatorio de pago' : 'Recordatorio general';
  
  // Determinar el icono y color para los recordatorios
  const getReminderIconAndColor = () => {
    if (isPaymentReminder) {
      return {
        icon: <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />,
        colorClass: (selectedItemDetail.item as any).isCompleted ? 'text-gray-500' : 'text-green-500'
      };
    } else {
      return {
        icon: <BellRing className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />,
        colorClass: (selectedItemDetail.item as any).isCompleted ? 'text-gray-500' : 'text-amber-500'
      };
    }
  };
  
  const { icon, colorClass } = isReminder ? getReminderIconAndColor() : { icon: null, colorClass: '' };
  
  // Contenido de la tarjeta de detalles
  const renderDetailContent = () => (
    <>
      {/* Barra superior de color según el tipo */}
      <div className={cn(
        "h-1.5 sm:h-2 w-full",
        selectedItemDetail.item.itemType === 'transaction'
          ? selectedItemDetail.item.type === 'income' ? 'bg-blue-500' : 'bg-red-500'
          : isPaymentReminder
              ? (selectedItemDetail.item as any).isCompleted ? 'bg-gray-400' : 'bg-green-500'
              : (selectedItemDetail.item as any).isCompleted ? 'bg-gray-400' : 'bg-amber-500'
      )} />
      
      {/* Cabecera con título principal */}
      <div className="p-3 sm:p-4 flex justify-between items-start">
        <div>
          <h3 className={cn(
            "text-base sm:text-lg font-semibold line-clamp-2",
            (selectedItemDetail.item as any).isCompleted && isReminder && "text-gray-500 line-through"
          )}>
            {selectedItemDetail.item.description}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {selectedItemDetail.item.itemType === 'transaction' 
              ? selectedItemDetail.item.type === 'income' ? 'Ingreso' : 'Gasto'
              : reminderTypeText}
            {selectedItemDetail.item.itemType === 'transaction' && (
              <> • <span className="capitalize">{selectedItemDetail.item.category}</span></>
            )}
            {isReminder && (selectedItemDetail.item as any).recurrence && (selectedItemDetail.item as any).recurrence !== "none" && (
              <> • <span className="italic">Recurrente</span></>
            )}
          </p>
        </div>
        {!isMobile && (
          <button 
            onClick={closeItemDetail} 
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Cantidad destacada - Mostrar solo para transacciones y recordatorios de pago */}
      {(selectedItemDetail.item.itemType === 'transaction' || isPaymentReminder) && (
        <div className={cn(
          "px-3 sm:px-4 py-2 sm:py-3 text-xl sm:text-2xl font-bold flex items-center",
          selectedItemDetail.item.itemType === 'transaction'
            ? selectedItemDetail.item.type === 'income' ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
            : (selectedItemDetail.item as any).isCompleted ? 'text-gray-500 dark:text-gray-400' : 'text-green-600 dark:text-green-400'
        )}>
          {selectedItemDetail.item.itemType === 'transaction' && selectedItemDetail.item.type === 'income' && '+'}
          {selectedItemDetail.item.itemType === 'transaction' && selectedItemDetail.item.type === 'expense' && '-'}
          ${selectedItemDetail.item.amount.toFixed(2)}
        </div>
      )}
      
      {/* Información de tiempo */}
      <div className="px-3 sm:px-4 pb-2 sm:pb-3 border-b dark:border-gray-700 flex items-center">
        <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 mr-1.5 sm:mr-2" />
        <div className="text-xs sm:text-sm">
          {format(selectedItemDetail.item.date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
        </div>
      </div>
      
      {/* Detalles adicionales */}
      {selectedItemDetail.item.itemType === 'transaction' && (
        <div className="p-3 sm:p-4 flex items-center">
          {selectedItemDetail.item.type === 'income' ? (
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 mr-1.5 sm:mr-2" />
          ) : (
            <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 mr-1.5 sm:mr-2" />
          )}
          <div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Categoría</div>
            <div className="text-sm sm:text-base font-medium">{selectedItemDetail.item.category}</div>
          </div>
        </div>
      )}
      
      {/* Acciones para recordatorios */}
      {isReminder && (
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div className="flex items-center">
            <span className={colorClass}>
              {icon}
            </span>
            <div>
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Estado</div>
              <div className="text-sm sm:text-base font-medium">
                {(selectedItemDetail.item as any).isCompleted ? "Completado" : "Pendiente"}
                {(selectedItemDetail.item as any).isFutureRecurrence && (
                  <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[10px] sm:text-xs rounded-full dark:bg-blue-900/30 dark:text-blue-400">
                    Ocurrencia futura
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Mostrar información de recurrencia si existe */}
          {(selectedItemDetail.item as any).recurrence && (selectedItemDetail.item as any).recurrence !== "none" && (
            <div className="flex items-center">
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 rotate-90 mr-1.5 sm:mr-2" />
              <div>
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Recurrencia</div>
                <div className="text-sm sm:text-base font-medium capitalize">
                  {(selectedItemDetail.item as any).recurrence === "daily" && "Diario"}
                  {(selectedItemDetail.item as any).recurrence === "weekly" && "Semanal"}
                  {(selectedItemDetail.item as any).recurrence === "monthly" && "Mensual"}
                  {(selectedItemDetail.item as any).recurrence === "yearly" && "Anual"}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-between space-x-2 pt-3 border-t dark:border-gray-700">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
              disabled={(selectedItemDetail.item as any).isFutureRecurrence}
              onClick={() => {
                toggleReminderStatus(
                  selectedItemDetail.item.id, 
                  !(selectedItemDetail.item as any).isCompleted
                );
                closeItemDetail();
              }}
            >
              {(selectedItemDetail.item as any).isCompleted ? "Marcar pendiente" : "Marcar completado"}
              {(selectedItemDetail.item as any).isFutureRecurrence && (
                <span className="sr-only">(Solo disponible en su fecha)</span>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs sm:text-sm h-8 sm:h-9 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
              disabled={(selectedItemDetail.item as any).isFutureRecurrence}
              onClick={() => {
                deleteReminder(selectedItemDetail.item.id);
                closeItemDetail();
              }}
            >
              {(selectedItemDetail.item.itemType === 'reminder' && 
               (selectedItemDetail.item as any).recurrence && 
               (selectedItemDetail.item as any).recurrence !== "none") 
                ? "Dar de baja" 
                : "Eliminar"}
              {(selectedItemDetail.item as any).isFutureRecurrence && (
                <span className="sr-only">(Solo disponible en su fecha)</span>
              )}
            </Button>
          </div>
        </div>
      )}
      
      {/* Botón para ver en detalle */}
      <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-900/30 flex justify-end border-t dark:border-gray-700">
        <Button
          size="sm"
          variant="ghost"
          className="text-xs sm:text-sm h-8 sm:h-9 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          onClick={() => {
            setPreviousView(currentView);
            setSelectedDate(selectedItemDetail.item.date);
            setViewDate(selectedItemDetail.item.date);
            setCurrentView('day');
            closeItemDetail();
          }}
        >
          Ver en vista diaria
        </Button>
      </div>
    </>
  );
  
  // Renderizar como drawer en móvil, tarjeta en escritorio
  return isMobile ? (
    <Drawer open={true} onOpenChange={(open) => !open && closeItemDetail()}>
      <DrawerContent className="max-h-[85vh] overflow-auto">
        <DrawerTitle>
          <span className="sr-only">
            {selectedItemDetail.item.description}
          </span>
        </DrawerTitle>
        {renderDetailContent()}
      </DrawerContent>
    </Drawer>
  ) : (
    <>
      <div 
        className="fixed inset-0 z-30" 
        onClick={closeItemDetail}
      />
      
      <div 
        className="fixed z-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-0 border border-gray-200 dark:border-gray-700 w-[350px] max-w-[95vw] overflow-hidden calendar-detail-card"
        style={{
          top: `${Math.min(selectedItemDetail.position.y, windowWidth > 0 ? window.innerHeight - 350 : 100)}px`,
          ...(selectedItemDetail.isRightSide ? {
            right: `${Math.max(windowWidth - selectedItemDetail.position.x, 5)}px`,
            left: 'auto',
            transform: 'translateY(8px)'
          } : {
            left: `${Math.max(selectedItemDetail.position.x, 5)}px`,
            transform: 'translateY(8px)'
          })
        }}
      >
        {renderDetailContent()}
      </div>
    </>
  );
};

export default DetailCard; 