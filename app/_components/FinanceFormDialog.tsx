"use client";

import { useState } from "react";
import { format } from "date-fns";
import { DrawerDialog } from "@bill/_components/ui/drawer-dialog";
import { DialogDescription } from "@bill/_components/ui/dialog";
import FinanceForm from "@bill/_components/FinanceForm";
import { useFinanceStore } from "@bill/_store/useFinanceStore";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "@bill/_lib/utils/categoryConfig";

export default function FinanceFormDialog() {
  const { isFormOpen, formType, isEditing, currentItem, handleCancel, handleSave, handleFormChange } = useFinanceStore();

  // Obtener las categorías según el tipo de formulario
  const categories = formType === "income" ? Object.keys(INCOME_CATEGORIES) : Object.keys(EXPENSE_CATEGORIES);

  return (
    <DrawerDialog
      open={isFormOpen}
      onOpenChange={(open) => {
        if (!open) handleCancel();
      }}
      title={isEditing ? `Editar ${formType === "income" ? "Ingreso" : "Gasto"}` : `Nuevo ${formType === "income" ? "Ingreso" : "Gasto"}`}
      description={
        <DialogDescription>
          {isEditing
            ? `Edita los detalles del ${formType === "income" ? "ingreso" : "gasto"} seleccionado.`
            : `Agrega un nuevo ${formType === "income" ? "ingreso" : "gasto"}.`}
        </DialogDescription>
      }>
      <FinanceForm
        isOpen={isFormOpen}
        isEditing={isEditing}
        currentItem={currentItem}
        categories={categories}
        title={formType === "income" ? "Ingreso" : "Gasto"}
        type={formType}
        onCancel={handleCancel}
        onSave={handleSave}
        onChange={handleFormChange}
      />
    </DrawerDialog>
  );
} 