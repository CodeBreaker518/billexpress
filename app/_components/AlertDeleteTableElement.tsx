import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@bill/_components/ui/alert-dialog";
import { Button } from "@bill/_components/ui/button";
import { Trash2 } from "lucide-react";

interface AlertDeleteTableElementProps {
  onDelete: () => void; // Función que se ejecuta al confirmar la eliminación
}

export default function AlertDeleteTableElement({ onDelete }: AlertDeleteTableElementProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 px-2 text-red-600">
          <Trash2 className="h-3 w-3 mr-1" />
          Eliminar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>Esta acción no se puede deshacer. El elemento será eliminado permanentemente.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete}>Confirmar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
