"use client";

import { useEffect, useState, useCallback, memo } from "react";
import { format } from "date-fns";
import { Label } from "@bill/_components/ui/label";
import { Input } from "@bill/_components/ui/input";
import { Button } from "@bill/_components/ui/button";
import { FinanceItem } from "@bill/_firebase/financeService";
import { CategorySelect } from "@bill/_components/CategorySelect";

export interface FinanceFormProps {
  isOpen: boolean;
  isEditing: boolean;
  currentItem: Partial<FinanceItem & { time?: string }> | null;
  categories: string[];
  title: string;
  type: "income" | "expense";
  onCancel: () => void;
  onSave: (item: Partial<FinanceItem & { time?: string }>) => Promise<void>;
  onChange?: (field: string, value: unknown) => void;
}

export const FinanceForm = memo(function FinanceForm({ isEditing, currentItem, categories = [], type, onCancel, onSave, onChange }: FinanceFormProps) {
  // Estado para manejar el formulario
  const [formData, setFormData] = useState<Partial<FinanceItem & { time?: string }>>({
    id: "",
    description: "",
    amount: 0,
    category: categories.length > 0 ? categories[0] : "",
    date: new Date(),
    time: format(new Date(), "HH:mm"),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Actualizar el formulario cuando cambia el item actual
  useEffect(() => {
    if (currentItem) {
      setFormData({
        ...currentItem,
        time: currentItem.date ? format(new Date(currentItem.date), "HH:mm") : format(new Date(), "HH:mm"),
      });
    } else {
      // Reset form cuando no hay item
      resetForm();
    }
  }, [currentItem, categories]);

  // Reiniciar el formulario a valores predeterminados
  const resetForm = useCallback(() => {
    setFormData({
      id: "",
      description: "",
      amount: 0,
      category: categories.length > 0 ? categories[0] : "",
      date: new Date(),
      time: format(new Date(), "HH:mm"),
    });
    setError(null);
  }, [categories]);

  // Manejador de cambios en el formulario
  const handleChange = useCallback(
    (field: string, value: unknown) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // También notificar al componente padre si se proporcionó onChange
      if (onChange) {
        onChange(field, value);
      }

      // Limpiar errores al editar
      if (error) setError(null);
    },
    [onChange, error]
  );

  // Validar el formulario antes de enviar
  const validateForm = useCallback(() => {
    if (!formData.description?.trim()) {
      setError("La descripción es obligatoria");
      return false;
    }

    if (!formData.amount || formData.amount <= 0) {
      setError(`El ${type === "income" ? "ingreso" : "gasto"} debe ser mayor que cero`);
      return false;
    }

    if (!formData.category) {
      setError("Debe seleccionar una categoría");
      return false;
    }

    return true;
  }, [formData, type]);

  // Manejador de envío del formulario
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validar el formulario
      if (!validateForm()) return;

      try {
        setIsSubmitting(true);

        // Combinar fecha y hora
        const dateObj = new Date(formData.date || new Date());
        if (formData.time) {
          const [hours, minutes] = formData.time.split(":").map(Number);
          dateObj.setHours(hours, minutes);
        }

        // Crear objeto a guardar
        const itemToSave: Partial<FinanceItem> = {
          id: formData.id || "",
          description: formData.description || "",
          amount: Number(formData.amount) || 0,
          category: formData.category || (categories.length > 0 ? categories[0] : ""),
          date: dateObj,
        };

        await onSave(itemToSave);
        onCancel(); // Cerrar modal después de guardar
      } catch (err) {
        console.error("Error al guardar:", err);
        setError("Error al guardar los datos. Intente nuevamente.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, validateForm, categories, onSave, onCancel]
  );

  // Gestión de cambio de campos específicos
  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleChange("description", e.target.value);
    },
    [handleChange]
  );

  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleChange("amount", parseFloat(e.target.value) || 0);
    },
    [handleChange]
  );

  const handleCategoryChange = useCallback(
    (value: string) => {
      handleChange("category", value);
    },
    [handleChange]
  );

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newDate = e.target.value ? new Date(e.target.value) : new Date();
      handleChange("date", newDate);
    },
    [handleChange]
  );

  const handleTimeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleChange("time", e.target.value);
    },
    [handleChange]
  );

  // Render del formulario
  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">{error}</div>}

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Input
          id="description"
          value={formData.description || ""}
          onChange={handleDescriptionChange}
          placeholder={`Ej. ${type === "income" ? "Pago de salario" : "Compra de supermercado"}`}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Monto</Label>
        <Input
          id="amount"
          type="number"
          value={formData.amount || ""}
          onChange={handleAmountChange}
          min="0.01"
          step="0.01"
          placeholder={`${type === "income" ? "Ingreso" : "Gasto"} en pesos`}
          required
        />
      </div>

      <CategorySelect type={type} value={formData.category || ""} onValueChange={handleCategoryChange} label="Categoría" required />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Fecha</Label>
          <Input id="date" type="date" value={formData.date ? format(new Date(formData.date), "yyyy-MM-dd") : ""} onChange={handleDateChange} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">Hora</Label>
          <Input id="time" type="time" value={formData.time || ""} onChange={handleTimeChange} required />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : isEditing ? "Actualizar" : "Guardar"}
        </Button>
      </div>
    </form>
  );
});

export default FinanceForm;
