"use client";

import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, TrendingDown, Calendar, Clock, ChevronDown, ChevronUp, Plus, ArrowUp, ArrowDown, X } from "lucide-react";
import { useAuthStore } from "@bill/_store/useAuthStore";
import { useIncomeStore } from "@bill/_store/useIncomeStore";
import { useExpenseStore } from "@bill/_store/useExpenseStore";
import { getUserIncomes, addIncome, updateIncome, deleteIncome } from "@bill/_firebase/incomeService";
import { getUserExpenses, addExpense, updateExpense, deleteExpense } from "@bill/_firebase/expenseService";
import { isValid, format, subMonths, differenceInDays, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import SearchBar from "@bill/_components/SearchBar";
import FinanceForm from "@bill/_components/FinanceForm";
import FinanceTable from "@bill/_components/FinanceTable";

import { Card, CardContent, CardHeader, CardTitle } from "@bill/_components/ui/card";
import { DrawerDialog } from "@bill/_components/ui/drawer-dialog";
import { Button } from "@bill/_components/ui/button";
import { StatsCard } from "@bill/_components/ui/stats-card";
import { CategoryBadge } from "@bill/_components/ui/category-badge";
import { BarChart, DonutChart } from "@bill/_components/ui/charts";
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from "@bill/_components/ui/tab-group";
import { Text } from "@bill/_components/ui/typography";
import { List, ListItem } from "@bill/_components/ui/list";
import { DialogDescription } from "@bill/_components/ui/dialog";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "../../../utils/categoryConfig";

// Define types for income and expense items
interface FinanceItem {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
  time?: string;
}

interface Income extends Omit<FinanceItem, "date"> {
  date: Date | string;
}

interface Expense extends Omit<FinanceItem, "date"> {
  date: Date | string;
}

// Categorías de ingresos
const incomeCategories = ["Salario", "Freelance", "Inversiones", "Ventas", "Regalos", "Reembolsos", "Otros"];

// Categorías de gastos
const expenseCategories = ["Comida", "Transporte", "Entretenimiento", "Servicios", "Compras", "Salud", "Educación", "Vivienda", "Otros"];

// Componente para la página unificada de gestión de finanzas
export default function FinancesPage() {
  const { user } = useAuthStore();
  const { incomes, setIncomes, loading: incomesLoading, setLoading: setIncomesLoading } = useIncomeStore();
  const { expenses, setExpenses, loading: expensesLoading, setLoading: setExpensesLoading } = useExpenseStore();

  // Estado para el tipo de finanza activa (ingreso o gasto)
  const [activeTab, setActiveTab] = useState(0); // 0 = ingresos, 1 = gastos

  // Estado para búsqueda y filtrado
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredIncomes, setFilteredIncomes] = useState<Income[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);

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

  // Estado para métricas
  const [totalIncomes, setTotalIncomes] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [balance, setBalance] = useState(0);
  const [monthlyIncomes, setMonthlyIncomes] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [monthlyBalance, setMonthlyBalance] = useState(0);
  const [incomesByCategory, setIncomesByCategory] = useState<any[]>([]);
  const [expensesByCategory, setExpensesByCategory] = useState<any[]>([]);
  const [financesByMonth, setFinancesByMonth] = useState<any[]>([]);

  // Estado para vista de tabla
  const [showTable, setShowTable] = useState(true);

  // Cargar datos financieros
  useEffect(() => {
    if (!incomes || !Array.isArray(incomes)) {
      setIncomes([]);
    }

    if (!expenses || !Array.isArray(expenses)) {
      setExpenses([]);
    }

    const loadFinances = async () => {
      if (user) {
        setIncomesLoading(true);
        setExpensesLoading(true);

        try {
          // Cargar ingresos
          const userIncomes = await getUserIncomes(user.uid);
          setIncomes(userIncomes);

          // Cargar gastos
          const userExpenses = await getUserExpenses(user.uid);
          setExpenses(userExpenses);
        } catch (error) {
          console.error("Error loading finances:", error);
          setIncomes([]);
          setExpenses([]);
        } finally {
          setIncomesLoading(false);
          setExpensesLoading(false);
        }
      }
    };

    loadFinances();
  }, [user, setIncomes, setExpenses, setIncomesLoading, setExpensesLoading]);

  // Calcular métricas cuando cambian los datos
  useEffect(() => {
    // Calcular totales generales
    const incomesTotal = incomes.reduce((sum, income) => sum + income.amount, 0);
    const expensesTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    setTotalIncomes(incomesTotal);
    setTotalExpenses(expensesTotal);
    setBalance(incomesTotal - expensesTotal);

    // Obtener el mes actual
    const currentDate = new Date();
    const firstDayOfMonth = startOfMonth(currentDate);
    const lastDayOfMonth = endOfMonth(currentDate);

    // Calcular ingresos y gastos del mes actual
    const thisMonthIncomes = incomes.filter((income) => {
      const incomeDate = new Date(income.date);
      return incomeDate >= firstDayOfMonth && incomeDate <= lastDayOfMonth;
    });

    const thisMonthExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= firstDayOfMonth && expenseDate <= lastDayOfMonth;
    });

    const thisMonthIncomesTotal = thisMonthIncomes.reduce((sum, income) => sum + income.amount, 0);
    const thisMonthExpensesTotal = thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    setMonthlyIncomes(thisMonthIncomesTotal);
    setMonthlyExpenses(thisMonthExpensesTotal);
    setMonthlyBalance(thisMonthIncomesTotal - thisMonthExpensesTotal);

    // Calcular ingresos por categoría
    if (incomes.length > 0) {
      const byCategory = incomeCategories
        .map((category) => {
          const categoryIncomes = incomes.filter((i) => i.category === category);
          const categoryTotal = categoryIncomes.reduce((sum, i) => sum + i.amount, 0);
          const percentage = incomesTotal > 0 ? (categoryTotal / incomesTotal) * 100 : 0;

          return {
            category,
            amount: categoryTotal,
            percentage: parseFloat(percentage.toFixed(1)),
          };
        })
        .filter((cat) => cat.amount > 0)
        .sort((a, b) => b.amount - a.amount);

      setIncomesByCategory(byCategory);
    }

    // Calcular gastos por categoría
    if (expenses.length > 0) {
      const byCategory = expenseCategories
        .map((category) => {
          const categoryExpenses = expenses.filter((e) => e.category === category);
          const categoryTotal = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
          const percentage = expensesTotal > 0 ? (categoryTotal / expensesTotal) * 100 : 0;

          return {
            category,
            amount: categoryTotal,
            percentage: parseFloat(percentage.toFixed(1)),
          };
        })
        .filter((cat) => cat.amount > 0)
        .sort((a, b) => b.amount - a.amount);

      setExpensesByCategory(byCategory);
    }

    // Datos combinados por mes
    const last6Months: Record<string, { incomes: number; expenses: number }> = {};

    for (let i = 5; i >= 0; i--) {
      const month = subMonths(currentDate, i);
      const monthName = format(month, "MMM yyyy", { locale: es });
      last6Months[monthName] = { incomes: 0, expenses: 0 };
    }

    // Sumar ingresos por mes
    incomes.forEach((income) => {
      const incomeDate = new Date(income.date);
      const monthName = format(incomeDate, "MMM yyyy", { locale: es });

      if (last6Months[monthName] !== undefined) {
        last6Months[monthName].incomes += income.amount;
      }
    });

    // Sumar gastos por mes
    expenses.forEach((expense) => {
      const expenseDate = new Date(expense.date);
      const monthName = format(expenseDate, "MMM yyyy", { locale: es });

      if (last6Months[monthName] !== undefined) {
        last6Months[monthName].expenses += expense.amount;
      }
    });

    const monthlyData = Object.entries(last6Months).map(([month, data]) => ({
      month,
      Ingresos: data.incomes,
      Gastos: data.expenses,
      Balance: data.incomes - data.expenses,
    }));

    setFinancesByMonth(monthlyData);
  }, [incomes, expenses]);

  // Filtrar datos cuando cambia el término de búsqueda
  useEffect(() => {
    // Filtrar ingresos
    if (incomes && incomes.length > 0) {
      const filtered = incomes.filter(
        (income) => income.description.toLowerCase().includes(searchTerm.toLowerCase()) || income.category.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Ordenar por fecha (más reciente primero)
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Asegurar que las fechas sean SIEMPRE objetos Date para el FinanceTable
      const formattedIncomes = filtered.map((income) => ({
        ...income,
        date: new Date(income.date), // Forzar conversión a Date
      }));

      setFilteredIncomes(formattedIncomes);
    } else {
      setFilteredIncomes([]);
    }

    // Filtrar gastos
    if (expenses && expenses.length > 0) {
      const filtered = expenses.filter(
        (expense) => expense.description.toLowerCase().includes(searchTerm.toLowerCase()) || expense.category.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Ordenar por fecha (más reciente primero)
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Asegurar que las fechas sean SIEMPRE objetos Date para el FinanceTable
      const formattedExpenses = filtered.map((expense) => ({
        ...expense,
        date: new Date(expense.date), // Forzar conversión a Date
      }));

      setFilteredExpenses(formattedExpenses);
    } else {
      setFilteredExpenses([]);
    }
  }, [incomes, expenses, searchTerm]);

  // Manejar cambios en el formulario
  const handleFormChange = (field: string, value: any) => {
    setCurrentItem({ ...currentItem, [field]: value });
  };

  // Abrir formulario para edición
  const handleEdit = (item: any, type: "income" | "expense") => {
    const itemDate = new Date(item.date);

    setCurrentItem({
      id: item.id,
      description: item.description,
      amount: item.amount,
      category: item.category,
      date: itemDate,
      time: format(itemDate, "HH:mm"),
    });

    setFormType(type);
    setIsEditing(true);
    setIsFormOpen(true);
  };

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
        // La fecha ya viene completa con hora desde el DateTimePickerForm
        const completeDate = currentItem.date;

        if (!isValid(completeDate)) {
          throw new Error("La fecha y hora no son válidas");
        }

        if (isEditing) {
          // Actualizar ingreso existente
          await updateIncome({
            id: currentItem.id,
            description: currentItem.description,
            amount: currentItem.amount,
            category: currentItem.category,
            date: completeDate,
            userId: user?.uid || "",
          });

          // Actualizar la lista de ingresos localmente
          const updatedIncome = {
            id: currentItem.id,
            description: currentItem.description,
            amount: currentItem.amount,
            category: currentItem.category,
            date: completeDate,
            userId: user?.uid || "",
          };

          useIncomeStore.getState().updateIncome(updatedIncome);
        } else {
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
        }

        // Cerrar formulario tras éxito
        setIsFormOpen(false);
      } catch (error) {
        console.error("Error saving income:", error);
        // Aquí se podría mostrar algún mensaje de error al usuario
      }
    } else {
      // expense
      try {
        // La fecha ya viene completa con hora desde el DateTimePickerForm
        const completeDate = currentItem.date;

        if (!isValid(completeDate)) {
          throw new Error("La fecha y hora no son válidas");
        }

        if (isEditing) {
          // Actualizar gasto existente
          await updateExpense({
            id: currentItem.id,
            description: currentItem.description,
            amount: currentItem.amount,
            category: currentItem.category,
            date: completeDate,
            userId: user?.uid || "",
          });

          // Actualizar la lista de gastos localmente
          const updatedExpense = {
            id: currentItem.id,
            description: currentItem.description,
            amount: currentItem.amount,
            category: currentItem.category,
            date: completeDate,
            userId: user?.uid || "",
          };

          useExpenseStore.getState().updateExpense(updatedExpense);
        } else {
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
        }

        // Cerrar formulario tras éxito
        setIsFormOpen(false);
      } catch (error) {
        console.error("Error saving expense:", error);
        // Aquí se podría mostrar algún mensaje de error al usuario
      }
    }
  };

  // Eliminar un ingreso
  const handleDeleteIncome = async (id: string) => {
    try {
      // Eliminar en Firebase
      await deleteIncome(id);

      // Actualizar estado local
      useIncomeStore.getState().deleteIncome(id);
    } catch (error) {
      console.error("Error deleting income:", error);
    }
  };

  // Eliminar un gasto
  const handleDeleteExpense = async (id: string) => {
    try {
      // Eliminar en Firebase
      await deleteExpense(id);

      // Actualizar estado local
      useExpenseStore.getState().deleteExpense(id);
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  // Formateador de moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  // Formateador de porcentaje
  const formatPercentage = (value: number, total: number) => {
    // Si el total es 0, el porcentaje debe ser 0 para evitar NaN
    if (total === 0) return "0%";

    const percentage = (value / total) * 100;
    return `${percentage.toFixed(1)}%`;
  };

  // Generate colors for income categories
  const incomeCategoryColors = incomesByCategory.map((item) => {
    // Obtener el color de la categoría desde la configuración centralizada
    const config = INCOME_CATEGORIES[item.category as keyof typeof INCOME_CATEGORIES] || INCOME_CATEGORIES["Otros"];
    return config.color;
  });

  // Generate colors for expense categories
  const expenseCategoryColors = expensesByCategory.map((item) => {
    // Obtener el color de la categoría desde la configuración centralizada
    const config = EXPENSE_CATEGORIES[item.category as keyof typeof EXPENSE_CATEGORIES] || EXPENSE_CATEGORIES["Otros"];
    return config.color;
  });

  // Colores consistentes para gráficos según tipo de finanza
  const financialTypeColors = {
    income: INCOME_CATEGORIES["Salario"].color, // Usar un color de ingreso como representativo
    expense: EXPENSE_CATEGORIES["Comida"].color, // Usar un color de gasto como representativo
    balance: "#22c55e", // Verde para balance positivo
    negativeBalance: "#ef4444", // Rojo para balance negativo
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Finanzas Personales</h1>
        <p className="text-sm text-muted-foreground mt-1">Administra tus ingresos, gastos y monitorea tus finanzas.</p>
      </div>

      {/* Resumen financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Ingresos del mes */}
        <StatsCard
          title="Ingresos este mes"
          value={formatCurrency(monthlyIncomes)}
          valueClassName="text-blue-600 dark:text-blue-400"
          subValue={formatPercentage(monthlyIncomes, totalIncomes)}
          subTitle="del total"
          icon={<TrendingUp className="h-6 w-6 text-blue-700 dark:text-blue-400" />}
          iconContainerClassName="bg-blue-100 dark:bg-blue-900/30"
          decorationColor="blue"
          className="card-hover shadow-soft"
        />

        {/* Gastos del mes */}
        <StatsCard
          title="Gastos este mes"
          value={formatCurrency(monthlyExpenses)}
          valueClassName="text-red-600 dark:text-red-400"
          subValue={formatPercentage(monthlyExpenses, totalExpenses)}
          subTitle="del total"
          icon={<TrendingDown className="h-6 w-6 text-red-700 dark:text-red-400" />}
          iconContainerClassName="bg-red-100 dark:bg-red-900/30"
          decorationColor="red"
          className="card-hover shadow-soft"
        />

        <StatsCard
          title="Balance"
          value={formatCurrency(monthlyBalance)}
          valueClassName={monthlyBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
          subValue={monthlyIncomes === 0 ? "0%" : `${Math.floor((monthlyBalance / monthlyIncomes) * 100)}%`}
          subTitle="de los ingresos"
          icon={monthlyBalance >= 0 ? <ArrowUp className="h-5 w-5 text-green-600 dark:text-green-400" /> : <ArrowDown className="h-5 w-5 text-red-500 dark:text-red-400" />}
          iconContainerClassName={`bg-${monthlyBalance >= 0 ? "green" : "red"}-100 dark:bg-${monthlyBalance >= 0 ? "green" : "red"}-900/30`}
          decorationColor={monthlyBalance >= 0 ? "green" : "red"}
          className="card-hover shadow-soft"
        />
      </div>

      {/* Gráfico por mes */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Evolución Mensual</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            className="mt-4 h-72 chart-animate"
            data={financesByMonth}
            index="month"
            categories={["Ingresos", "Gastos", "Balance"]}
            colors={[
              financialTypeColors.income,
              financialTypeColors.expense,
              // Determinar el color del balance según los datos
              financesByMonth.some((item) => item.Balance < 0) ? financialTypeColors.negativeBalance : financialTypeColors.balance,
            ]}
            valueFormatter={formatCurrency}
            stack={false}
            yAxisWidth={80}
          />
        </CardContent>
      </Card>

      {/* Pestañas para separar vistas */}
      <TabGroup index={activeTab} onIndexChange={setActiveTab}>
        <TabList className="w-full">
          <Tab className="w-full text-sm" value="ingresos">
            <TrendingUp className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
            Ingresos
          </Tab>
          <Tab className="w-full text-sm" value="gastos">
            <TrendingDown className="h-4 w-4 mr-2 text-red-600 dark:text-red-400" />
            Gastos
          </Tab>
        </TabList>

        <TabPanels>
          {/* Panel de ingresos */}
          <TabPanel value="ingresos">
            <div className="mt-4 space-y-6">
              {/* Buscador */}
              <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} onAddNew={handleNewIncome} placeholder="Buscar ingresos..." addButtonLabel="Nuevo" />

              {/* Contenido condicional */}
              {incomes.length === 0 && !incomesLoading ? (
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
                        items={Array.isArray(filteredIncomes) ? filteredIncomes : []}
                        loading={incomesLoading}
                        onEdit={(item) => handleEdit(item, "income")}
                        onDelete={handleDeleteIncome}
                        type="income"
                      />
                    </CardContent>
                  </Card>

                  {/* Distribución por categoría */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </TabPanel>

          {/* Panel de gastos */}
          <TabPanel value="gastos">
            <div className="mt-4 space-y-6">
              {/* Buscador */}
              <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} onAddNew={handleNewExpense} placeholder="Buscar gastos..." addButtonLabel="Nuevo" />

              {/* Contenido condicional */}
              {expenses.length === 0 && !expensesLoading ? (
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
                  <Card className="shadow-soft">
                    <CardHeader className="px-4 sm:px-6">
                      <CardTitle className="text-base sm:text-lg">Historial de Gastos</CardTitle>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-6">
                      <FinanceTable
                        items={Array.isArray(filteredExpenses) ? filteredExpenses : []}
                        loading={expensesLoading}
                        onEdit={(item) => handleEdit(item, "expense")}
                        onDelete={handleDeleteExpense}
                        type="expense"
                      />
                    </CardContent>
                  </Card>

                  {/* Distribución por categoría */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </>
              )}
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>

      {/* Modal de formulario usando DrawerDialog para responsiveness */}
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
