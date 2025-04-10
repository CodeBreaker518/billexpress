"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@bill/_components/ui/card";
import { Button } from "@bill/_components/ui/button";
import { useExpenseStore } from "@bill/_store/useExpenseStore";
import { useIncomeStore } from "@bill/_store/useIncomeStore";
import { useFinanceStore } from "@bill/_store/useFinanceStore";
import { useAuthStore } from "@bill/_store/useAuthStore";
import { Input } from "@bill/_components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@bill/_components/ui/table";
import { CategoryBadge } from "@bill/_components/ui/category-badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertCircle, Calendar, ArrowUp, ArrowDown, Clock, Edit, Search, Filter, FilterX, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@bill/_components/ui/tooltip";
import AlertDeleteTableElement from "@bill/_components/AlertDeleteTableElement";
import { useAccountStore } from "@bill/_store/useAccountStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@bill/_components/ui/select";
import { Label } from "@bill/_components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@bill/_components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { getCategoryConfig } from "@bill/_lib/utils/categoryConfig";
import { Badge } from "@bill/_components/ui/badge";

// Definir la interfaz para las transacciones combinadas
interface Transaction {
  id: string;
  type: "income" | "expense";
  description: string;
  amount: number;
  category: string;
  date: Date;
  userId: string;
  accountId?: string;
}

// Componente personalizado para el botón de eliminar en móvil
function MobileDeleteButton({ onDelete }: { onDelete: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-9 px-3 text-red-600 text-sm">
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Eliminar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>Esta acción no se puede deshacer. El elemento será eliminado permanentemente.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete}>Confirmar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function TransactionsTable() {
  const { expenses } = useExpenseStore();
  const { incomes } = useIncomeStore();
  const { user } = useAuthStore();
  const { accounts } = useAccountStore();
  const { formatCurrency, handleEdit, handleDeleteExpense, handleDeleteIncome } = useFinanceStore();

  // Efecto para hacer scroll al historial cuando hay un hash en la URL
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#historial-transacciones") {
      // Dar tiempo para que se renderice el contenido
      setTimeout(() => {
        const element = document.getElementById("historial-transacciones");
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  }, []);

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Combinar y ordenar transacciones
  const allTransactions = useMemo(() => {
    if (!user) return [];

    // SEGURIDAD: Solo procesar transacciones del usuario actual
    const currentUserId = user.uid;
    
    // Filtrar explícitamente
    const userExpenses = expenses.filter(exp => exp.userId === currentUserId);
    const userIncomes = incomes.filter(inc => inc.userId === currentUserId);

    console.log(`Procesando ${userExpenses.length} gastos y ${userIncomes.length} ingresos para usuario ${currentUserId}`);

    // Combinar ingresos y gastos en un solo array
    const transactions: Transaction[] = [
      ...userExpenses.map((expense) => ({
        ...expense,
        type: "expense" as const,
        date: new Date(expense.date),
      })),
      ...userIncomes.map((income) => ({
        ...income,
        type: "income" as const,
        date: new Date(income.date),
      })),
    ];

    // Ordenar por fecha (más reciente primero)
    return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [expenses, incomes, user]);

  // Lista de categorías únicas
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    allTransactions.forEach(item => categories.add(item.category));
    return Array.from(categories).sort();
  }, [allTransactions]);

  // Aplicar filtros
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(transaction => {
      // Filtro por texto de búsqueda
      if (searchTerm && !transaction.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Filtro por tipo (ingreso/gasto)
      if (typeFilter !== "all" && transaction.type !== typeFilter) {
        return false;
      }

      // Filtro por categoría
      if (categoryFilter !== "all" && transaction.category !== categoryFilter) {
        return false;
      }

      // Filtro por cuenta
      if (accountFilter !== "all") {
        if (accountFilter === "none" && transaction.accountId) {
          return false;
        } else if (accountFilter !== "none" && transaction.accountId !== accountFilter) {
          return false;
        }
      }

      return true;
    });
  }, [allTransactions, searchTerm, typeFilter, categoryFilter, accountFilter]);

  // Calcular paginación
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredTransactions.slice(startIndex, endIndex);
  
  // Cambiar de página
  const goToPage = (page: number) => {
    // Asegurarse de que la página está dentro de límites válidos
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
    // Hacer scroll al inicio de la tabla
    const element = document.getElementById("historial-transacciones");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
  
  // Ir a la siguiente página
  const nextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };
  
  // Ir a la página anterior
  const prevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };
  
  // Ir a la primera página
  const firstPage = () => {
    goToPage(1);
  };
  
  // Ir a la última página
  const lastPage = () => {
    goToPage(totalPages);
  };
  
  // Cambiar items por página
  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = parseInt(value);
    setItemsPerPage(newItemsPerPage);
    // Recalcular la página actual para mantener visible el primer elemento de la página actual
    const firstItemIndex = (currentPage - 1) * itemsPerPage;
    const newPage = Math.floor(firstItemIndex / newItemsPerPage) + 1;
    setCurrentPage(Math.max(1, Math.min(newPage, Math.ceil(filteredTransactions.length / newItemsPerPage))));
  };
  
  // Verificar si una cuenta ha sido eliminada
  const isAccountDeleted = (item: Transaction) => {
    if (!item.accountId) return false;
    return !accounts.some((account) => account.id === item.accountId);
  };

  // Resetear todos los filtros
  const resetFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setAccountFilter("all");
  };

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

  // Componente de paginación
  const Pagination = () => (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Mostrar</span>
        <Select
          value={itemsPerPage.toString()}
          onValueChange={handleItemsPerPageChange}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue placeholder={itemsPerPage.toString()} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-muted-foreground whitespace-nowrap">por página</span>
      </div>
      
      <div className="flex items-center justify-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={firstPage}
          disabled={currentPage === 1}
        >
          <ChevronsLeft className="h-4 w-4" />
          <span className="sr-only">Primera página</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={prevPage}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Página anterior</span>
        </Button>
        
        <span className="text-sm mx-2">
          Página <strong>{currentPage}</strong> de <strong>{totalPages || 1}</strong>
        </span>
        
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={nextPage}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Página siguiente</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={lastPage}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          <ChevronsRight className="h-4 w-4" />
          <span className="sr-only">Última página</span>
        </Button>
      </div>
    </div>
  );

  return (
    <Card id="historial-transacciones">
      <CardHeader className="px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-lg font-semibold">Historial de Transacciones</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge
            variant="secondary" 
            className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors px-3 py-1 rounded-full font-medium select-none"
          >
            {filteredTransactions.length} {filteredTransactions.length === 1 ? "transacción" : "transacciones"}
          </Badge>
            {searchTerm || typeFilter !== "all" || categoryFilter !== "all" || accountFilter !== "all" ? (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 px-2 text-xs">
                <FilterX className="h-3 w-3 mr-1" />
                Limpiar filtros
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>
      
      {/* Vista móvil: Filtros rápidos */}
      <div className="px-4 sm:hidden mb-3">
        <div className="flex gap-2 overflow-x-auto pb-2 mb-1">
          <Button 
            variant={typeFilter === "all" ? "default" : "outline"} 
            size="sm" 
            className="text-xs py-1.5 px-3 whitespace-nowrap"
            onClick={() => setTypeFilter("all")}
          >
            Todos
          </Button>
          <Button 
            variant={typeFilter === "income" ? "default" : "outline"} 
            size="sm" 
            className="text-xs py-1.5 px-3 whitespace-nowrap"
            onClick={() => setTypeFilter("income")}
          >
            <ArrowUp className="h-3.5 w-3.5 mr-1.5 text-blue-600 dark:text-blue-400" />
            Ingresos
          </Button>
          <Button 
            variant={typeFilter === "expense" ? "default" : "outline"} 
            size="sm" 
            className="text-xs py-1.5 px-3 whitespace-nowrap"
            onClick={() => setTypeFilter("expense")}
          >
            <ArrowDown className="h-3.5 w-3.5 mr-1.5 text-red-500" />
            Gastos
          </Button>
        </div>
      </div>
      
      <CardContent className="px-4 sm:px-6">
        {/* Filtros */}
        <div className="flex flex-col sm:items-end sm:flex-row gap-4 mb-6">
          {/* Búsqueda */}
          <div className="w-full sm:flex-1 relative">
            <div className="text-xs text-muted-foreground mb-1">Buscar</div>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Descripción de transacción"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-sm pl-8 h-10 w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-4">
            {/* Filtro por tipo (visible solo en desktop) */}
            <div className="col-span-1 hidden sm:block">
              <div className="text-xs text-muted-foreground mb-1">Tipo</div>
              <Select value={typeFilter} onValueChange={(value: "all" | "income" | "expense") => setTypeFilter(value)}>
                <SelectTrigger className="h-10 w-[150px]">
                  {typeFilter !== "all" ? (
                    <div className="flex items-center gap-2">
                      {typeFilter === "income" ? (
                        <ArrowUp className="h-4 w-4 text-blue-600" />
                      ) : (
                        <ArrowDown className="h-4 w-4 text-red-600" />
                      )}
                      <span>{typeFilter === "income" ? "Ingresos" : "Gastos"}</span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Filtrar por tipo" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="income" className="flex items-center">
                    <div className="flex items-center gap-2">
                      <ArrowUp className="h-4 w-4 text-blue-600" />
                      <span>Solo ingresos</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="expense" className="flex items-center">
                    <div className="flex items-center gap-2">
                      <ArrowDown className="h-4 w-4 text-red-600" />
                      <span>Solo gastos</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por categoría */}
            <div className="col-span-1">
              <div className="text-xs text-muted-foreground mb-1">Categoría</div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-10 w-full sm:w-[150px] text-sm">
                  {categoryFilter !== "all" ? (
                    <div className="flex items-center gap-2">
                      {(() => {
                        const type = allTransactions.find(t => t.category === categoryFilter)?.type || "expense";
                        const config = getCategoryConfig(type, categoryFilter);
                        const Icon = config.icon;
                        return <Icon className="h-4 w-4" style={{ color: config.color }} />;
                      })()}
                      <span>{categoryFilter}</span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Filtrar categoría" />
                  )}               </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {uniqueCategories.map(cat => {
                    // Determinar tipo de categoría (ingreso o gasto)
                    const type = allTransactions.find(t => t.category === cat)?.type || "expense";
                    // Obtener configuración (icono y color)
                    const config = getCategoryConfig(type, cat);
                    const Icon = config.icon;
                    
                    return (
                      <SelectItem key={cat} value={cat} className="flex items-center">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" style={{ color: config.color }} />
                          <span>{cat}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por cuenta */}
            <div className="col-span-1">
              <div className="text-xs text-muted-foreground mb-1">Cuenta</div>
              <Select value={accountFilter} onValueChange={setAccountFilter}>
                <SelectTrigger className="h-10 w-full sm:w-[150px] text-sm">
                  {accountFilter !== "all" && accountFilter !== "none" ? (
                    (() => {
                      const account = accounts.find(acc => acc.id === accountFilter);
                      if (account) {
                        return (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: account.color }}></div>
                            <span>{account.name}</span>
                          </div>
                        );
                      }
                      return <SelectValue placeholder="Filtrar cuenta" />;
                    })()
                  ) : accountFilter === "none" ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                      <span>Sin cuenta</span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Filtrar cuenta" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las cuentas</SelectItem>
                  <SelectItem value="none">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                      <span>Sin cuenta asignada</span>
                    </div>
                  </SelectItem>
                  {accounts.map(account => (
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

        {/* Tabla de transacciones */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No se encontraron transacciones con los filtros actuales</p>
          </div>
        ) : (
          <>
            {/* Vista móvil: Tarjetas */}
            <div className="space-y-4 sm:hidden">
              {currentItems.map((transaction) => (
                <Card 
                  key={transaction.id} 
                  className={`p-4 ${isAccountDeleted(transaction) ? "border-amber-200 dark:border-amber-800" : ""}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {transaction.type === "income" ? (
                        <ArrowUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ArrowDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                      )}
                      <CategoryBadge category={transaction.category} type={transaction.type} showIcon={true} className="text-xs" />
                    </div>
                    <span className={`font-semibold text-base ${transaction.type === "income" ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}>
                      {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.amount)}
                    </span>
                  </div>

                  <div className="mb-3">
                    <h3 className="font-medium text-base flex items-center">
                      {transaction.description}
                      {isAccountDeleted(transaction) && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="inline-flex">
                                <AlertCircle className="h-4 w-4 text-amber-500 ml-1.5" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Cuenta eliminada - Asigna una nueva cuenta editando este registro</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </h3>
                  </div>

                  <div className="flex flex-col gap-1.5 text-sm text-gray-500 mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{format(new Date(transaction.date), "dd MMM yyyy", { locale: es })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{format(new Date(transaction.date), "HH:mm", { locale: es })}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4 text-sm">
                    <span className="text-gray-500">Cuenta:</span>
                    {transaction.accountId ? (
                      (() => {
                        const account = accounts.find((acc) => acc.id === transaction.accountId);
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
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <Button size="sm" variant="outline" className="h-9 px-3 text-blue-600 text-sm" onClick={() => handleEdit(transaction, transaction.type)}>
                      <Edit className="h-3.5 w-3.5 mr-1.5" />
                      Editar
                    </Button>
                    <MobileDeleteButton 
                      onDelete={() => {
                        if (transaction.type === "income") {
                          handleDeleteIncome(transaction.id);
                        } else {
                          handleDeleteExpense(transaction.id);
                        }
                      }} 
                    />
                  </div>
                </Card>
              ))}
              
              {/* Paginación para móvil */}
              <Pagination />
            </div>

            {/* Vista desktop: Tabla */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Cuenta</TableHead>
                    <TableHead>Fecha y Hora</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map((transaction) => (
                    <TableRow key={transaction.id} className={isAccountDeleted(transaction) ? "bg-amber-50/30 dark:bg-amber-950/20" : undefined}>
                      <TableCell>
                        {transaction.type === "income" ? (
                          <ArrowUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <ArrowDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        <div className="flex items-center">
                          {transaction.description}
                          {isAccountDeleted(transaction) && (
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
                        <CategoryBadge category={transaction.category} type={transaction.type} showIcon={true} />
                      </TableCell>
                      <TableCell>
                        {transaction.accountId ? (
                          (() => {
                            const account = accounts.find((acc) => acc.id === transaction.accountId);
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
                        <DateTimeDisplay date={transaction.date} />
                      </TableCell>
                      <TableCell className={transaction.type === "income" ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}>
                        {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" className="h-8 px-2 text-blue-600" onClick={() => handleEdit(transaction, transaction.type)}>
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          <AlertDeleteTableElement 
                            onDelete={() => {
                              if (transaction.type === "income") {
                                handleDeleteIncome(transaction.id);
                              } else {
                                handleDeleteExpense(transaction.id);
                              }
                            }} 
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Paginación para desktop */}
              <Pagination />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 