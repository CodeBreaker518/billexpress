"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getUserTransfers } from "@bill/_firebase/accountService";
import { useAuthStore } from "@bill/_store/useAuthStore";
import { useAccountStore } from "@bill/_store/useAccountStore";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@bill/_components/ui/table";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@bill/_components/ui/card";
import { ArrowLeftRight, Calendar, Filter, FilterX, Clock, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@bill/_components/ui/skeleton";
import { Button } from "@bill/_components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@bill/_components/ui/select";
import { Badge } from "@bill/_components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@bill/_components/ui/tooltip";

interface Transfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  fromAccountName: string;
  toAccountName: string;
  amount: number;
  userId: string;
  date: Date;
  description: string;
}

export default function TransferHistory() {
  const { user } = useAuthStore();
  const { accounts } = useAccountStore();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  
  // Estados para filtros
  const [fromAccountFilter, setFromAccountFilter] = useState("all");
  const [toAccountFilter, setToAccountFilter] = useState("all");
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Formatear valor de moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  // Cargar transferencias
  useEffect(() => {
    const loadTransfers = async () => {
      if (!user?.uid) return;
      
      setIsLoading(true);
      try {
        const data = await getUserTransfers(user.uid);
        setTransfers(data);
      } catch (error) {
        console.error("Error al cargar transferencias:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTransfers();
  }, [user?.uid, lastUpdated]); // Añadimos lastUpdated para recargar cuando cambie

  // Exponer recarga global para otras partes de la app
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).reloadTransfers = () => setLastUpdated(Date.now());
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).reloadTransfers;
      }
    };
  }, []);

  // Componente para mostrar fecha y hora
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

  // Aplicar filtros
  const filteredTransfers = useMemo(() => {
    return transfers.filter(transfer => {
      // Filtro por cuenta origen
      if (fromAccountFilter !== "all" && transfer.fromAccountId !== fromAccountFilter) {
        return false;
      }

      // Filtro por cuenta destino
      if (toAccountFilter !== "all" && transfer.toAccountId !== toAccountFilter) {
        return false;
      }

      return true;
    });
  }, [transfers, fromAccountFilter, toAccountFilter]);

  // Obtener cuentas únicas para los filtros
  const fromAccounts = useMemo(() => [...new Set(transfers.map(t => t.fromAccountId))], [transfers]);
  const toAccounts = useMemo(() => [...new Set(transfers.map(t => t.toAccountId))], [transfers]);

  // Calcular paginación
  const totalPages = Math.ceil(filteredTransfers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredTransfers.slice(startIndex, endIndex);
  
  // Resetear filtros
  const resetFilters = () => {
    setFromAccountFilter("all");
    setToAccountFilter("all");
  };
  
  // Cambiar de página
  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };
  
  // Navegación de paginación
  const nextPage = () => currentPage < totalPages && goToPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && goToPage(currentPage - 1);
  const firstPage = () => goToPage(1);
  const lastPage = () => goToPage(totalPages);
  
  // Cambiar items por página
  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = parseInt(value);
    setItemsPerPage(newItemsPerPage);
    const firstItemIndex = (currentPage - 1) * itemsPerPage;
    const newPage = Math.floor(firstItemIndex / newItemsPerPage) + 1;
    setCurrentPage(Math.max(1, Math.min(newPage, Math.ceil(filteredTransfers.length / newItemsPerPage))));
  };

  // Nuevo componente de paginación con el mismo diseño que TransactionsTable
  const Pagination = () => {
    // Generar rango de páginas a mostrar
    const generatePageRange = () => {
      const pageRange = [];
      const maxVisible = 5;
      const halfVisible = Math.floor(maxVisible / 2);
      
      let startPage = Math.max(1, currentPage - halfVisible);
      const endPage = Math.min(totalPages, startPage + maxVisible - 1);
      
      // Ajustar el inicio si estamos cerca del final
      if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
      }
      
      // Generar los números de página
      for (let i = startPage; i <= endPage; i++) {
        pageRange.push(i);
      }
      
      return pageRange;
    };
    
    const pageNumbers = generatePageRange();
    
    return (
      <div className="flex flex-col items-center space-y-3 pt-4 pb-2">
        {/* Información de página y total */}
        <div className="text-sm text-muted-foreground">
          Mostrando {filteredTransfers.length > 0 ? startIndex + 1 : 0} - {Math.min(endIndex, filteredTransfers.length)} de {filteredTransfers.length} resultados
        </div>
        
        {/* Controles de paginación */}
        <div className="w-full flex justify-between items-center space-x-1">
          {/* Control de elementos por página */}
          <div className="flex items-center mr-4">
            <span className="text-sm mr-2">Por página:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={handleItemsPerPageChange}
            >
              <SelectTrigger className="h-8 w-[65px]">
                <SelectValue placeholder={itemsPerPage.toString()} />
              </SelectTrigger>
              <SelectContent side="top" align="start">
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex space-x-1 items-center">
            {/* Navegación de páginas */}
            <button
              onClick={firstPage}
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded border border-input text-sm transition-colors hover:bg-accent disabled:opacity-50"
              aria-label="Primera página"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded border border-input text-sm transition-colors hover:bg-accent disabled:opacity-50"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            {pageNumbers.map(page => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`flex h-8 min-w-[2rem] items-center justify-center rounded px-2 text-sm transition-colors ${
                  currentPage === page 
                  ? "bg-primary text-primary-foreground" 
                  : "border border-input hover:bg-accent"
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={nextPage}
              disabled={currentPage >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded border border-input text-sm transition-colors hover:bg-accent disabled:opacity-50"
              aria-label="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            
            <button
              onClick={lastPage}
              disabled={currentPage >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded border border-input text-sm transition-colors hover:bg-accent disabled:opacity-50"
              aria-label="Última página"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Historial de transferencias
          </CardTitle>
          <CardDescription>Registro de transferencias entre tus cuentas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="w-full h-10" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            Historial de Transferencias
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge
              variant="secondary" 
              className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors px-3 py-1 rounded-full font-medium select-none"
            >
              {filteredTransfers.length} {filteredTransfers.length === 1 ? "transferencia" : "transferencias"}
            </Badge>
            {fromAccountFilter !== "all" || toAccountFilter !== "all" ? (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 px-2 text-xs">
                <FilterX className="h-3 w-3 mr-1" />
                Limpiar filtros
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-4 sm:px-6 overflow-visible">
        {/* Filtros */}
        <div className="flex flex-col justify-end sm:flex-row gap-4 mb-6">
          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-4">
            {/* Filtro por cuenta origen */}
            <div className="col-span-1">
              <div className="text-xs text-muted-foreground mb-1">Cuenta origen</div>
              <Select value={fromAccountFilter} onValueChange={setFromAccountFilter}>
                <SelectTrigger className="h-10 w-full sm:w-[150px] text-sm">
                  {fromAccountFilter !== "all" ? (
                    (() => {
                      const account = accounts.find(acc => acc.id === fromAccountFilter);
                      if (account) {
                        return (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: account.color }}></div>
                            <span>{account.name}</span>
                          </div>
                        );
                      }
                      return <SelectValue placeholder="Cuenta origen" />;
                    })()
                  ) : (
                    <SelectValue placeholder="Cuenta origen" />
                  )}
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={5}>
                  <SelectItem value="all">Todas las cuentas</SelectItem>
                  {accounts.filter(acc => fromAccounts.includes(acc.id)).map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: account.color }}></div>
                        <span>{account.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por cuenta destino */}
            <div className="col-span-1">
              <div className="text-xs text-muted-foreground mb-1">Cuenta destino</div>
              <Select value={toAccountFilter} onValueChange={setToAccountFilter}>
                <SelectTrigger className="h-10 w-full sm:w-[150px] text-sm">
                  {toAccountFilter !== "all" ? (
                    (() => {
                      const account = accounts.find(acc => acc.id === toAccountFilter);
                      if (account) {
                        return (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: account.color }}></div>
                            <span>{account.name}</span>
                          </div>
                        );
                      }
                      return <SelectValue placeholder="Cuenta destino" />;
                    })()
                  ) : (
                    <SelectValue placeholder="Cuenta destino" />
                  )}
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={5}>
                  <SelectItem value="all">Todas las cuentas</SelectItem>
                  {accounts.filter(acc => toAccounts.includes(acc.id)).map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: account.color }}></div>
                        <span>{account.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {!filteredTransfers.length ? (
          <p className="text-center text-muted-foreground py-6">
            No hay transferencias registradas con los filtros actuales
          </p>
        ) : (
          <>
            {/* Vista móvil: Tarjetas */}
            <div className="space-y-3 sm:hidden">
              {currentItems.map((transfer) => {
                const fromAccount = accounts.find(acc => acc.id === transfer.fromAccountId);
                const toAccount = accounts.find(acc => acc.id === transfer.toAccountId);
                
                return (
                  <Card key={transfer.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline">Transferencia</Badge>
                      <span className="font-semibold text-base text-green-600 dark:text-green-400">
                        {formatCurrency(transfer.amount)}
                      </span>
                    </div>

                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-1">Descripción</p>
                      <p className="font-medium text-sm">{transfer.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Origen</p>
                        {fromAccount ? (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: fromAccount.color }}></div>
                            <span className="text-sm">{transfer.fromAccountName}</span>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                              <span className="text-sm line-through text-muted-foreground">{transfer.fromAccountName}</span>
                            </div>
                            <Badge variant="outline" className="text-xs bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 mt-1">Eliminada</Badge>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Destino</p>
                        {toAccount ? (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: toAccount.color }}></div>
                            <span className="text-sm">{transfer.toAccountName}</span>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                              <span className="text-sm line-through text-muted-foreground">{transfer.toAccountName}</span>
                            </div>
                            <Badge variant="outline" className="text-xs bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 mt-1">Eliminada</Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Fecha y hora</p>
                      <DateTimeDisplay date={transfer.date} />
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Vista desktop: Tabla */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Monto</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Fecha y hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map((transfer) => {
                    const fromAccount = accounts.find(acc => acc.id === transfer.fromAccountId);
                    const toAccount = accounts.find(acc => acc.id === transfer.toAccountId);
                    
                    return (
                      <TableRow key={transfer.id}>
                        <TableCell className="font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(transfer.amount)}
                        </TableCell>
                        <TableCell>
                          {fromAccount ? (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: fromAccount.color }}></div>
                              <span>{transfer.fromAccountName}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                              <span className="line-through text-muted-foreground">{transfer.fromAccountName}</span>
                              <Badge variant="outline" className="text-xs bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 ml-1">Eliminada</Badge>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {toAccount ? (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: toAccount.color }}></div>
                              <span>{transfer.toAccountName}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                              <span className="line-through text-muted-foreground">{transfer.toAccountName}</span>
                              <Badge variant="outline" className="text-xs bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 ml-1">Eliminada</Badge>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{transfer.description}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <DateTimeDisplay date={transfer.date} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            
            {/* Paginación */}
            <Pagination />
          </>
        )}
      </CardContent>
    </Card>
  );
} 