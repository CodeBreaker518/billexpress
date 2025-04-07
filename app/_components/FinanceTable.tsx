"use client";

import { Edit, Calendar, Clock, Tag } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Separator } from "./ui/separator";
import { CategoryBadge } from "./ui/category-badge";
import AlertDeleteTableElement from "./AlertDeleteTableElement";
import type { FinanceItem } from './FinanceForm';

interface FinanceTableProps {
  items: FinanceItem[];
  loading: boolean;
  type: "income" | "expense";
  onEdit: (item: FinanceItem) => void;
  onDelete: (id: string) => void;
}

export function FinanceTable({ items, loading, type, onEdit, onDelete }: FinanceTableProps) {
  const formatDateTime = (date: Date) => {
    if (!date) return "-";
    const dateObj = new Date(date);
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3 text-gray-500" />
          <span className="text-xs sm:text-sm">{format(dateObj, "dd MMM yyyy", { locale: es })}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-gray-500" />
          <span className="text-xs sm:text-sm">{format(dateObj, "HH:mm", { locale: es })}</span>
        </div>
      </div>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  if (loading) {
    return <div className="text-center py-4">Cargando...</div>;
  }

  if (!items || items.length === 0) {
    return <div className="text-center py-4">No hay {type === "income" ? "ingresos" : "gastos"} registrados.</div>;
  }

  // Renderización para móviles: tarjetas en lugar de tabla
  const renderMobileView = () => {
    return (
      <div className="space-y-3 sm:hidden">
        {items.map((item) => (
          <Card key={item.id} className="p-3">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium truncate max-w-[70%]">{item.description}</h3>
              <span className={`font-bold ${type === "income" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{formatCurrency(item.amount)}</span>
            </div>

            <div className="flex flex-wrap items-start gap-3 justify-between mb-2">
              <div className="flex items-center gap-1">
                <Tag className="h-3 w-3 text-gray-500" />
                <CategoryBadge category={item.category} type={type} />
              </div>

              <div className="text-xs text-gray-500">
                {item.date && (
                  <>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(item.date), "dd MMM yyyy", { locale: es })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{format(new Date(item.date), "HH:mm", { locale: es })}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <Separator className="my-2" />

            <div className="flex justify-end gap-1 mt-2">
              <Button size="sm" variant="outline" className="h-8 px-2 text-blue-600" onClick={() => onEdit(item)}>
                <Edit className="h-3 w-3 mr-1" />
                Editar
              </Button>
              <AlertDeleteTableElement onDelete={() => onDelete(item.id)} />
            </div>
          </Card>
        ))}
      </div>
    );
  };

  // Vista de escritorio: tabla estándar
  return (
    <>
      {/* Vista móvil */}
      {renderMobileView()}

      {/* Vista de escritorio */}
      <div className="hidden sm:block overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descripción</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Fecha y Hora</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                <TableCell>
                  <CategoryBadge category={item.category} type={type} />
                </TableCell>
                <TableCell>{formatDateTime(item.date)}</TableCell>
                <TableCell className={type === "income" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                  {formatCurrency(item.amount)}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="h-8 px-2 text-blue-600" onClick={() => onEdit(item)}>
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <AlertDeleteTableElement onDelete={() => onDelete(item.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

export default FinanceTable;
