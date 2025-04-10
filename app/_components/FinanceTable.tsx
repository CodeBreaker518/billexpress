"use client";

import { useMemo, useState } from "react";
import { Edit, Calendar, Clock, Tag, AlertTriangle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Separator } from "./ui/separator";
import { CategoryBadge } from "./ui/category-badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import AlertDeleteTableElement from "./AlertDeleteTableElement";
import type { FinanceItem } from "@bill/_firebase/financeService";
import { useAccountStore } from "@bill/_store/useAccountStore";

interface FinanceTableProps {
  items: FinanceItem[];
  loading: boolean;
  type: "income" | "expense";
  onEdit: (item: FinanceItem) => void;
  onDelete: (id: string) => void;
}

// Componente para mostrar fecha y hora formateadas
const DateTimeDisplay = ({ date }: { date: Date }) => {
  if (!date) return <span>-</span>;

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

// Componente de tarjeta para vista móvil
const FinanceCard = ({ item, type, onEdit, onDelete }: { item: FinanceItem; type: "income" | "expense"; onEdit: (item: FinanceItem) => void; onDelete: (id: string) => void }) => {
  const { accounts } = useAccountStore();
  const isAccountDeleted = item.accountId && !accounts.some((account) => account.id === item.accountId);
  const account = item.accountId ? accounts.find((acc) => acc.id === item.accountId) : null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  return (
    <Card key={item.id} className="p-3">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-base truncate max-w-[70%] flex items-center">
          {item.description}
          {isAccountDeleted && <AlertCircle className="h-3.5 w-3.5 text-amber-500 ml-1" />}
        </h3>
        <span className={`font-bold ${type === "income" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{formatCurrency(item.amount)}</span>
      </div>

      <div className="flex flex-wrap items-start gap-3 justify-between mb-2">
        <div className="flex items-center gap-1">
          <CategoryBadge category={item.category} type={type} showIcon={true} />
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

      {/* Mostrar información de cuenta */}
      <div className="flex items-center gap-2 mt-2 mb-2">
        <span className="text-xs text-gray-500">Cuenta:</span>
        {account ? (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: account.color || "#888888" }}></div>
            <span className="text-xs">{account.name}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">Sin cuenta asignada</span>
        )}
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
  );
};

export function FinanceTable({ items, loading, type, onEdit, onDelete }: FinanceTableProps) {
  const [showBalanceInfo, setShowBalanceInfo] = useState(true);
  const { accounts } = useAccountStore();

  const orphanedItems = useMemo(() => {
    if (!items || !accounts) return [];
    return items.filter((item) => item.accountId && !accounts.some((account) => account.id === item.accountId));
  }, [items, accounts]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const emptySections = useMemo(
    () => ({
      noItemsText: `No hay ${type === "income" ? "ingresos" : "gastos"} registrados.`,
      loadingText: "Cargando...",
    }),
    [type]
  );

  if (loading) {
    return <div className="text-center py-4">{emptySections.loadingText}</div>;
  }

  if (!items || items.length === 0) {
    return <div className="text-center py-4">{emptySections.noItemsText}</div>;
  }

  const isAccountDeleted = (item: FinanceItem) => {
    if (!item.accountId) return false;
    return !accounts.some((account) => account.id === item.accountId);
  };

  // Renderización para móviles: tarjetas en lugar de tabla
  const renderMobileView = () => (
    <div className="space-y-3 sm:hidden">
      {showBalanceInfo && (
        <Alert variant="info" className="mb-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>El saldo de las cuentas se actualiza automáticamente al eliminar {type === "income" ? "ingresos" : "gastos"}.</AlertDescription>
          <Button variant="ghost" size="sm" onClick={() => setShowBalanceInfo(false)} className="ml-auto h-6 px-2 text-xs">
            Entendido
          </Button>
        </Alert>
      )}

      {orphanedItems.length > 0 && (
        <Alert variant="warning" className="mb-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {orphanedItems.length} {type === "income" ? "ingreso(s)" : "gasto(s)"} están asociados a cuentas que han sido eliminadas. Edítalos para asignarlos a cuentas existentes.
          </AlertDescription>
        </Alert>
      )}

      {items.map((item) => (
        <FinanceCard key={item.id} item={item} type={type} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );

  return (
    <>
      {/* Vista móvil */}
      {renderMobileView()}

      {/* Vista de escritorio */}
      <div className="hidden sm:block overflow-auto">
        {showBalanceInfo && (
          <Alert variant="info" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>El saldo de las cuentas se actualiza automáticamente al eliminar {type === "income" ? "ingresos" : "gastos"}.</AlertDescription>
            <Button variant="ghost" size="sm" onClick={() => setShowBalanceInfo(false)} className="ml-auto h-6 px-2 text-xs">
              Entendido
            </Button>
          </Alert>
        )}

        {orphanedItems.length > 0 && (
          <Alert variant="warning" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {orphanedItems.length} {type === "income" ? "ingreso(s)" : "gasto(s)"} están asociados a cuentas que han sido eliminadas. Edítalos para asignarlos a cuentas
              existentes.
            </AlertDescription>
          </Alert>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descripción</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Cuenta</TableHead>
              <TableHead>Fecha y Hora</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className={isAccountDeleted(item) ? "bg-amber-50/30 dark:bg-amber-950/20" : undefined}>
                <TableCell className="max-w-xs truncate">
                  <div className="flex items-center">
                    {item.description}
                    {isAccountDeleted(item) && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="inline-flex">
                              <AlertCircle className="h-3.5 w-3.5 text-amber-500 ml-1" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Cuenta eliminada - Asigna una nueva cuenta editando este registro</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <CategoryBadge category={item.category} type={type} showIcon={true} />
                </TableCell>
                <TableCell>
                  {item.accountId ? (
                    (() => {
                      const account = accounts.find((acc) => acc.id === item.accountId);
                      return account ? (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: account.color || "#888888" }}></div>
                          <span>{account.name}</span>
                        </div>
                      ) : (
                        <span className="text-amber-500">Cuenta eliminada</span>
                      );
                    })()
                  ) : (
                    <span className="text-gray-400">Sin cuenta</span>
                  )}
                </TableCell>
                <TableCell>
                  <DateTimeDisplay date={item.date} />
                </TableCell>
                <TableCell className={type === "income" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>{formatCurrency(item.amount)}</TableCell>
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
