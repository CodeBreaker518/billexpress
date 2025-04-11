"use client";

import React from 'react';
import { useMediaQuery } from "@bill/_hooks/useMediaQuery";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@bill/_components/ui/alert-dialog";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@bill/_components/ui/tooltip";
import { Info } from 'lucide-react';

// Define the hint texts here or pass as props if they might vary
const csvHint = "Datos sin procesar. Ideal para importar en BillExpress o procesar con otras herramientas (Excel, Sheets). Contiene solo las transacciones.";
const pdfHint = "Reporte visual completo con resúmenes, saldos y gráficos. Perfecto para archivar o compartir.";

export default function FormatInfoHint() {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const hintContent = (
    <div className="space-y-1">
      <p>
        <strong className="font-medium">CSV (Datos sin Procesar):</strong> {csvHint}
      </p>
      <p>
        <strong className="font-medium">PDF (Reporte Completo):</strong> {pdfHint}
      </p>
    </div>
  );

  if (isDesktop) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            {/* Using a span for TooltipTrigger compatibility */}
            <span tabIndex={0} className="cursor-help inline-flex items-center justify-center">
              <Info className="h-4 w-4 text-muted-foreground" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" align="center" className="max-w-xs text-xs">
            {hintContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  } else {
    // Mobile uses AlertDialog
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button aria-label="Información sobre formatos">
            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Formatos de Exportación</AlertDialogTitle>
            <AlertDialogDescription asChild className="pt-2">
              {/* Use asChild and div to prevent <p> nesting */}
              <div>{hintContent}</div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Entendido</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }
} 