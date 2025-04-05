'use client';

import { useState } from 'react';
import { 
  Button, 
  TextInput, 
  DatePicker, 
  Select, 
  SelectItem,
  NumberInput,
  Card,
  Title,
  Grid,
  Flex,
  Text,
  Divider
} from '@tremor/react';
import { 
  Save, 
  X, 
  FileText, 
  DollarSign, 
  Tag, 
  Calendar, 
  Clock,
  TrendingUp,
  ShoppingCart,
  Gift,
  RefreshCw,
  Utensils,
  Car,
  Home,
  Music,
  Zap,
  Heart,
  BookOpen,
  ShoppingBag
} from 'lucide-react';
import { format, isValid, parse, set } from 'date-fns';
import { es } from 'date-fns/locale';

interface FinanceItem {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
  time?: string;
}

interface FinanceFormProps {
  isOpen: boolean;
  isEditing: boolean;
  currentItem: FinanceItem;
  categories: string[];
  title: string;
  onCancel: () => void;
  onSave: () => Promise<void>;
  onChange: (field: string, value: any) => void;
}

// Componente para mostrar un ícono para una categoría específica
const CategoryIcon = ({ category, type }: { category: string, type: 'income' | 'expense' }) => {
  // Iconos para categorías de ingresos
  if (type === 'income') {
    switch (category) {
      case 'Salario': 
        return (
          <div className="p-1 rounded-full bg-green-100 dark:bg-green-900/30">
            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
        );
      case 'Freelance': 
        return (
          <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/30">
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        );
      case 'Inversiones': 
        return (
          <div className="p-1 rounded-full bg-purple-100 dark:bg-purple-900/30">
            <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
        );
      case 'Ventas': 
        return (
          <div className="p-1 rounded-full bg-orange-100 dark:bg-orange-900/30">
            <ShoppingCart className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
        );
      case 'Regalos': 
        return (
          <div className="p-1 rounded-full bg-pink-100 dark:bg-pink-900/30">
            <Gift className="h-4 w-4 text-pink-600 dark:text-pink-400" />
          </div>
        );
      case 'Reembolsos': 
        return (
          <div className="p-1 rounded-full bg-cyan-100 dark:bg-cyan-900/30">
            <RefreshCw className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          </div>
        );
      default: 
        return (
          <div className="p-1 rounded-full bg-gray-100 dark:bg-gray-800">
            <Tag className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>
        );
    }
  }
  
  // Iconos para categorías de gastos
  switch (category) {
    case 'Comida': 
      return (
        <div className="p-1 rounded-full bg-orange-100 dark:bg-orange-900/30">
          <Utensils className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </div>
      );
    case 'Transporte': 
      return (
        <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/30">
          <Car className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
      );
    case 'Vivienda': 
      return (
        <div className="p-1 rounded-full bg-green-100 dark:bg-green-900/30">
          <Home className="h-4 w-4 text-green-600 dark:text-green-400" />
        </div>
      );
    case 'Entretenimiento': 
      return (
        <div className="p-1 rounded-full bg-purple-100 dark:bg-purple-900/30">
          <Music className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        </div>
      );
    case 'Servicios': 
      return (
        <div className="p-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
          <Zap className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        </div>
      );
    case 'Salud': 
      return (
        <div className="p-1 rounded-full bg-red-100 dark:bg-red-900/30">
          <Heart className="h-4 w-4 text-red-600 dark:text-red-400" />
        </div>
      );
    case 'Educación': 
      return (
        <div className="p-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
          <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        </div>
      );
    case 'Compras': 
      return (
        <div className="p-1 rounded-full bg-amber-100 dark:bg-amber-900/30">
          <ShoppingBag className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
      );
    default: 
      return (
        <div className="p-1 rounded-full bg-gray-100 dark:bg-gray-800">
          <Tag className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </div>
      );
  }
};

// Componente para pasar directamente como prop icon al SelectItem
const CategoryIconForSelect = ({ category, type }: { category: string, type: 'income' | 'expense' }) => {
  if (type === 'income') {
    switch (category) {
      case 'Salario': 
        return (props: any) => <DollarSign {...props} color="#10B981" />;
      case 'Freelance': 
        return (props: any) => <FileText {...props} color="#3B82F6" />;
      case 'Inversiones': 
        return (props: any) => <TrendingUp {...props} color="#8B5CF6" />;
      case 'Ventas': 
        return (props: any) => <ShoppingCart {...props} color="#F97316" />;
      case 'Regalos': 
        return (props: any) => <Gift {...props} color="#EC4899" />;
      case 'Reembolsos': 
        return (props: any) => <RefreshCw {...props} color="#06B6D4" />;
      default: 
        return (props: any) => <Tag {...props} color="#6B7280" />;
    }
  }
  
  switch (category) {
    case 'Comida': 
      return (props: any) => <Utensils {...props} color="#F97316" />;
    case 'Transporte': 
      return (props: any) => <Car {...props} color="#3B82F6" />;
    case 'Vivienda': 
      return (props: any) => <Home {...props} color="#10B981" />;
    case 'Entretenimiento': 
      return (props: any) => <Music {...props} color="#8B5CF6" />;
    case 'Servicios': 
      return (props: any) => <Zap {...props} color="#EAB308" />;
    case 'Salud': 
      return (props: any) => <Heart {...props} color="#EF4444" />;
    case 'Educación': 
      return (props: any) => <BookOpen {...props} color="#6366F1" />;
    case 'Compras': 
      return (props: any) => <ShoppingBag {...props} color="#D97706" />;
    default: 
      return (props: any) => <Tag {...props} color="#6B7280" />;
  }
};

export default function FinanceForm({
  isOpen,
  isEditing,
  currentItem,
  categories,
  title,
  onCancel,
  onSave,
  onChange
}: FinanceFormProps) {
  const [loading, setLoading] = useState(false);
  const isExpense = title.toLowerCase() === 'gasto';
  
  // Determinar el tipo para los íconos de categoría
  const itemType = isExpense ? 'expense' : 'income';
  
  // Textos personalizados según el tipo (gasto o ingreso)
  const texts = {
    description: {
      label: isExpense ? 'Descripción del gasto' : 'Descripción del ingreso',
      placeholder: isExpense ? '¿En qué gastaste?' : '¿De dónde proviene este ingreso?'
    },
    amount: {
      label: isExpense ? 'Monto gastado' : 'Monto recibido',
      placeholder: isExpense ? 'Cantidad a registrar como gasto' : 'Cantidad a registrar como ingreso'
    },
    category: {
      label: isExpense ? 'Categoría de gasto' : 'Fuente de ingreso',
      placeholder: isExpense ? 'Selecciona tipo de gasto' : 'Selecciona fuente de ingreso'
    },
    button: isExpense ? 'Registrar Gasto' : 'Registrar Ingreso'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Si hay un campo de hora, incorporarlo a la fecha
      if (currentItem.time) {
        const [hours, minutes] = currentItem.time.split(':').map(Number);
        const newDate = set(new Date(currentItem.date), {
          hours,
          minutes
        });
        onChange('date', newDate);
      }
      
      await onSave();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setLoading(false);
    }
  };

  // Obtener tiempo actual formateado (HH:MM)
  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  // Configurar tiempo inicial basado en la fecha existente o tiempo actual
  const initialTime = currentItem.date instanceof Date 
    ? `${currentItem.date.getHours().toString().padStart(2, '0')}:${currentItem.date.getMinutes().toString().padStart(2, '0')}`
    : getCurrentTime();

  // Asegurar que time esté inicializado
  if (!currentItem.time) {
    onChange('time', initialTime);
  }

  if (!isOpen) return null;

  return (
    <Card className={`mb-6 ${isExpense ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-green-500'}`}>
      <div className="flex justify-between items-center mb-4">
        <Flex alignItems="center" className="gap-2">
          {isExpense ? (
            <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-2">
              <DollarSign className="h-5 w-5 text-red-500 dark:text-red-400" />
            </div>
          ) : (
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2">
              <DollarSign className="h-5 w-5 text-green-500 dark:text-green-400" />
            </div>
          )}
          <Title>{isEditing ? `Editar ${title}` : `Nuevo ${title}`}</Title>
        </Flex>
        <Button
          variant="light"
          color="gray"
          icon={X}
          onClick={onCancel}
          size="xs"
        >
          Cerrar
        </Button>
      </div>

      <Divider />

      <form onSubmit={handleSubmit} className="pt-4">
        <Grid numItemsMd={2} className="gap-4 mb-4">
          <div>
            <Text className="mb-2 font-medium">{texts.description.label}</Text>
            <TextInput
              placeholder={texts.description.placeholder}
              value={currentItem.description}
              onChange={(e) => onChange('description', e.target.value)}
              icon={FileText}
              required
              autoFocus
              className={isExpense ? "focus:border-red-500 focus:ring-red-200" : "focus:border-green-500 focus:ring-green-200"}
            />
          </div>
          
          <div>
            <Text className="mb-2 font-medium">{texts.amount.label}</Text>
            <NumberInput
              placeholder="0.00"
              value={currentItem.amount}
              onValueChange={(value) => onChange('amount', value)}
              enableStepper={false}
              icon={() => (
                <span className={isExpense ? "text-red-500 dark:text-red-400 font-bold" : "text-green-500 dark:text-green-400 font-bold"}>
                  $
                </span>
              )}
              min={0}
              required
              className={isExpense ? "focus:border-red-500 focus:ring-red-200" : "focus:border-green-500 focus:ring-green-200"}
            />
          </div>
        </Grid>
        
        <Grid numItemsMd={3} className="gap-4 mb-4">
          <div>
            <Text className="mb-2 font-medium">{texts.category.label}</Text>
            <Select
              value={currentItem.category}
              onValueChange={(value) => onChange('category', value)}
              placeholder={texts.category.placeholder}
              icon={Tag}
              className={isExpense ? "focus:border-red-500 focus:ring-red-200" : "focus:border-green-500 focus:ring-green-200"}
            >
              {categories.map((category) => (
                <SelectItem 
                  key={category} 
                  value={category} 
                  icon={CategoryIconForSelect({ category, type: itemType })}
                >
                  {category}
                </SelectItem>
              ))}
            </Select>
          </div>
          
          <div>
            <Text className="mb-2 font-medium">Fecha</Text>
            <div className="flex items-center gap-2">
              <div className={isExpense ? "text-red-500" : "text-green-500"}>
                <Calendar className="h-5 w-5" />
              </div>
              <DatePicker
                value={currentItem.date}
                onValueChange={(value) => onChange('date', value)}
                locale={es}
                placeholder="DD/MM/AAAA"
                className="w-full"
              />
            </div>
          </div>
          
          <div>
            <Text className="mb-2 font-medium">Hora</Text>
            <div className="flex items-center gap-2">
              <div className={isExpense ? "text-red-500" : "text-green-500"}>
                <Clock className="h-5 w-5" />
              </div>
              <input
                type="time"
                value={currentItem.time || initialTime}
                onChange={(e) => onChange('time', e.target.value)}
                className="w-full rounded-tremor-default text-tremor-default bg-transparent shadow-tremor-input border border-tremor-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tremor-brand-subtle dark:shadow-dark-tremor-input dark:border-dark-tremor-border dark:focus:ring-dark-tremor-brand-subtle"
              />
            </div>
          </div>
        </Grid>
        
        <Flex justifyContent="end" className="mt-6">
          <Button
            type="submit"
            loading={loading}
            disabled={loading}
            icon={Save}
            color={isExpense ? "red" : "green"}
            size="md"
          >
            {isEditing ? 'Actualizar' : texts.button}
          </Button>
        </Flex>
      </form>
    </Card>
  );
} 