"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { TrendingUp, TrendingDown, Plus, ArrowUp, ArrowDown, Loader2, RefreshCw } from "lucide-react";
import { useAuthStore } from "@bill/_store/useAuthStore";
import { useIncomeStore } from "@bill/_store/useIncomeStore";
import { useExpenseStore } from "@bill/_store/useExpenseStore";
import { getUserIncomes, addIncome, updateIncome, deleteIncome } from "@bill/_firebase/incomeService";
import { getUserExpenses, addExpense, updateExpense, deleteExpense } from "@bill/_firebase/expenseService";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import SearchBar from "@bill/_components/SearchBar";
import FinanceForm from "@bill/_components/FinanceForm";
import FinanceTable from "@bill/_components/FinanceTable";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@bill/_components/ui/card";
import { DrawerDialog } from "@bill/_components/ui/drawer-dialog";
import { Button } from "@bill/_components/ui/button";
import { StatsCard } from "@bill/_components/ui/stats-card";
import { CategoryBadge } from "@bill/_components/ui/category-badge";
import { BarChart, DonutChart } from "@bill/_components/ui/charts";
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from "@bill/_components/ui/tab-group";
import { Text } from "@bill/_components/ui/typography";
import { List, ListItem } from "@bill/_components/ui/list";
import { DialogDescription } from "@bill/_components/ui/dialog";
import { translate } from "@bill/_components/ui/t";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "../../_lib/utils/categoryConfig";
import { getUserAccounts } from "@bill/_firebase/accountService";
import { useAccountStore } from "@bill/_store/useAccountStore";
import AccountManager from "@bill/_components/AccountManager";
import { useToast } from "@bill/_components/ui/use-toast";

// Define types for income and expense items
interface FinanceItem {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
  time?: string;
  accountId?: string;
}

interface Income extends Omit<FinanceItem, "date"> {
  date: Date | string;
  userId: string;
  accountId?: string;
}

interface Expense extends Omit<FinanceItem, "date"> {
  date: Date | string;
  userId: string;
  accountId?: string;
}

// Tipo para categorías de finanzas
interface CategoryStats {
  category: string;
  amount: number;
  percentage: number;
  [key: string]: string | number; // Índice para compatibilidad con ChartData
}

// Tipo para datos financieros mensuales
interface MonthlyFinanceData {
  month: string;
  Ingresos: number;
  Gastos: number;
  Balance: number;
  [key: string]: string | number; // Índice para compatibilidad con ChartData
}

// Categorías de ingresos
const incomeCategories = ["Salario", "Freelance", "Inversiones", "Ventas", "Regalos", "Reembolsos", "Otros"];

// Categorías de gastos
const expenseCategories = ["Comida", "Transporte", "Entretenimiento", "Servicios", "Compras", "Salud", "Educación", "Vivienda", "Otros"];

function FinancesPageContent() {
  const { user } = useAuthStore();
  const { incomes, setIncomes, loading: incomesLoading, setLoading: setIncomesLoading } = useIncomeStore();
  const { expenses, setExpenses, loading: expensesLoading, setLoading: setExpensesLoading } = useExpenseStore();
  const { accounts, setAccounts, loading: accountsLoading, setLoading: setAccountsLoading } = useAccountStore();
  const { toast } = useToast();

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
  const [currentItem, setCurrentItem] = useState<{
    id: string;
    description: string;
    amount: number;
    category: string;
    date: Date;
    time: string;
    accountId?: string;
  }>({
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
  const [incomesByCategory, setIncomesByCategory] = useState<CategoryStats[]>([]);
  const [expensesByCategory, setExpensesByCategory] = useState<CategoryStats[]>([]);
  const [financesByMonth, setFinancesByMonth] = useState<MonthlyFinanceData[]>([]);

  // Función simplificada que recarga TODOS los datos financieros del usuario
  const reloadAllFinancialData = useCallback(async () => {
    if (!user?.uid) return;

    try {
      console.log("🔄 Iniciando recarga completa de datos financieros...");
      setAccountsLoading(true);
      setIncomesLoading(true);
      setExpensesLoading(true);

      // 1. Cargar los datos de Firebase directamente en paralelo
      const [updatedAccounts, updatedIncomes, updatedExpenses] = await Promise.all([getUserAccounts(user.uid), getUserIncomes(user.uid), getUserExpenses(user.uid)]);

      // 2. Actualizar el estado global directamente con los datos de Firebase
      setAccounts(updatedAccounts);
      setIncomes(updatedIncomes);
      setExpenses(updatedExpenses);

      console.log(`✅ Datos actualizados: ${updatedAccounts.length} cuentas, ${updatedIncomes.length} ingresos, ${updatedExpenses.length} gastos`);

      // 3. Mostrar confirmación visual al usuario
      toast({
        title: "Datos actualizados",
        description: "Todos los datos financieros han sido actualizados",
        variant: "default",
      });
    } catch (error) {
      console.error("❌ Error recargando datos financieros:", error);
      toast({
        title: "Error de sincronización",
        description: "No se pudieron actualizar los datos. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setAccountsLoading(false);
      setIncomesLoading(false);
      setExpensesLoading(false);
    }
  }, [user, setAccounts, setIncomes, setExpenses, setAccountsLoading, setIncomesLoading, setExpensesLoading, toast]);

  // Reemplazar la función handleReloadAccountsAndBalance por una más simple
  const handleReloadData = reloadAllFinancialData;

  // Cargar datos financieros al iniciar
  useEffect(() => {
    if (!user) return;

    console.log("⚠️ Cargando datos financieros iniciales...");
    reloadAllFinancialData();
  }, [user, reloadAllFinancialData]);

  // Cerrar formulario - función requerida por linter
  const handleCancel = () => {
    setIsFormOpen(false);
  };

  // Operaciones CRUD para ingresos - simplificadas
  const handleAddIncome = async (incomeData: Partial<Income>) => {
    try {
      if (!user?.uid) throw new Error("Usuario no autenticado");

      // 1. Crear el ingreso en Firebase
      await addIncome({
        ...incomeData,
        userId: user.uid,
        date: incomeData.date || new Date(),
      } as Omit<FinanceItem, "id">);

      // 2. Recargar los datos financieros
      await reloadAllFinancialData();

      // 3. Notificar al usuario
      toast({
        title: "Ingreso añadido",
        variant: "success",
      });

      // 4. Cerrar cualquier diálogo abierto
      setIsFormOpen(false);
    } catch (error) {
      console.error("Error añadiendo ingreso:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el ingreso",
        variant: "destructive",
      });
    }
  };

  // Operación para actualizar un ingreso - simplificada
  const handleUpdateIncome = async (incomeData: Income) => {
    try {
      if (!user?.uid) throw new Error("Usuario no autenticado");

      // Asegurar que tenga userId
      const completeData: FinanceItem = {
        ...incomeData,
        userId: user.uid,
        // Asegurar que date es un objeto Date
        date: incomeData.date instanceof Date ? incomeData.date : new Date(incomeData.date),
      };

      // 1. Actualizar el ingreso en Firebase
      await updateIncome(completeData);

      // 2. Recargar los datos financieros
      await reloadAllFinancialData();

      // 3. Notificar al usuario
      toast({
        title: "Ingreso actualizado",
        variant: "success",
      });

      // 4. Cerrar cualquier diálogo abierto
      setIsFormOpen(false);
    } catch (error) {
      console.error("Error actualizando ingreso:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el ingreso",
        variant: "destructive",
      });
    }
  };

  // Operación para eliminar un ingreso - simplificada
  const handleDeleteIncome = async (id: string) => {
    try {
      // 1. Eliminar el ingreso en Firebase
      await deleteIncome(id);

      // 2. Recargar los datos financieros
      await reloadAllFinancialData();

      // 3. Notificar al usuario
      toast({
        title: "Ingreso eliminado",
        variant: "success",
      });
    } catch (error) {
      console.error("Error eliminando ingreso:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el ingreso",
        variant: "destructive",
      });
    }
  };

  // Operaciones CRUD para gastos - simplificadas
  const handleAddExpense = async (expenseData: Partial<Expense>) => {
    try {
      if (!user?.uid) throw new Error("Usuario no autenticado");

      // 1. Crear el gasto en Firebase
      await addExpense({
        ...expenseData,
        userId: user.uid,
        date: expenseData.date || new Date(),
      } as Omit<FinanceItem, "id">);

      // 2. Recargar los datos financieros
      await reloadAllFinancialData();

      // 3. Notificar al usuario
      toast({
        title: "Gasto añadido",
        variant: "success",
      });

      // 4. Cerrar cualquier diálogo abierto
      setIsFormOpen(false);
    } catch (error) {
      console.error("Error añadiendo gasto:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el gasto",
        variant: "destructive",
      });
    }
  };

  // Operación para actualizar un gasto - simplificada
  const handleUpdateExpense = async (expenseData: Expense) => {
    try {
      if (!user?.uid) throw new Error("Usuario no autenticado");

      // Asegurar que tenga userId
      const completeData: FinanceItem = {
        ...expenseData,
        userId: user.uid,
        // Asegurar que date es un objeto Date
        date: expenseData.date instanceof Date ? expenseData.date : new Date(expenseData.date),
      };

      // 1. Actualizar el gasto en Firebase
      await updateExpense(completeData);

      // 2. Recargar los datos financieros
      await reloadAllFinancialData();

      // 3. Notificar al usuario
      toast({
        title: "Gasto actualizado",
        variant: "success",
      });

      // 4. Cerrar cualquier diálogo abierto
      setIsFormOpen(false);
    } catch (error) {
      console.error("Error actualizando gasto:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el gasto",
        variant: "destructive",
      });
    }
  };

  // Operación para eliminar un gasto - simplificada
  const handleDeleteExpense = async (id: string) => {
    try {
      // 1. Eliminar el gasto en Firebase
      await deleteExpense(id);

      // 2. Recargar los datos financieros
      await reloadAllFinancialData();

      // 3. Notificar al usuario
      toast({
        title: "Gasto eliminado",
        variant: "success",
      });
    } catch (error) {
      console.error("Error eliminando gasto:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el gasto",
        variant: "destructive",
      });
    }
  };

  // Función unificada para guardar cualquier tipo de transacción
  const handleSave = async (item: Partial<FinanceItem & { time?: string; accountId?: string }>) => {
    try {
      if (!user) {
        toast({
          title: "Error de autenticación",
          description: "Debes iniciar sesión para realizar esta acción",
          variant: "destructive",
        });
        return;
      }

      if (!item.amount || item.amount <= 0) {
        toast({
          title: "Error en el monto",
          description: "El monto debe ser mayor que cero",
          variant: "destructive",
        });
        return;
      }

      // Delegar a la función CRUD correspondiente
      if (formType === "income") {
        if (isEditing && item.id) {
          await handleUpdateIncome(item as Income);
        } else {
          await handleAddIncome(item);
        }
      } else {
        if (isEditing && item.id) {
          await handleUpdateExpense(item as Expense);
        } else {
          await handleAddExpense(item);
        }
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  // Calcular métricas cuando cambian los datos
  useEffect(() => {
    // Calcular totales generales
    const incomesTotal = incomes.reduce((sum, income) => sum + income.amount, 0);
    const expensesTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    setTotalIncomes(incomesTotal);
    setTotalExpenses(expensesTotal);

    // Calcular balance basado en los saldos de todas las cuentas
    const accountsBalance = accounts.reduce((total, account) => total + account.balance, 0);
    setBalance(accountsBalance);

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
  }, [incomes, expenses, accounts]);

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

  // Escuchar cambios en las cuentas para actualizar la UI automáticamente
  useEffect(() => {
    // Calcular balance basado en los saldos de todas las cuentas
    const accountsBalance = accounts.reduce((total, account) => total + account.balance, 0);
    setBalance(accountsBalance);
  }, [accounts]); // Esta dependencia hará que se recalcule el balance cuando cambien las cuentas

  // Manejar cambios en el formulario
  const handleFormChange = (field: string, value: unknown) => {
    setCurrentItem({ ...currentItem, [field]: value });
  };

  // Abrir formulario para edición
  const handleEdit = (item: Income | Expense, type: "income" | "expense") => {
    const itemDate = new Date(item.date);

    setCurrentItem({
      id: item.id,
      description: item.description,
      amount: item.amount,
      category: item.category,
      date: itemDate,
      time: format(itemDate, "HH:mm"),
      accountId: item.accountId,
    });

    setFormType(type);
    setIsEditing(true);
    setIsFormOpen(true);
  };

  // Abrir formulario para nuevo ingreso
  const handleNewIncome = () => {
    const now = new Date();
    const { activeAccountId } = useAccountStore.getState();

    setCurrentItem({
      id: "",
      description: "",
      amount: 0,
      category: "Salario",
      date: now,
      time: format(now, "HH:mm"),
      accountId: activeAccountId || undefined,
    });

    setFormType("income");
    setIsEditing(false);
    setIsFormOpen(true);
  };

  // Abrir formulario para nuevo gasto
  const handleNewExpense = () => {
    const now = new Date();
    const { activeAccountId } = useAccountStore.getState();

    setCurrentItem({
      id: "",
      description: "",
      amount: 0,
      category: "Otros",
      date: now,
      time: format(now, "HH:mm"),
      accountId: activeAccountId || undefined,
    });

    setFormType("expense");
    setIsEditing(false);
    setIsFormOpen(true);
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
    <div className="flex flex-col p-4 gap-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Finanzas</h1>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleNewIncome} className="bg-green-500 hover:bg-green-600">
            <Plus className="mr-2 h-4 w-4" />
            Ingreso
          </Button>
          <Button onClick={handleNewExpense} className="bg-red-500 hover:bg-red-600">
            <Plus className="mr-2 h-4 w-4" />
            Gasto
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Panel izquierdo - Cuentas y Balance */}
        <div className="w-full lg:w-1/3 space-y-6">
          {/* Gestor de cuentas */}
          <div className="bg-card rounded-lg p-4 border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">{translate("Cuentas")}</h2>
            {!user ? (
              <div className="p-4 bg-muted/50 rounded-md text-center">
                <p className="text-sm text-muted-foreground">Inicia sesión para gestionar tus cuentas</p>
              </div>
            ) : accountsLoading ? (
              <div className="flex justify-center p-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs text-muted-foreground">
                    {accounts.length} {accounts.length === 1 ? "cuenta disponible" : "cuentas disponibles"}
                  </p>
                  <Button
                    variant={accountsLoading ? "secondary" : "outline"}
                    size="sm"
                    onClick={handleReloadData}
                    disabled={accountsLoading}
                    title="Forzar actualización de saldos"
                    className="relative">
                    <RefreshCw className={`h-4 w-4 mr-2 ${accountsLoading ? "animate-spin" : ""}`} />
                    {accountsLoading ? "Actualizando..." : "Actualizar saldos"}
                    {accountsLoading && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                      </span>
                    )}
                  </Button>
                </div>
                <AccountManager userId={user.uid} onReloadAccounts={handleReloadData} isLoading={accountsLoading} />
              </>
            )}
          </div>

          {/* Tarjeta de Saldos por Cuenta */}
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">{translate("Resumen")}</CardTitle>
              <CardDescription>{translate("Desglose de ingresos y gastos")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{translate("Ingresos")}</p>
                    <p className="text-xl font-bold text-green-500">{formatCurrency(totalIncomes)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{translate("Gastos")}</p>
                    <p className="text-xl font-bold text-red-500">{formatCurrency(totalExpenses)}</p>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-sm font-medium text-muted-foreground">{translate("Balance total")}</p>
                  <p className="text-2xl font-bold" style={{ color: balance >= 0 ? financialTypeColors.balance : financialTypeColors.negativeBalance }}>
                    {formatCurrency(balance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel derecho - Gráficos y Transacciones */}
        <div className="w-full lg:w-2/3">
          {/* Resumen financiero */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">{translate("Resumen Financiero")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Ingresos del mes */}
              <StatsCard
                title={translate("Ingresos este mes")}
                value={formatCurrency(monthlyIncomes)}
                valueClassName="text-blue-600 dark:text-blue-400"
                subValue={formatPercentage(monthlyIncomes, totalIncomes)}
                subTitle={translate("del total")}
                icon={<TrendingUp className="h-6 w-6 text-blue-700 dark:text-blue-400" />}
                iconContainerClassName="bg-blue-100 dark:bg-blue-900/30"
                decorationColor="blue"
                className="card-hover shadow-soft"
              />

              {/* Gastos del mes */}
              <StatsCard
                title={translate("Gastos este mes")}
                value={formatCurrency(monthlyExpenses)}
                valueClassName="text-red-600 dark:text-red-400"
                subValue={formatPercentage(monthlyExpenses, totalExpenses)}
                subTitle={translate("del total")}
                icon={<TrendingDown className="h-6 w-6 text-red-700 dark:text-red-400" />}
                iconContainerClassName="bg-red-100 dark:bg-red-900/30"
                decorationColor="red"
                className="card-hover shadow-soft"
              />

              <StatsCard
                title={translate("Balance este mes")}
                value={formatCurrency(monthlyBalance)}
                valueClassName={monthlyBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
                subValue={formatPercentage(Math.abs(monthlyBalance), Math.max(monthlyIncomes, monthlyExpenses))}
                subTitle={translate("del total")}
                icon={monthlyBalance >= 0 ? <ArrowUp className="h-5 w-5 text-green-600 dark:text-green-400" /> : <ArrowDown className="h-5 w-5 text-red-500 dark:text-red-400" />}
                iconContainerClassName={`bg-${monthlyBalance >= 0 ? "green" : "red"}-100 dark:bg-${monthlyBalance >= 0 ? "green" : "red"}-900/30`}
                decorationColor={monthlyBalance >= 0 ? "green" : "red"}
                className="card-hover shadow-soft"
              />
            </div>
          </div>

          {/* Gráfico por mes */}
          <Card className="shadow-soft mb-8">
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
                            items={
                              Array.isArray(filteredIncomes)
                                ? filteredIncomes.map((item) => ({
                                    ...item,
                                    userId: user?.uid || "",
                                    date: new Date(item.date),
                                  }))
                                : []
                            }
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
                            items={
                              Array.isArray(filteredExpenses)
                                ? filteredExpenses.map((item) => ({
                                    ...item,
                                    userId: user?.uid || "",
                                    date: new Date(item.date),
                                  }))
                                : []
                            }
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
        </div>
      </div>

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

// Wrap the main component with Suspense
export default function FinancesPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto p-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Finanzas</CardTitle>
              <CardDescription>Cargando datos financieros...</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </CardContent>
          </Card>
        </div>
      }>
      <FinancesPageContent />
    </Suspense>
  );
}
