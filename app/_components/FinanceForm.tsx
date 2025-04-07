'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Label } from '@bill/_components/ui/label';
import { Input } from '@bill/_components/ui/input';
import { Button } from '@bill/_components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@bill/_components/ui/select';
import { FinanceItem } from '@bill/_firebase/financeService';

export interface FinanceFormProps {
  isOpen: boolean;
  isEditing: boolean;
  currentItem: Partial<FinanceItem & { time?: string }> | null;
  categories: string[];
  title: string;
  type: 'income' | 'expense';
  onCancel: () => void;
  onSave: (item: Partial<FinanceItem & { time?: string }>) => Promise<void>;
  onChange?: (field: string, value: any) => void;
}

export function FinanceForm({
  isEditing,
  currentItem,
  categories = [],
  type,
  onCancel,
  onSave,
  onChange
}: FinanceFormProps) {
  // Estado para manejar el formulario
  const [formData, setFormData] = useState<Partial<FinanceItem & { time?: string }>>({
    id: '',
    description: '',
    amount: 0,
    category: categories.length > 0 ? categories[0] : '',
    date: new Date(),
    time: format(new Date(), 'HH:mm')
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Actualizar el formulario cuando cambia el item actual
  useEffect(() => {
    if (currentItem) {
      setFormData({
        ...currentItem,
        time: currentItem.date ? format(new Date(currentItem.date), 'HH:mm') : format(new Date(), 'HH:mm')
      });
    } else {
      // Reset form cuando no hay item
      setFormData({
        id: '',
        description: '',
        amount: 0,
        category: categories.length > 0 ? categories[0] : '',
        date: new Date(),
        time: format(new Date(), 'HH:mm')
      });
    }
  }, [currentItem, categories]);

  // Manejador de cambios en el formulario
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // También notificar al componente padre si se proporcionó onChange
    if (onChange) {
      onChange(field, value);
    }
    
    // Limpiar errores al editar
    if (error) setError(null);
  };

  // Manejador de envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.description?.trim()) {
      setError('La descripción es obligatoria');
      return;
    }
    
    if (!formData.amount || formData.amount <= 0) {
      setError(`El ${type === 'income' ? 'ingreso' : 'gasto'} debe ser mayor que cero`);
      return;
    }
    
    if (!formData.category) {
      setError('Debe seleccionar una categoría');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Combinar fecha y hora
      const dateObj = new Date(formData.date || new Date());
      if (formData.time) {
        const [hours, minutes] = formData.time.split(':').map(Number);
        dateObj.setHours(hours, minutes);
      }
      
      // Crear objeto a guardar
      const itemToSave: Partial<FinanceItem> = {
        id: formData.id || '',
        description: formData.description || '',
        amount: Number(formData.amount) || 0,
        category: formData.category || (categories.length > 0 ? categories[0] : ''),
        date: dateObj
      };
      
      await onSave(itemToSave);
      onCancel(); // Cerrar modal después de guardar
    } catch (err) {
      console.error('Error al guardar:', err);
      setError('Error al guardar los datos. Intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render del formulario
  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Input 
          id="description" 
          value={formData.description || ''} 
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder={`Ej. ${type === 'income' ? 'Pago de salario' : 'Compra de supermercado'}`}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="amount">Monto</Label>
        <Input 
          id="amount" 
          type="number" 
          value={formData.amount || ''} 
          onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
          min="0.01" 
          step="0.01"
          placeholder={`${type === 'income' ? 'Ingreso' : 'Gasto'} en pesos`}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="category">Categoría</Label>
        <Select 
          value={formData.category || ''} 
          onValueChange={(value) => handleChange('category', value)}
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="Selecciona una categoría" />
          </SelectTrigger>
          <SelectContent>
            {categories.length > 0 ? (
              categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="">Sin categorías</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Fecha</Label>
          <Input 
            id="date" 
            type="date" 
            value={formData.date ? format(new Date(formData.date), 'yyyy-MM-dd') : ''} 
            onChange={(e) => {
              const newDate = e.target.value ? new Date(e.target.value) : new Date();
              handleChange('date', newDate);
            }}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="time">Hora</Label>
          <Input 
            id="time" 
            type="time" 
            value={formData.time || ''} 
            onChange={(e) => handleChange('time', e.target.value)}
            required
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button 
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button 
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}

export default FinanceForm;
