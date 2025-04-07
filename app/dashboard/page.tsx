"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, ArrowRight, Wallet, ArrowUp, ArrowDown, PieChart, TrendingDown } from "lucide-react";
import { useAuthStore } from "@bill/_store/useAuthStore";
import { useExpenseStore } from "@bill/_store/useExpenseStore";
import { useIncomeStore } from "@bill/_store/useIncomeStore";
import { getUserExpenses, addExpense } from "@bill/_firebase/expenseService";
import { getUserIncomes, addIncome } from "@bill/_firebase/incomeService";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import FinanceForm from "@bill/_components/FinanceForm";

// Importaciones de componentes shadcn/ui
import { Card, CardContent, CardHeader, CardTitle } from "@bill/_components/ui/card";
import { Button } from "@bill/_components/ui/button";
import { DrawerDialog } from "@bill/_components/ui/drawer-dialog";
import { BarChart, DonutChart } from "@bill/_components/ui/charts";
import { Text } from "@bill/_components/ui/typography";
import { List, ListItem } from "@bill/_components/ui/list";
import { StatsCard } from "@bill/_components/ui/stats-card";
import { CategoryBadge } from "@bill/_components/ui/category-badge";
import { DialogDescription } from "@bill/_components/ui/dialog";

// Categorías de gastos
const expenseCategories = ["Comida", "Transporte", "Entretenimiento", "Servicios", "Compras", "Salud", "Educación", "Vivienda", "Otros"];

// Categorías de ingresos
const incomeCategories = ["Salario", "Freelance", "Inversiones", "Ventas", "Regalos", "Reembolsos", "Otros"];

// Agregar importación de nuestro sistema centralizado
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "../../utils/categoryConfig";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { expenses, setExpenses } = useExpenseStore();
  const { incomes, setIncomes } = useIncomeStore();
  const { loading, setLoading } = useExpenseStore();

  // Estados para métricas
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncomes, setTotalIncomes] = useState(0);
  const [netBalance, setNetBalance] = useState(0);
  const [savingsRate, setSavingsRate] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [monthlyIncomes, setMonthlyIncomes] = useState(0);

  // Estados para visualizaciones
  const [expensesByCategory, setExpensesByCategory] = useState<any[]>([]);
  const [incomesByCategory, setIncomesByCategory] = useState<any[]>([]);
  const [expensesByMonth, setExpensesByMonth] = useState<any[]>([]);
  const [incomesByMonth, setIncomesByMonth] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  // Estado para formulario modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formType, setFormType] = useState<"income" | "expense">("income");

  // Estado para el elemento actual
  const [currentItem, setCurrentItem] = useState({
    id: "",
    description: "",
    amount: 0,
    category: "",
    date: new Date(),
    time: format(new Date(), "HH:mm"),
  });

  // Cargar datos de Firebase
  useEffect(() => {
    const loadData = async () => {
      if (user) {
        setLoading(true);
        try {
          // Cargar gastos
          const userExpenses = await getUserExpenses(user.uid);
          setExpenses(userExpenses);

          // Cargar ingresos
          const userIncomes = await getUserIncomes(user.uid);
          setIncomes(userIncomes);
        } catch (error) {
          console.error("Error loading data:", error);
          setExpenses([]);
          setIncomes([]);
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [user, setExpenses, setIncomes, setLoading]);

  // Calcular métricas y visualizaciones cuando los datos cambian
  useEffect(() => {
    // 1. Calcular totales generales
    if (expenses.length > 0) {
      const expensesTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      setTotalExpenses(expensesTotal);

      // Obtener el mes actual
      const currentDate = new Date();
      const firstDayOfMonth = startOfMonth(currentDate);
      const lastDayOfMonth = endOfMonth(currentDate);

      // Calcular gastos del mes actual
      const thisMonthExpenses = expenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= firstDayOfMonth && expenseDate <= lastDayOfMonth;
      });

      const thisMonthExpensesTotal = thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      setMonthlyExpenses(thisMonthExpensesTotal);

      // Gastos por categoría
      const byCategory = expenseCategories
        .map((category) => {
          const categoryExpenses = expenses.filter((e) => e.category === category);
          const total = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
          const percentage = expensesTotal > 0 ? (total / expensesTotal) * 100 : 0;

          return {
            category,
            amount: total,
            percentage: parseFloat(percentage.toFixed(1)),
          };
        })
        .filter((cat) => cat.amount > 0)
        .sort((a, b) => b.amount - a.amount);

      setExpensesByCategory(byCategory);

      // Gastos por mes
      const last6Months: Record<string, number> = {};

      for (let i = 5; i >= 0; i--) {
        const month = subMonths(currentDate, i);
        const monthName = format(month, "MMM yyyy", { locale: es });
        last6Months[monthName] = 0;
      }

      expenses.forEach((expense) => {
        const expenseDate = new Date(expense.date);
        const monthName = format(expenseDate, "MMM yyyy", { locale: es });

        if (last6Months[monthName] !== undefined) {
          last6Months[monthName] += expense.amount;
        }
      });

      const monthlyExpenses = Object.entries(last6Months).map(([month, amount]) => ({
        month,
        Gastos: amount,
      }));

      setExpensesByMonth(monthlyExpenses);
    }

    // 2. Calcular ingresos
    if (incomes.length > 0) {
      const incomesTotal = incomes.reduce((sum, income) => sum + income.amount, 0);
      setTotalIncomes(incomesTotal);

      // Obtener el mes actual
      const currentDate = new Date();
      const firstDayOfMonth = startOfMonth(currentDate);
      const lastDayOfMonth = endOfMonth(currentDate);

      // Calcular ingresos del mes actual
      const thisMonthIncomes = incomes.filter((income) => {
        const incomeDate = new Date(income.date);
        return incomeDate >= firstDayOfMonth && incomeDate <= lastDayOfMonth;
      });

      const thisMonthIncomesTotal = thisMonthIncomes.reduce((sum, income) => sum + income.amount, 0);
      setMonthlyIncomes(thisMonthIncomesTotal);

      // Ingresos por categoría
      const byCategory = incomeCategories
        .map((category) => {
          const categoryIncomes = incomes.filter((i) => i.category === category);
          const total = categoryIncomes.reduce((sum, i) => sum + i.amount, 0);
          const percentage = incomesTotal > 0 ? (total / incomesTotal) * 100 : 0;

          return {
            category,
            amount: total,
            percentage: parseFloat(percentage.toFixed(1)),
          };
        })
        .filter((cat) => cat.amount > 0)
        .sort((a, b) => b.amount - a.amount);

      setIncomesByCategory(byCategory);

      // Ingresos por mes
      const last6Months: Record<string, number> = {};

      for (let i = 5; i >= 0; i--) {
        const month = subMonths(currentDate, i);
        const monthName = format(month, "MMM yyyy", { locale: es });
        last6Months[monthName] = 0;
      }

      incomes.forEach((income) => {
        const incomeDate = new Date(income.date);
        const monthName = format(incomeDate, "MMM yyyy", { locale: es });

        if (last6Months[monthName] !== undefined) {
          last6Months[monthName] += income.amount;
        }
      });

      const monthlyIncomes = Object.entries(last6Months).map(([month, amount]) => ({
        month,
        Ingresos: amount,
      }));

      setIncomesByMonth(monthlyIncomes);
    }

    // 3. Calcular balance y tasa de ahorro
    if (totalIncomes > 0 && totalExpenses > 0) {
      const balance = totalIncomes - totalExpenses;
      setNetBalance(balance);

      // Calcular tasa de ahorro
      const savingsRate = (balance / totalIncomes) * 100;
      setSavingsRate(parseFloat(savingsRate.toFixed(1)));
    }

    // 4. Obtener transacciones recientes
    const allTransactions = [
      ...expenses.map((expense) => ({
        ...expense,
        type: "expense",
      })),
      ...incomes.map((income) => ({
        ...income,
        type: "income",
      })),
    ];

    // Ordenar por fecha (más reciente primero) y tomar los 5 primeros
    const sortedTransactions = allTransactions
      .sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      })
      .slice(0, 5);

    setRecentTransactions(sortedTransactions);
  }, [expenses, incomes, totalExpenses, totalIncomes]);

  // Combinar datos de gastos e ingresos mensuales para gráfico comparativo
  const combinedMonthlyData = expensesByMonth.map((expenseData, index) => {
    const incomeData = incomesByMonth[index] || { month: expenseData.month, Ingresos: 0 };
    return {
      month: expenseData.month,
      Gastos: expenseData.Gastos,
      Ingresos: incomeData.Ingresos,
      Balance: incomeData.Ingresos - expenseData.Gastos,
    };
  });

  // Mostrar estado de carga con un timeout para evitar quedarse cargando para siempre
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    // Si el estado de carga dura más de 5 segundos, mostrar un mensaje
    let timer: NodeJS.Timeout;
    if (loading) {
      timer = setTimeout(() => {
        setShowTimeout(true);
      }, 5000);
    } else {
      setShowTimeout(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  // Abrir formulario para nuevo ingreso
  const handleNewIncome = () => {
    const now = new Date();

    setCurrentItem({
      id: "",
      description: "",
      amount: 0,
      category: "Salario",
      date: now,
      time: format(now, "HH:mm"),
    });

    setFormType("income");
    setIsEditing(false);
    setIsFormOpen(true);
  };

  // Abrir formulario para nuevo gasto
  const handleNewExpense = () => {
    const now = new Date();

    setCurrentItem({
      id: "",
      description: "",
      amount: 0,
      category: "Otros",
      date: now,
      time: format(now, "HH:mm"),
    });

    setFormType("expense");
    setIsEditing(false);
    setIsFormOpen(true);
  };

  // Cerrar formulario
  const handleCancel = () => {
    setIsFormOpen(false);
  };

  // Guardar (crear o actualizar)
  const handleSave = async () => {
    if (formType === "income") {
      try {
        // Crear la fecha completa combinando fecha y hora
        const dateStr = format(currentItem.date, "yyyy-MM-dd");
        const timeStr = currentItem.time || "00:00";
        const dateTimeStr = `${dateStr}T${timeStr}:00`;
        const completeDate = new Date(dateTimeStr);

        // Crear nuevo ingreso
        const newIncome = await addIncome({
          description: currentItem.description,
          amount: currentItem.amount,
          category: currentItem.category,
          date: completeDate,
          userId: user?.uid || "",
        });

        // Añadir el nuevo ingreso a la lista local
        useIncomeStore.getState().addIncome(newIncome);

        // Cerrar formulario tras éxito
        setIsFormOpen(false);
      } catch (error) {
        console.error("Error saving income:", error);
      }
    } else {
      // expense
      try {
        // Crear la fecha completa combinando fecha y hora
        const dateStr = format(currentItem.date, "yyyy-MM-dd");
        const timeStr = currentItem.time || "00:00";
        const dateTimeStr = `${dateStr}T${timeStr}:00`;
        const completeDate = new Date(dateTimeStr);

        // Crear nuevo gasto
        const newExpense = await addExpense({
          description: currentItem.description,
          amount: currentItem.amount,
          category: currentItem.category,
          date: completeDate,
          userId: user?.uid || "",
        });

        // Añadir el nuevo gasto a la lista local
        useExpenseStore.getState().addExpense(newExpense);

        // Cerrar formulario tras éxito
        setIsFormOpen(false);
      } catch (error) {
        console.error("Error saving expense:", error);
      }
    }
  };

  // Manejar cambios en el formulario
  const handleFormChange = (field: string, value: any) => {
    setCurrentItem({ ...currentItem, [field]: value });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        <Text>Cargando datos...</Text>
        {showTimeout && (
          <div className="text-center max-w-md">
            <Text className="text-amber-600">Esto está tomando más tiempo de lo esperado. Puedes intentar recargar la página.</Text>
            <button onClick={() => window.location.reload()} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
              Recargar página
            </button>
          </div>
        )}
      </div>
    );
  }

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  // Formatear fecha
  const formatDate = (date: Date) => {
    if (!date) return "-";
    return format(new Date(date), "dd MMM yyyy", { locale: es });
  };

  // Colores consistentes para gráficos según tipo de finanza
  const financialTypeColors = {
    income: INCOME_CATEGORIES["Salario"].color, // Usar un color de ingreso como representativo
    expense: EXPENSE_CATEGORIES["Comida"].color, // Usar un color de gasto como representativo
    balance: "#22c55e", // Verde para balance positivo
    negativeBalance: "#ef4444", // Rojo para balance negativo
  };

  // Generar colores para categorías de gastos
  const expenseCategoryChartColors = expensesByCategory.map((item) => {
    // Obtener el color de la categoría desde la configuración centralizada
    const config = EXPENSE_CATEGORIES[item.category as keyof typeof EXPENSE_CATEGORIES] || EXPENSE_CATEGORIES["Otros"];
    return config.color;
  });

  return (
    <div className="space-y-6">
      {/* Cabecera de la página */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">{format(new Date(), "EEEE, d MMM yyyy", { locale: es })} - Resumen de tus finanzas</p>
      </div>

      {/* Botones de acciones rápidas */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button variant="outline" onClick={handleNewIncome} className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
          <ArrowUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          Registrar Ingreso
        </Button>
        <Button variant="outline" onClick={handleNewExpense} className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
          <ArrowDown className="h-4 w-4 text-red-600 dark:text-red-400" />
          Registrar Gasto
        </Button>
      </div>

      {/* Resumen financiero */}
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
          value={`${savingsRate.toFixed(1)}%`}
          valueClassName={savingsRate >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
          subTitle={savingsRate > 0 ? "De tus ingresos" : "Sin ahorro"}
          icon={<PieChart className="h-6 w-6 text-blue-700 dark:text-blue-400" />}
          iconContainerClassName="bg-blue-100 dark:bg-blue-900/30"
          decorationColor={savingsRate >= 0 ? "green" : "red"}
        />
      </div>

      {/* Gráficos y estadísticas */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Transacciones recientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg">Transacciones Recientes</CardTitle>
            <Button variant="ghost" asChild className="text-xs sm:text-sm">
              <Link href="/dashboard/finanzas" className="flex items-center gap-1">
                Ver todo <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <List>
              {recentTransactions.map((transaction, index) => (
                <ListItem key={transaction.id}>
                  <div className="flex items-center gap-2 sm:gap-3">
                    {transaction.type === "income" ? (
                      <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                        <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                      </div>
                    ) : (
                      <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                        <ArrowDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                      </div>
                    )}
                    <div>
                      <Text className="text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-none">{transaction.description}</Text>
                      <Text className="text-[10px] sm:text-xs text-muted-foreground">{formatDate(new Date(transaction.date))}</Text>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-xs sm:text-sm ${transaction.type === "income" ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}>
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </span>
                    <CategoryBadge category={transaction.category} type={transaction.type} className="mt-1 text-[10px] sm:text-xs" />
                  </div>
                </ListItem>
              ))}
              {recentTransactions.length === 0 && (
                <div className="py-8 text-center">
                  <Text className="text-sm">No hay transacciones recientes</Text>
                </div>
              )}
            </List>
          </CardContent>
        </Card>

        {/* Gastos por categoría */}
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg">Gastos por Categoría</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-44 sm:h-60">
              <DonutChart data={expensesByCategory} category="amount" index="category" valueFormatter={formatCurrency} colors={expenseCategoryChartColors} className="h-full" />
            </div>
            <List className="mt-2 sm:mt-4">
              {expensesByCategory.slice(0, 3).map((category) => (
                <ListItem key={category.category}>
                  <div className="flex items-center gap-2">
                    <CategoryBadge category={category.category} type="expense" className="text-[10px] sm:text-xs" showIcon={true} />
                    <Text className="text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">{category.category}</Text>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs sm:text-sm font-medium">{formatCurrency(category.amount)}</span>
                    <Text className="text-[10px] sm:text-xs text-muted-foreground">{category.percentage}%</Text>
                  </div>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico temporal */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg">Evolución Financiera</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="h-56 sm:h-72">
            <BarChart
              data={incomesByMonth.map((item, index) => ({
                month: item.month,
                Ingresos: item["Ingresos"],
                Gastos: expensesByMonth[index]?.["Gastos"] || 0,
                Balance: item["Ingresos"] - (expensesByMonth[index]?.["Gastos"] || 0),
              }))}
              index="month"
              categories={["Ingresos", "Gastos", "Balance"]}
              colors={[
                financialTypeColors.income,
                financialTypeColors.expense,
                // Determinar color del balance basado en datos
                incomesByMonth.some((item, idx) => item["Ingresos"] - (expensesByMonth[idx]?.["Gastos"] || 0) < 0)
                  ? financialTypeColors.negativeBalance
                  : financialTypeColors.balance,
              ]}
              valueFormatter={formatCurrency}
              className="h-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Modal de formulario */}
      <DrawerDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) handleCancel();
        }}
        title={isEditing ? `Editar ${formType === "income" ? "Ingreso" : "Gasto"}` : `Nuevo ${formType === "income" ? "Ingreso" : "Gasto"}`}
        description={
          <DialogDescription>
            {isEditing ? `Edita los detalles del ${formType === "income" ? "ingreso" : "gasto"} seleccionado.` : `Agrega un nuevo ${formType === "income" ? "ingreso" : "gasto"}.`}
          </DialogDescription>
        }>
        <FinanceForm
          isOpen={isFormOpen}
          isEditing={isEditing}
          currentItem={currentItem}
          categories={formType === "income" ? incomeCategories : expenseCategories}
          title={formType === "income" ? "Ingreso" : "Gasto"}
          type={formType}
          onCancel={handleCancel}
          onSave={handleSave}
          onChange={handleFormChange}
        />
      </DrawerDialog>
    </div>
  );
}
