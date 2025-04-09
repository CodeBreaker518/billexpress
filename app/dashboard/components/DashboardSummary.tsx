"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Wallet, PieChart } from "lucide-react";
import { useExpenseStore } from "@bill/_store/useExpenseStore";
import { useIncomeStore } from "@bill/_store/useIncomeStore";
import { useFinanceStore } from "@bill/_store/useFinanceStore";
import { StatsCard } from "@bill/_components/ui/stats-card";

export default function DashboardSummary() {
  const { expenses } = useExpenseStore();
  const { incomes } = useIncomeStore();
  const { formatCurrency } = useFinanceStore();

  // Estados para métricas
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncomes, setTotalIncomes] = useState(0);
  const [netBalance, setNetBalance] = useState(0);
  const [savingsRate, setSavingsRate] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [monthlyIncomes, setMonthlyIncomes] = useState(0);

  // Calcular métricas financieras
  useEffect(() => {
    // Calcular totales
    const expensesTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    setTotalExpenses(expensesTotal);

    const incomesTotal = incomes.reduce((sum, income) => sum + income.amount, 0);
    setTotalIncomes(incomesTotal);

    // Calcular balance
    const balance = incomesTotal - expensesTotal;
    setNetBalance(balance);

    // Calcular tasa de ahorro (solo si hay ingresos)
    if (incomesTotal > 0) {
      const savingsRateValue = (balance / incomesTotal) * 100;
      setSavingsRate(parseFloat(savingsRateValue.toFixed(1)));
    } else {
      setSavingsRate(0);
    }

    // Calcular métricas mensuales
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Gastos del mes actual
    const thisMonthExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });

    const thisMonthExpensesTotal = thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    setMonthlyExpenses(thisMonthExpensesTotal);

    // Ingresos del mes actual
    const thisMonthIncomes = incomes.filter((income) => {
      const incomeDate = new Date(income.date);
      return incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear;
    });

    const thisMonthIncomesTotal = thisMonthIncomes.reduce((sum, income) => sum + income.amount, 0);
    setMonthlyIncomes(thisMonthIncomesTotal);
  }, [expenses, incomes]);

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {/* Balance Total */}
      <StatsCard
        title="Balance Total"
        value={formatCurrency(netBalance)}
        valueClassName={netBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
        subTitle="Mes actual"
        subValue={formatCurrency(monthlyIncomes - monthlyExpenses)}
        icon={<Wallet className="h-6 w-6 text-blue-700 dark:text-blue-400" />}
        iconContainerClassName="bg-blue-100 dark:bg-blue-900/30"
        decorationColor={netBalance >= 0 ? "green" : "red"}
      />

      {/* Ingresos Totales */}
      <StatsCard
        title="Ingresos Totales"
        value={formatCurrency(totalIncomes)}
        valueClassName="text-blue-600 dark:text-blue-400"
        subTitle="Mes actual"
        subValue={formatCurrency(monthlyIncomes)}
        icon={<TrendingUp className="h-6 w-6 text-blue-700 dark:text-blue-400" />}
        iconContainerClassName="bg-blue-100 dark:bg-blue-900/30"
        decorationColor="blue"
      />

      {/* Gastos Totales */}
      <StatsCard
        title="Gastos Totales"
        value={formatCurrency(totalExpenses)}
        valueClassName="text-red-600 dark:text-red-400"
        subTitle="Mes actual"
        subValue={formatCurrency(monthlyExpenses)}
        icon={<TrendingDown className="h-6 w-6 text-red-700 dark:text-red-400" />}
        iconContainerClassName="bg-red-100 dark:bg-red-900/30"
        decorationColor="red"
      />

      {/* Tasa de Ahorro */}
      <StatsCard
        title="Tasa de Ahorro"
        value={`${savingsRate}%`}
        valueClassName={savingsRate >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
        subTitle="Mes actual"
        subValue={formatCurrency(monthlyIncomes - monthlyExpenses)}
        icon={<PieChart className="h-6 w-6 text-purple-700 dark:text-purple-400" />}
        iconContainerClassName="bg-purple-100 dark:bg-purple-900/30"
        decorationColor={savingsRate >= 0 ? "green" : "red"}
      />
    </div>
  );
} 