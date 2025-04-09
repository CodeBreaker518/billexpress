"use client";

import { useState, useEffect } from "react";
import { format, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@bill/_components/ui/card";
import { BarChart } from "@bill/_components/ui/charts";
import { useExpenseStore } from "@bill/_store/useExpenseStore";
import { useIncomeStore } from "@bill/_store/useIncomeStore";
import { useFinanceStore } from "@bill/_store/useFinanceStore";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "@bill/_lib/utils/categoryConfig";

// Interfaz para los datos mensuales
interface MonthlyData {
  month: string;
  Ingresos: number;
  Gastos: number;
  Balance: number;
  [key: string]: string | number; // Firma de índice para cumplir con ChartData
}

export default function MonthlyEvolutionChart() {
  const { expenses } = useExpenseStore();
  const { incomes } = useIncomeStore();
  const { formatCurrency } = useFinanceStore();

  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);

  // Colores para el gráfico
  const chartColors = {
    income: INCOME_CATEGORIES["Salario"].color,
    expense: EXPENSE_CATEGORIES["Comida"].color,
    balance: "#22c55e", // Verde para balance positivo
    negativeBalance: "#ef4444", // Rojo para balance negativo
  };

  // Calcular datos por mes
  useEffect(() => {
    const currentDate = new Date();

    // Crear objeto para los últimos 6 meses
    const last6Months: Record<string, MonthlyData> = {};

    // Inicializar datos para los últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(currentDate, i);
      const monthName = format(month, "MMM yyyy", { locale: es });

      last6Months[monthName] = {
        month: monthName,
        Ingresos: 0,
        Gastos: 0,
        Balance: 0,
      };
    }

    // Agregar gastos por mes
    expenses.forEach((expense) => {
      const expenseDate = new Date(expense.date);
      const monthName = format(expenseDate, "MMM yyyy", { locale: es });

      if (last6Months[monthName]) {
        last6Months[monthName].Gastos += expense.amount;
        // Recalcular balance
        last6Months[monthName].Balance = last6Months[monthName].Ingresos - last6Months[monthName].Gastos;
      }
    });

    // Agregar ingresos por mes
    incomes.forEach((income) => {
      const incomeDate = new Date(income.date);
      const monthName = format(incomeDate, "MMM yyyy", { locale: es });

      if (last6Months[monthName]) {
        last6Months[monthName].Ingresos += income.amount;
        // Recalcular balance
        last6Months[monthName].Balance = last6Months[monthName].Ingresos - last6Months[monthName].Gastos;
      }
    });

    // Convertir a array y ordenar por fecha
    const monthlyDataArray = Object.values(last6Months);
    setMonthlyData(monthlyDataArray);
  }, [expenses, incomes]);

  // Determinar si algún mes tiene balance negativo
  const hasNegativeBalance = monthlyData.some((item) => item.Balance < 0);

  return (
    <Card className="shadow-sm">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-base sm:text-lg">Evolución Financiera</CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="h-56 sm:h-72">
          <BarChart
            data={monthlyData}
            index="month"
            categories={["Ingresos", "Gastos", "Balance"]}
            colors={[chartColors.income, chartColors.expense, hasNegativeBalance ? chartColors.negativeBalance : chartColors.balance]}
            valueFormatter={formatCurrency}
            className="h-full"
          />
        </div>
      </CardContent>
    </Card>
  );
}
