'use client';

import { 
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Badge,
  Button,
  Text,
  Flex
} from '@tremor/react';
import { Edit, Trash2, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface FinanceItem {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
}

interface FinanceTableProps {
  items: FinanceItem[];
  loading: boolean;
  type: 'income' | 'expense';
  onEdit: (item: FinanceItem) => void;
  onDelete: (id: string) => void;
}

export default function FinanceTable({
  items,
  loading,
  type,
  onEdit,
  onDelete
}: FinanceTableProps) {
  const formatDateTime = (date: Date) => {
    if (!date) return '-';
    const dateObj = new Date(date);
    return (
      <Flex alignItems="start" className="flex-col gap-1">
        <Flex alignItems="center" className="gap-1">
          <Calendar className="h-3 w-3 text-gray-500" />
          <span>{format(dateObj, 'dd MMM yyyy', { locale: es })}</span>
        </Flex>
        <Flex alignItems="center" className="gap-1">
          <Clock className="h-3 w-3 text-gray-500" />
          <span>{format(dateObj, 'HH:mm', { locale: es })}</span>
        </Flex>
      </Flex>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const getCategoryColor = (category: string, type: 'income' | 'expense') => {
    if (type === 'income') {
      switch (category) {
        case 'Salario': return 'green';
        case 'Freelance': return 'blue';
        case 'Inversiones': return 'violet';
        case 'Ventas': return 'orange';
        default: return 'gray';
      }
    } else {
      switch (category) {
        case 'Comida': return 'red';
        case 'Transporte': return 'orange';
        case 'Entretenimiento': return 'purple';
        case 'Servicios': return 'blue';
        case 'Salud': return 'green';
        default: return 'gray';
      }
    }
  };

  if (loading) {
    return <div className="text-center py-4">Cargando...</div>;
  }

  if (items.length === 0) {
    return <div className="text-center py-4">No hay {type === 'income' ? 'ingresos' : 'gastos'} registrados.</div>;
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Descripción</TableHeaderCell>
          <TableHeaderCell>Categoría</TableHeaderCell>
          <TableHeaderCell>Fecha y Hora</TableHeaderCell>
          <TableHeaderCell>Monto</TableHeaderCell>
          <TableHeaderCell>Acciones</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.description}</TableCell>
            <TableCell>
              <Badge color={getCategoryColor(item.category, type)}>
                {item.category}
              </Badge>
            </TableCell>
            <TableCell>{formatDateTime(item.date)}</TableCell>
            <TableCell className={type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {formatCurrency(item.amount)}
            </TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button
                  size="xs"
                  variant="light"
                  color="blue"
                  icon={Edit}
                  onClick={() => onEdit(item)}
                >
                  Editar
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  color="red"
                  icon={Trash2}
                  onClick={() => onDelete(item.id)}
                >
                  Eliminar
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 