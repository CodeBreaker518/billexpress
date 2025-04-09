"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@bill/_components/ui/card";
import { DonutChart } from "@bill/_components/ui/charts";
import { List, ListItem } from "@bill/_components/ui/list";
import { Text } from "@bill/_components/ui/typography";
import { CategoryBadge } from "@bill/_components/ui/category-badge";
import { useExpenseStore } from "@bill/_store/useExpenseStore";
import { useIncomeStore } from "@bill/_store/useIncomeStore";
import { useFinanceStore } from "@bill/_store/useFinanceStore";
import { TrendingDown, TrendingUp } from "lucide-react";

export default function CategoryCharts() {
  const { expenses } = useExpenseStore();
  const { incomes } = useIncomeStore();
  const { formatCurrency, expensesByCategory, incomesByCategory, expenseCategoryColors, incomeCategoryColors } = useFinanceStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Gastos por categoría */}
      <Card className="shadow-soft card-hover">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            Gastos por Categoría
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {expensesByCategory.length > 0 ? (
            <>
              <DonutChart
                className="mt-2 h-44 sm:h-52 chart-animate"
                data={expensesByCategory}
                category="amount"
                index="category"
                valueFormatter={formatCurrency}
                variant="pie"
                colors={expenseCategoryColors}
              />
              <List className="mt-4">
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
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-56 py-6 text-center">
              <TrendingDown className="w-12 h-12 text-muted-foreground mb-2 opacity-50" />
              <Text className="text-sm text-muted-foreground">No hay gastos registrados</Text>
              <Text className="text-xs text-muted-foreground mt-1">Registra tu primer gasto para visualizar esta gráfica</Text>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ingresos por categoría */}
      <Card className="shadow-soft card-hover">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Ingresos por Categoría
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {incomesByCategory.length > 0 ? (
            <>
              <DonutChart
                className="mt-2 h-44 sm:h-52 chart-animate"
                data={incomesByCategory}
                category="amount"
                index="category"
                valueFormatter={formatCurrency}
                variant="pie"
                colors={incomeCategoryColors}
              />
              <List className="mt-4">
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
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-56 py-6 text-center">
              <TrendingUp className="w-12 h-12 text-muted-foreground mb-2 opacity-50" />
              <Text className="text-sm text-muted-foreground">No hay ingresos registrados</Text>
              <Text className="text-xs text-muted-foreground mt-1">Registra tu primer ingreso para visualizar esta gráfica</Text>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 