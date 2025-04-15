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
import { useIncomeStore } from "@bill/_store/useIncomeStore";
import { useFinanceStore } from "@bill/_store/useFinanceStore";
import { Income, Expense } from "../../types";

// Definición de tipos para nuestro hook
interface CategoryStat {
  category: string;
  amount: number;
  percentage: number;
  [key: string]: string | number; // Índice de firma para cumplir con ChartData
}

// Esta función se implementará cuando creemos el contexto real
const useFinances = () => {
  // Simulamos los datos y funcionalidades que vendrán del contexto
  return {
    searchTerm: "",
    setSearchTerm: () => {},
    filteredIncomes: [] as Income[],
    incomesByCategory: [] as CategoryStat[],
    incomeCategoryColors: [] as string[],
    handleNewIncome: () => {},
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleEdit: (item: Income | Expense, type: "income" | "expense") => {},
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleDeleteIncome: (id: string) => Promise.resolve(),
    formatCurrency: (amount: number) => `$${amount}`,
    isLoading: false,
  };
};

export default function IncomePanel() {
  const { user } = useAuthStore();
  const { incomes, loading: isLoading } = useIncomeStore();
  const { searchTerm, setSearchTerm, incomesByCategory, incomeCategoryColors, handleNewIncome, handleEdit, handleDeleteIncome, formatCurrency } = useFinanceStore();

  // Filtrar los ingresos según término de búsqueda
  const filteredIncomes = incomes.filter(
    (income) => income.description.toLowerCase().includes(searchTerm.toLowerCase()) || income.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mt-4 space-y-6">
      {/* Buscador */}
      <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} onAddNew={handleNewIncome} placeholder="Buscar ingresos..." addButtonLabel="Nuevo" />

      {/* Contenido condicional */}
      {filteredIncomes.length === 0 && !isLoading ? (
        <Card className="shadow-soft">
          <CardContent className="py-12 text-center">
            <Text>No hay ingresos registrados.</Text>
            <Button className="mt-4" onClick={handleNewIncome}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Primer Ingreso
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Tabla de ingresos */}
          <Card className="shadow-soft">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg">Historial de Ingresos</CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <FinanceTable
                items={
                  Array.isArray(filteredIncomes)
                    ? filteredIncomes.map((item) => ({
                        ...item,
                        userId: user?.uid || "",
                        date: new Date(item.date),
                      }))
                    : []
                }
                loading={isLoading}
                onEdit={(item) => handleEdit(item, "income")}
                onDelete={handleDeleteIncome}
                type="income"
              />
            </CardContent>
          </Card>

          {/* Gráficas de categorías en grid responsive */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribución por categoría */}
            <Card className="shadow-soft card-hover">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-base sm:text-lg">Distribución por Categoría</CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <DonutChart
                  className="mt-2 h-44 sm:h-52 chart-animate"
                  data={incomesByCategory}
                  category="amount"
                  index="category"
                  valueFormatter={formatCurrency}
                  variant="pie"
                  colors={incomeCategoryColors}
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
                  {incomesByCategory.slice(0, 5).map((item) => (
                    <ListItem key={item.category}>
                      <div className="flex items-center space-x-2">
                        <CategoryBadge category={item.category} type="income" showIcon={true} />
                        <span className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">{formatCurrency(item.amount)}</span>
                      </div>
                      <Text className="text-xs sm:text-sm">{item.percentage}%</Text>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
