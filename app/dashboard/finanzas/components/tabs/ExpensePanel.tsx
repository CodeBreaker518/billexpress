"use client";

import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@bill/_components/ui/card";
import { Button } from "@bill/_components/ui/button";
import { Text } from "@bill/_components/ui/typography";
import { DonutChart } from "@bill/_components/ui/charts";
import { List, ListItem } from "@bill/_components/ui/list";
import { CategoryBadge } from "@bill/_components/ui/category-badge";
import SearchBar from "@bill/_components/SearchBar";
import FinanceTable from "@bill/_components/FinanceTable";
import { useAuthStore } from "@bill/_store/useAuthStore";
import { useExpenseStore } from "@bill/_store/useExpenseStore";
import { useFinanceStore } from "@bill/_store/useFinanceStore";
import { Income, Expense } from "../../types";
import { Alert, AlertDescription } from "@bill/_components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function ExpensePanel() {
  const { user } = useAuthStore();
  const { expenses, loading: isLoading } = useExpenseStore();
  const { searchTerm, setSearchTerm, expensesByCategory, expenseCategoryColors, handleNewExpense, handleEdit, handleDeleteExpense, formatCurrency } = useFinanceStore();

  // Filtrar los gastos según término de búsqueda
  const filteredExpenses = expenses.filter(
    (expense) => expense.description.toLowerCase().includes(searchTerm.toLowerCase()) || expense.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Verificar si hay gastos con cuentas eliminadas
  const hasOrphanedExpenses = filteredExpenses.some(expense => expense.accountId && !expense.accountId);

  return (
    <div className="mt-4 space-y-6">
      {/* Buscador */}
      <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} onAddNew={handleNewExpense} placeholder="Buscar gastos..." addButtonLabel="Nuevo" />

      {/* Alerta de cuentas eliminadas */}
      {hasOrphanedExpenses && (
        <Alert variant="warning" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Algunos gastos están asociados a cuentas que han sido eliminadas. Considera actualizar estos gastos o eliminarlos.
          </AlertDescription>
        </Alert>
      )}

      {/* Contenido condicional */}
      {filteredExpenses.length === 0 && !isLoading ? (
        <Card className="shadow-soft">
          <CardContent className="py-12 text-center">
            <Text>No hay gastos registrados.</Text>
            <Button className="mt-4" onClick={handleNewExpense}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Primer Gasto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Tabla de gastos */}
          <Card className="shadow-soft" id="historial-gastos">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg">Historial de Gastos</CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <FinanceTable
                items={
                  Array.isArray(filteredExpenses)
                    ? filteredExpenses.map((item) => ({
                        ...item,
                        userId: user?.uid || "",
                        date: new Date(item.date),
                      }))
                    : []
                }
                loading={isLoading}
                onEdit={(item) => handleEdit(item, "expense")}
                onDelete={handleDeleteExpense}
                type="expense"
              />
            </CardContent>
          </Card>

          {/* Gráficas de categorías en grid responsive */}
          {expensesByCategory.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Distribución por categoría */}
              <Card className="shadow-soft card-hover">
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="text-base sm:text-lg">Distribución por Categoría</CardTitle>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  <DonutChart
                    className="mt-2 h-44 sm:h-52 chart-animate"
                    data={expensesByCategory}
                    category="amount"
                    index="category"
                    valueFormatter={formatCurrency}
                    variant="pie"
                    colors={expenseCategoryColors}
                  />
                </CardContent>
              </Card>

              {/* Desglose por categoría */}
              <Card className="shadow-soft card-hover">
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="text-base sm:text-lg">Desglose por Categoría</CardTitle>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  <List className="mt-2">
                    {expensesByCategory.slice(0, 5).map((item) => (
                      <ListItem key={item.category}>
                        <div className="flex items-center space-x-2">
                          <CategoryBadge category={item.category} type="expense" showIcon={true} />
                          <span className="text-xs sm:text-sm text-red-600 dark:text-red-400">{formatCurrency(item.amount)}</span>
                        </div>
                        <Text className="text-xs sm:text-sm">{item.percentage}%</Text>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
