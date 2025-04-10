"use client";

import { useEffect, useState, useCallback, memo } from "react";
import { format } from "date-fns";
import { Label } from "@bill/_components/ui/label";
import { Input } from "@bill/_components/ui/input";
import { Button } from "@bill/_components/ui/button";
import { FinanceItem } from "@bill/_firebase/financeService";
import { CategorySelect } from "@bill/_components/CategorySelect";
import { useAccountStore } from "@bill/_store/useAccountStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bill/_components/ui/select";
import { Loader2 } from "lucide-react";
import { Textarea } from "@bill/_components/ui/textarea";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "@bill/_lib/utils/categoryConfig";
import { IncomeCategoryType, ExpenseCategoryType, CategoryConfig } from "@bill/_lib/utils/types";
import { ChangeEvent } from "react";

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

export const FinanceForm = memo(function FinanceForm({ 
  isEditing, 
  currentItem,
  categories = [], 
  type, 
  onCancel, 
  onSave, 
  onChange 
}: FinanceFormProps) {
  // Solo mantenemos estados para funcionalidad interna del formulario
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado para cuentas
  const { accounts, activeAccountId, loading: accountsLoading } = useAccountStore();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Actualizamos selectedAccountId cuando cambia el currentItem
  useEffect(() => {
    if (currentItem && currentItem.accountId) {
      setSelectedAccountId(currentItem.accountId);
    } else if (!selectedAccountId && activeAccountId && !isEditing) {
      // Solo usar activeAccountId como valor predeterminado si NO estamos editando
      setSelectedAccountId(activeAccountId);
    }
  }, [currentItem, activeAccountId, selectedAccountId, isEditing]);

  // Actualizar cuenta seleccionada cuando cambia la cuenta activa o cuando se cargan las cuentas
  useEffect(() => {
    if (!selectedAccountId) {
      // Si no estamos editando y hay cuentas disponibles, seleccionar la cuenta activa o la primera cuenta
      if (accounts.length > 0 && !isEditing) {
        const defaultAccount = accounts.find(acc => acc.isDefault);
        setSelectedAccountId(activeAccountId || (defaultAccount ? defaultAccount.id : accounts[0].id));
      }
    }
  }, [accounts, activeAccountId, selectedAccountId, isEditing]);

  // Manejador para los cambios en los campos
  const handleChange = useCallback(
    (field: string, value: unknown) => {
      // Notificar al componente padre para actualizar el estado global
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
    if (!currentItem) return false;
    
    if (!currentItem.description?.trim()) {
      setError("La descripción es obligatoria");
      return false;
    }

    if (!currentItem.amount || currentItem.amount <= 0) {
      setError(`El ${type === "income" ? "ingreso" : "gasto"} debe ser mayor que cero`);
      return false;
    }

    if (!currentItem.category) {
      setError("Debe seleccionar una categoría");
      return false;
    }

    return true;
  }, [currentItem, type]);

  // Manejador de envío del formulario
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!currentItem) return;

      // Validar el formulario
      if (!validateForm()) return;

      try {
        setIsSubmitting(true);

        // Combinar fecha y hora
        const dateObj = new Date(currentItem.date || new Date());
        if (currentItem.time) {
          const [hours, minutes] = currentItem.time.split(":").map(Number);
          dateObj.setHours(hours, minutes);
        }

        // Asegurarse de tener una cuenta válida
        const accountToUse = selectedAccountId || activeAccountId;

        // Si no hay cuenta seleccionada o activa, mostrar un error
        if (!accountToUse) {
          setError("Debe seleccionar una cuenta");
          setIsSubmitting(false);
          return;
        }

        // Crear objeto a guardar con conversiones explícitas para evitar problemas de tipo
        const itemToSave: Partial<FinanceItem> = {
          id: currentItem.id || "",
          description: String(currentItem.description || ""),
          amount: Number(currentItem.amount) || 0,
          category: String(currentItem.category || (categories.length > 0 ? categories[0] : "")),
          date: dateObj,
          accountId: String(accountToUse),
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
    [currentItem, validateForm, categories, onSave, onCancel, selectedAccountId, activeAccountId]
  );

  // Gestión de cambio de campos específicos - Ahora solo notifican al padre
  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
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

  // Si no hay currentItem, no renderizar nada
  if (!currentItem) return null;

  // Renderizar el formulario usando directamente currentItem como fuente de verdad
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">{error}</div>}

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={currentItem.description || ""}
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
          value={currentItem.amount !== undefined ? currentItem.amount : ""}
          onChange={handleAmountChange}
          min="0.01"
          step="0.01"
          placeholder={`${type === "income" ? "Ingreso" : "Gasto"} en pesos`}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Categoría</Label>
        <CategorySelect 
          type={type}
          value={currentItem.category || ""}
          onValueChange={handleCategoryChange}
          id="category"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Fecha</Label>
          <Input 
            id="date" 
            type="date" 
            value={currentItem.date ? format(new Date(currentItem.date), "yyyy-MM-dd") : ""} 
            onChange={handleDateChange} 
            required 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">Hora</Label>
          <Input 
            id="time" 
            type="time" 
            value={currentItem.time || ""} 
            onChange={handleTimeChange} 
            required 
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="account">Cuenta</Label>
        {accountsLoading ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Cargando cuentas...</span>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-sm text-destructive">
            No hay cuentas disponibles. Por favor, crea una cuenta primero.
          </div>
        ) : (
          <Select
            value={selectedAccountId || undefined}
            onValueChange={(value) => {
              setSelectedAccountId(value);
              handleChange("accountId", value);
            }}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una cuenta" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: account.color }} />
                    <span>{account.name} {account.isDefault && "(Principal)"}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : isEditing ? (
            "Actualizar"
          ) : (
            "Guardar"
          )}
        </Button>
      </div>
    </form>
  );
});

export default FinanceForm;
