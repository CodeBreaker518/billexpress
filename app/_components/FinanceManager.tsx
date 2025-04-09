"use client";

import { useCallback, useMemo, useState } from "react";
import { isValid } from "date-fns";
import { FinanceItem } from "@bill/_firebase/financeService";
import FinanceForm from "./FinanceForm";
import SearchBar from "./SearchBar";
import FinanceTable from "./FinanceTable";
import { Card } from "./ui/card";
import { DrawerDialog } from "./ui/drawer-dialog";

export interface FinanceManagerProps {
  type: "income" | "expense";
  categories: string[];
  items: FinanceItem[];
  loading: boolean;
  user: {
    uid: string;
    [key: string]: unknown;
  };
  onAdd: (item: Omit<FinanceItem, "id">) => Promise<FinanceItem>;
  onUpdate: (item: FinanceItem) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReload: () => Promise<void>;
}

export default function FinanceManager({ type, categories, items, loading, user, onAdd, onUpdate, onDelete, onReload }: FinanceManagerProps) {
  // Estado local
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<FinanceItem & { time?: string }>>({});

  // Filtrar items según el término de búsqueda
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (!searchTerm.trim()) return true;
      const search = searchTerm.toLowerCase();
      return item.description.toLowerCase().includes(search) || item.category.toLowerCase().includes(search) || item.amount.toString().includes(search);
    });
  }, [items, searchTerm]);

  // Crear nuevo item
  const handleNew = useCallback(() => {
    setIsEditing(false);
    setCurrentItem({
      description: "",
      amount: 0,
      category: categories[0],
      date: new Date(),
    });
    setIsFormOpen(true);
  }, [categories]);

  // Editar item existente
  const handleEdit = useCallback((item: FinanceItem) => {
    setIsEditing(true);
    setCurrentItem({
      ...item,
      date: new Date(item.date),
    });
    setIsFormOpen(true);
  }, []);

  // Cerrar formulario
  const handleCancel = useCallback(() => {
    setIsFormOpen(false);
  }, []);

  // Manejar cambios en el formulario
  const handleFormChange = useCallback((field: string, value: unknown) => {
    setCurrentItem((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Guardar (nuevo o editado)
  const handleSave = useCallback(
    async (formData: Partial<FinanceItem & { time?: string }>) => {
      if (!user) return;
      if (!formData.description || !formData.amount || formData.amount <= 0 || !isValid(formData.date)) {
        throw new Error("Datos incompletos o inválidos");
      }

      try {
        if (isEditing && formData.id) {
          // Actualizar item existente
          const updatedItem = {
            id: formData.id,
            description: formData.description,
            amount: Number(formData.amount),
            category: formData.category || categories[0],
            date: formData.date || new Date(),
            userId: user.uid,
          } as FinanceItem;

          await onUpdate(updatedItem);
        } else {
          // Añadir nuevo item
          await onAdd({
            description: formData.description || "",
            amount: Number(formData.amount) || 0,
            category: formData.category || categories[0],
            date: formData.date || new Date(),
            userId: user.uid,
          });
        }

        // Todo salió bien, recargar datos
        await onReload();
      } catch (error) {
        console.error(`Error saving ${type}:`, error);
        throw error;
      }
    },
    [user, isEditing, categories, onUpdate, onAdd, onReload, type]
  );

  // Eliminar item
  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm(`¿Estás seguro de que deseas eliminar este ${type === "income" ? "ingreso" : "gasto"}?`)) return;

      try {
        await onDelete(id);

        // Recargar datos
        await onReload();
      } catch (error) {
        console.error(`Error deleting ${type}:`, error);
        alert(`Ocurrió un error al eliminar. Por favor, intenta de nuevo.`);
      }
    },
    [type, onDelete, onReload]
  );

  return (
    <>
      {/* Barra de búsqueda y botón para añadir */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddNew={handleNew}
        placeholder={`Buscar ${type === "income" ? "ingresos" : "gastos"}...`}
        addButtonLabel={`Nuevo ${type === "income" ? "Ingreso" : "Gasto"}`}
      />

      {/* Tabla de items */}
      <Card>
        <FinanceTable items={filteredItems} loading={loading} type={type} onEdit={handleEdit} onDelete={handleDelete} />
      </Card>

      {/* Formulario modal */}
      <DrawerDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) handleCancel();
        }}
        title={isEditing ? `Editar ${type === "income" ? "Ingreso" : "Gasto"}` : `Nuevo ${type === "income" ? "Ingreso" : "Gasto"}`}>
        <FinanceForm
          isOpen={isFormOpen}
          isEditing={isEditing}
          currentItem={currentItem}
          categories={categories}
          title={type === "income" ? "Ingreso" : "Gasto"}
          type={type}
          onCancel={handleCancel}
          onSave={handleSave}
          onChange={handleFormChange}
        />
      </DrawerDialog>
    </>
  );
}
