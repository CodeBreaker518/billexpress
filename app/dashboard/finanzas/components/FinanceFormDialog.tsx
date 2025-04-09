"use client";

import { useFinanceStore } from "@bill/_store/useFinanceStore";
import { DrawerDialog } from "@bill/_components/ui/drawer-dialog";
import { DialogDescription } from "@bill/_components/ui/dialog";
import FinanceForm from "@bill/_components/FinanceForm";

export default function FinanceFormDialog() {
  const { isFormOpen, isEditing, formType, currentItem, handleCancel, handleSave, handleFormChange, expenseCategories, incomeCategories } = useFinanceStore();

  return (
    <DrawerDialog
      open={isFormOpen}
      onOpenChange={(open) => {
        if (!open) handleCancel();
      }}
      title={isEditing ? `Editar ${formType === "income" ? "Ingreso" : "Gasto"}` : `Nuevo ${formType === "income" ? "Ingreso" : "Gasto"}`}
      description={
        <DialogDescription>
          {isEditing ? `Edita los detalles del ${formType === "income" ? "ingreso" : "gasto"} seleccionado.` : `Agrega un nuevo ${formType === "income" ? "ingreso" : "gasto"}.`}
        </DialogDescription>
      }>
      <FinanceForm
        isOpen={isFormOpen}
        isEditing={isEditing}
        currentItem={currentItem}
        categories={formType === "income" ? incomeCategories : expenseCategories}
        title={formType === "income" ? "Ingreso" : "Gasto"}
        type={formType}
        onCancel={handleCancel}
        onSave={handleSave}
        onChange={handleFormChange}
      />
    </DrawerDialog>
  );
}
