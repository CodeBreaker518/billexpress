'use client';

import { useState, useEffect } from 'react';
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { FinanceItem } from '@bill/_firebase/financeService';
import { Button } from '@bill/_components/ui/button';
import { DrawerDialog } from '@bill/_components/ui/drawer-dialog';
import SearchBar from '@bill/_components/SearchBar';
import FinanceForm from '@bill/_components/FinanceForm';
import FinanceTable from '@bill/_components/FinanceTable';
import { Card } from '@bill/_components/ui/card';

export interface FinanceManagerProps {
  title: string;
  type: 'income' | 'expense';
  categories: string[];
  items: FinanceItem[];
  loading: boolean;
  user: any;
  onAdd: (item: Omit<FinanceItem, 'id'>) => Promise<FinanceItem>;
  onUpdate: (item: FinanceItem) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReload: () => Promise<void>;
}

export default function FinanceManager({
  title,
  type,
  categories,
  items,
  loading,
  user,
  onAdd,
  onUpdate,
  onDelete,
  onReload
}: FinanceManagerProps) {
  // Estado para búsqueda y filtrado
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState<FinanceItem[]>([]);
  
  // Estado para formulario
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<FinanceItem & { time?: string }>>({
    id: '',
    description: '',
    amount: 0,
    category: categories.length > 0 ? categories[0] : '',
    date: new Date(),
    time: format(new Date(), 'HH:mm')
  });

  // Filtrar items cuando cambia la búsqueda o los items
  useEffect(() => {
    if (items.length > 0) {
      const filtered = items.filter(item => 
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // Ordenar por fecha (más reciente primero)
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setFilteredItems(filtered);
    } else {
      setFilteredItems([]);
    }
  }, [items, searchTerm]);
  
  // Abrir formulario para edición
  const handleEdit = (item: FinanceItem) => {
    const itemDate = new Date(item.date);
    
    setCurrentItem({
      id: item.id,
      description: item.description,
      amount: item.amount,
      category: item.category,
      date: itemDate,
      time: format(itemDate, 'HH:mm')
    });
    setIsEditing(true);
    setIsFormOpen(true);
  };
  
  // Abrir formulario para nuevo item
  const handleNew = () => {
    const now = new Date();
    
    setCurrentItem({
      id: '',
      description: '',
      amount: 0,
      category: categories.length > 0 ? categories[0] : '',
      date: now,
      time: format(now, 'HH:mm')
    });
    setIsEditing(false);
    setIsFormOpen(true);
  };
  
  // Cerrar formulario
  const handleCancel = () => {
    setIsFormOpen(false);
  };
  
  // Manejar cambios en el formulario
  const handleFormChange = (field: string, value: any) => {
    setCurrentItem({ ...currentItem, [field]: value });
  };
  
  // Guardar (nuevo o editado)
  const handleSave = async (formData: Partial<FinanceItem & { time?: string }>) => {
    if (!user) return;
    if (!formData.description || !formData.amount || formData.amount <= 0 || !isValid(formData.date)) {
      throw new Error('Datos incompletos o inválidos');
    }
    
    try {
      // Verificar si hay conexión a internet
      const isOnline = navigator.onLine;
      
      if (isEditing && formData.id) {
        // Actualizar item existente
        const updatedItem = {
          id: formData.id,
          description: formData.description,
          amount: Number(formData.amount),
          category: formData.category || categories[0],
          date: formData.date || new Date(),
          userId: user.uid
        } as FinanceItem;
        
        await onUpdate(updatedItem);
        
        // Mostrar feedback según estado de conexión
        if (!isOnline) {
          alert(`${type === 'income' ? 'Ingreso' : 'Gasto'} actualizado en modo offline. Se sincronizará cuando recuperes conexión a internet.`);
        }
      } else {
        // Añadir nuevo item
        const newItem = await onAdd({
          description: formData.description || '',
          amount: Number(formData.amount) || 0,
          category: formData.category || categories[0],
          date: formData.date || new Date(),
          userId: user.uid
        });
        
        // Mostrar feedback según estado de conexión
        if (!isOnline) {
          alert(`${type === 'income' ? 'Ingreso' : 'Gasto'} guardado en modo offline. Se sincronizará cuando recuperes conexión a internet.`);
        }
      }
      
      // Todo salió bien, recargar datos
      await onReload();
      
    } catch (error) {
      console.error(`Error saving ${type}:`, error);
      throw error;
    }
  };
  
  // Eliminar item
  const handleDelete = async (id: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar este ${type === 'income' ? 'ingreso' : 'gasto'}?`)) return;
    
    try {
      // Verificar si hay conexión a internet
      const isOnline = navigator.onLine;
      
      await onDelete(id);
      
      // Mostrar feedback según estado de conexión
      if (!isOnline) {
        alert(`${type === 'income' ? 'Ingreso' : 'Gasto'} eliminado en modo offline. Se sincronizará cuando recuperes conexión a internet.`);
      }
      
      // Recargar datos
      await onReload();
      
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      alert(`Ocurrió un error al eliminar. Por favor, intenta de nuevo.`);
    }
  };
  
  return (
    <>
      {/* Barra de búsqueda y botón para añadir */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddNew={handleNew}
        placeholder={`Buscar ${type === 'income' ? 'ingresos' : 'gastos'}...`}
        addButtonLabel={`Nuevo ${type === 'income' ? 'Ingreso' : 'Gasto'}`}
      />
      
      {/* Tabla de items */}
      <Card>
        <FinanceTable
          items={filteredItems}
          loading={loading}
          type={type}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Card>
      
      {/* Formulario modal */}
      <DrawerDialog 
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) handleCancel();
        }}
        title={isEditing 
          ? `Editar ${type === 'income' ? 'Ingreso' : 'Gasto'}` 
          : `Nuevo ${type === 'income' ? 'Ingreso' : 'Gasto'}`
        }
      >
        <FinanceForm
          isOpen={isFormOpen}
          isEditing={isEditing}
          currentItem={currentItem}
          categories={categories}
          title={type === 'income' ? 'Ingreso' : 'Gasto'}
          type={type}
          onCancel={handleCancel}
          onSave={handleSave}
          onChange={handleFormChange}
        />
      </DrawerDialog>
    </>
  );
}
