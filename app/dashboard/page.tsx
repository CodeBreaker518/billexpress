'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Card, 
  Title, 
  Text, 
  Metric, 
  BarChart, 
  DonutChart, 
  Tab, 
  TabList,
  TabGroup,
  TabPanel,
  TabPanels,
  Flex,
  BadgeDelta,
  Grid,
  Col,
  ProgressBar,
  Button,
  List,
  ListItem,
  Divider,
  Bold,
  CategoryBar,
  Legend,
  Badge
} from '@tremor/react';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  TrendingUp, 
  ArrowRight,
  PlusCircle,
  MinusCircle,
  Wallet,
  BarChart2,
  Settings,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '@bill/_store/useAuthStore';
import { useExpenseStore } from '@bill/_store/useExpenseStore';
import { useIncomeStore } from '@bill/_store/useIncomeStore';
import { getUserExpenses } from '@bill/_firebase/expenseService';
import { getUserIncomes } from '@bill/_firebase/incomeService';
import { format, subMonths, isAfter, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

// Categorías de gastos
const expenseCategories = [
  'Comida',
  'Transporte',
  'Entretenimiento',
  'Servicios',
  'Compras',
  'Salud',
  'Educación',
  'Otros'
];

// Categorías de ingresos
const incomeCategories = [
  'Salario',
  'Freelance',
  'Inversiones',
  'Ventas',
  'Regalos',
  'Reembolsos',
  'Otros'
];

// Función para obtener el color asociado a la categoría (para consistencia visual)
const getCategoryColor = (category: string, isExpense: boolean = true) => {
  if (isExpense) {
    switch (category) {
      case 'Comida': return 'red';
      case 'Transporte': return 'orange';
      case 'Entretenimiento': return 'purple';
      case 'Servicios': return 'blue';
      case 'Compras': return 'amber';
      case 'Salud': return 'emerald';
      case 'Educación': return 'indigo';
      default: return 'gray';
    }
  } else {
    switch (category) {
      case 'Salario': return 'green';
      case 'Freelance': return 'blue';
      case 'Inversiones': return 'violet';
      case 'Ventas': return 'orange';
      case 'Regalos': return 'pink';
      case 'Reembolsos': return 'cyan';
      default: return 'gray';
    }
  }
};

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
          console.error('Error loading data:', error);
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
      const thisMonthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= firstDayOfMonth && expenseDate <= lastDayOfMonth;
      });
      
      const thisMonthExpensesTotal = thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      setMonthlyExpenses(thisMonthExpensesTotal);
      
      // Gastos por categoría
      const byCategory = expenseCategories.map(category => {
        const categoryExpenses = expenses.filter(e => e.category === category);
        const total = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
        const percentage = expensesTotal > 0 ? (total / expensesTotal) * 100 : 0;
        
        return {
          category,
          amount: total,
          percentage: parseFloat(percentage.toFixed(1))
        };
      }).filter(cat => cat.amount > 0)
        .sort((a, b) => b.amount - a.amount);
      
      setExpensesByCategory(byCategory);
      
      // Gastos por mes
      const last6Months: Record<string, number> = {};
      
      for (let i = 5; i >= 0; i--) {
        const month = subMonths(currentDate, i);
        const monthName = format(month, 'MMM yyyy', { locale: es });
        last6Months[monthName] = 0;
      }
      
      expenses.forEach(expense => {
        const expenseDate = new Date(expense.date);
        const monthName = format(expenseDate, 'MMM yyyy', { locale: es });
        
        if (last6Months[monthName] !== undefined) {
          last6Months[monthName] += expense.amount;
        }
      });
      
      const monthlyExpenses = Object.entries(last6Months).map(([month, amount]) => ({
        month,
        "Gastos": amount
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
      const thisMonthIncomes = incomes.filter(income => {
        const incomeDate = new Date(income.date);
        return incomeDate >= firstDayOfMonth && incomeDate <= lastDayOfMonth;
      });
      
      const thisMonthIncomesTotal = thisMonthIncomes.reduce((sum, income) => sum + income.amount, 0);
      setMonthlyIncomes(thisMonthIncomesTotal);
      
      // Ingresos por categoría
      const byCategory = incomeCategories.map(category => {
        const categoryIncomes = incomes.filter(i => i.category === category);
        const total = categoryIncomes.reduce((sum, i) => sum + i.amount, 0);
        const percentage = incomesTotal > 0 ? (total / incomesTotal) * 100 : 0;
        
        return {
          category,
          amount: total,
          percentage: parseFloat(percentage.toFixed(1))
        };
      }).filter(cat => cat.amount > 0)
        .sort((a, b) => b.amount - a.amount);
      
      setIncomesByCategory(byCategory);
      
      // Ingresos por mes
      const last6Months: Record<string, number> = {};
      
      for (let i = 5; i >= 0; i--) {
        const month = subMonths(currentDate, i);
        const monthName = format(month, 'MMM yyyy', { locale: es });
        last6Months[monthName] = 0;
      }
      
      incomes.forEach(income => {
        const incomeDate = new Date(income.date);
        const monthName = format(incomeDate, 'MMM yyyy', { locale: es });
        
        if (last6Months[monthName] !== undefined) {
          last6Months[monthName] += income.amount;
        }
      });
      
      const monthlyIncomes = Object.entries(last6Months).map(([month, amount]) => ({
        month,
        "Ingresos": amount
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
      ...expenses.map(expense => ({
        ...expense,
        type: 'expense'
      })),
      ...incomes.map(income => ({
        ...income,
        type: 'income'
      }))
    ];
    
    // Ordenar por fecha (más reciente primero) y tomar los 5 primeros
    const sortedTransactions = allTransactions.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }).slice(0, 5);
    
    setRecentTransactions(sortedTransactions);
    
  }, [expenses, incomes, totalExpenses, totalIncomes]);

  // Combinar datos de gastos e ingresos mensuales para gráfico comparativo
  const combinedMonthlyData = expensesByMonth.map((expenseData, index) => {
    const incomeData = incomesByMonth[index] || { month: expenseData.month, "Ingresos": 0 };
    return {
      month: expenseData.month,
      "Gastos": expenseData.Gastos,
      "Ingresos": incomeData.Ingresos
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        <Text>Cargando datos...</Text>
        {showTimeout && (
          <div className="text-center max-w-md">
            <Text className="text-amber-600">Esto está tomando más tiempo de lo esperado. Puedes intentar recargar la página.</Text>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Recargar página
            </button>
          </div>
        )}
      </div>
    );
  }
  
  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  // Formatear fecha
  const formatDate = (date: Date) => {
    if (!date) return '-';
    return format(new Date(date), 'dd MMM yyyy', { locale: es });
  };
  
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Title>Dashboard Financiero</Title>
        <Text>Resumen de tus finanzas personales</Text>
      </div>
      
      {/* Acciones Rápidas */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-6">
        <div className="mb-3">
          <Text className="font-medium">Acciones Rápidas</Text>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link href="/dashboard/ingresos">
            <Button 
              className="w-full" 
              variant="secondary" 
              icon={PlusCircle} 
              color="green"
            >
              <span className="hidden sm:inline">Nuevo</span> Ingreso
            </Button>
          </Link>
          <Link href="/dashboard/gastos">
            <Button 
              className="w-full" 
              variant="secondary" 
              icon={MinusCircle} 
              color="red"
            >
              <span className="hidden sm:inline">Nuevo</span> Gasto
            </Button>
          </Link>
          <Link href="/dashboard/reportes">
            <Button 
              className="w-full" 
              variant="secondary" 
              icon={BarChart2}
            >
              <span className="hidden sm:inline">Ver</span> Reportes
            </Button>
          </Link>
          <Link href="/dashboard/configuracion">
            <Button 
              className="w-full" 
              variant="secondary" 
              icon={Settings}
            >
              <span className="hidden sm:inline">Ajustar</span> Config.
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Resumen Mensual */}
      <Card className="mb-6">
        <Title>Resumen del Mes</Title>
        <Text>
          {format(new Date(), 'MMMM yyyy', { locale: es })}
        </Text>
        
        <Grid numItemsMd={2} numItemsLg={3} className="gap-6 mt-6">
          <Card decoration="top" decorationColor="green">
            <Flex justifyContent="between" alignItems="center">
              <Text>Ingresos</Text>
              <ArrowUpCircle className="h-5 w-5 text-green-500" />
            </Flex>
            <Metric className="mt-2">{formatCurrency(monthlyIncomes)}</Metric>
          </Card>
          
          <Card decoration="top" decorationColor="red">
            <Flex justifyContent="between" alignItems="center">
              <Text>Gastos</Text>
              <ArrowDownCircle className="h-5 w-5 text-red-500" />
            </Flex>
            <Metric className="mt-2">{formatCurrency(monthlyExpenses)}</Metric>
          </Card>
          
          <Card decoration="top" decorationColor="blue">
            <Flex justifyContent="between" alignItems="center">
              <Text>Balance</Text>
              <Wallet className="h-5 w-5 text-blue-500" />
            </Flex>
            <Metric className={`mt-2 ${monthlyIncomes - monthlyExpenses >= 0 ? "text-green-500" : "text-red-500"}`}>
              {formatCurrency(monthlyIncomes - monthlyExpenses)}
            </Metric>
          </Card>
        </Grid>
      </Card>
      
      {/* Tarjetas de resumen total */}
      <Grid numItemsMd={2} numItemsLg={3} className="gap-6 mb-6">
        <Card decoration="top" decorationColor="red">
          <Flex justifyContent="between" alignItems="center">
            <Text>Total Gastos</Text>
            <BadgeDelta
              deltaType="moderateDecrease"
              isIncreasePositive={false}
            >
              Acumulado
            </BadgeDelta>
          </Flex>
          <Metric className="mt-2">{formatCurrency(totalExpenses)}</Metric>
        </Card>

        <Card decoration="top" decorationColor="green">
          <Flex justifyContent="between" alignItems="center">
            <Text>Total Ingresos</Text>
            <BadgeDelta deltaType="moderateIncrease">Acumulado</BadgeDelta>
          </Flex>
          <Metric className="mt-2">{formatCurrency(totalIncomes)}</Metric>
        </Card>

        <Card decoration="top" decorationColor="blue">
          <Flex justifyContent="between" alignItems="center">
            <Text>Balance Total</Text>
            <BadgeDelta 
              deltaType={netBalance >= 0 ? "moderateIncrease" : "moderateDecrease"}
              isIncreasePositive={true}
            >
              {savingsRate}% ahorrado
            </BadgeDelta>
          </Flex>
          <Metric className={`mt-2 ${netBalance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {formatCurrency(netBalance)}
          </Metric>
          <CategoryBar 
            className="mt-4" 
            values={[100 - savingsRate, savingsRate]} 
            colors={["red", "emerald"]} 
            showLabels={false}
            tooltip="Tasa de ahorro"
          />
          <Flex className="mt-3 text-xs">
            <Text>Gastos ({(100 - savingsRate).toFixed(1)}%)</Text>
            <Text>Ahorros ({savingsRate.toFixed(1)}%)</Text>
          </Flex>
        </Card>
      </Grid>
      
      {/* Gráficos */}
      <Grid numItemsMd={1} numItemsLg={2} className="gap-6 mb-6">
        <Card>
          <Title>Flujo de Dinero</Title>
          <Text>Comparativa de ingresos y gastos en los últimos 6 meses</Text>
          
          <BarChart
            className="mt-6 h-80"
            data={combinedMonthlyData}
            index="month"
            categories={["Ingresos", "Gastos"]}
            colors={["emerald", "red"]}
            valueFormatter={formatCurrency}
            yAxisWidth={80}
            showLegend={true}
          />
        </Card>
        
        <TabGroup>
          <TabList variant="solid">
            <Tab>Gastos por Categoría</Tab>
            <Tab>Ingresos por Categoría</Tab>
          </TabList>
          
          <TabPanels>
            {/* Panel de gastos */}
            <TabPanel>
              <div className="mt-4">
                <DonutChart
                  className="h-60"
                  data={expensesByCategory}
                  category="amount"
                  index="category"
                  valueFormatter={formatCurrency}
                  colors={expensesByCategory.map(c => getCategoryColor(c.category))}
                />
                <List className="mt-4">
                  {expensesByCategory.slice(0, 5).map((item) => (
                    <ListItem key={item.category}>
                      <div className="flex justify-between items-center w-full">
                        <div className="flex items-center">
                          <Badge color={getCategoryColor(item.category)} size="sm" className="mr-2">
                            {item.percentage}%
                          </Badge>
                          <span>{item.category}</span>
                        </div>
                        <Bold>{formatCurrency(item.amount)}</Bold>
                      </div>
                    </ListItem>
                  ))}
                </List>
              </div>
            </TabPanel>
            
            {/* Panel de ingresos */}
            <TabPanel>
              <div className="mt-4">
                <DonutChart
                  className="h-60"
                  data={incomesByCategory}
                  category="amount"
                  index="category"
                  valueFormatter={formatCurrency}
                  colors={incomesByCategory.map(c => getCategoryColor(c.category, false))}
                />
                <List className="mt-4">
                  {incomesByCategory.slice(0, 5).map((item) => (
                    <ListItem key={item.category}>
                      <div className="flex justify-between items-center w-full">
                        <div className="flex items-center">
                          <Badge color={getCategoryColor(item.category, false)} size="sm" className="mr-2">
                            {item.percentage}%
                          </Badge>
                          <span>{item.category}</span>
                        </div>
                        <Bold>{formatCurrency(item.amount)}</Bold>
                      </div>
                    </ListItem>
                  ))}
                </List>
              </div>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </Grid>
      
      {/* Transacciones Recientes */}
      <Card>
        <Title>Transacciones Recientes</Title>
        <Text>Últimas 5 transacciones registradas</Text>
        
        {recentTransactions.length > 0 ? (
          <List className="mt-4">
            {recentTransactions.map((transaction) => (
              <ListItem key={transaction.id}>
                <div className="flex justify-between items-center w-full">
                  <div>
                    <Text className="font-medium">{transaction.description}</Text>
                    <div className="flex items-center text-sm text-gray-500">
                      <Badge color={getCategoryColor(transaction.category, transaction.type === 'expense')} size="xs" className="mr-2">
                        {transaction.category}
                      </Badge>
                      <span>{formatDate(transaction.date)}</span>
                    </div>
                  </div>
                  <Text className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                    {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                  </Text>
                </div>
              </ListItem>
            ))}
          </List>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-10 w-10 text-gray-400 mb-2" />
            <Text>No hay transacciones registradas</Text>
            <div className="flex gap-3 mt-4">
              <Link href="/dashboard/ingresos">
                <Button size="xs" variant="secondary" icon={PlusCircle} color="green">Nuevo Ingreso</Button>
              </Link>
              <Link href="/dashboard/gastos">
                <Button size="xs" variant="secondary" icon={MinusCircle} color="red">Nuevo Gasto</Button>
              </Link>
            </div>
          </div>
        )}
        
        <Divider />
        
        <div className="flex justify-between items-center mt-4">
          <Link href="/dashboard/ingresos">
            <Button variant="light" color="green" icon={ArrowRight} iconPosition="right">
              Ver todos los ingresos
            </Button>
          </Link>
          <Link href="/dashboard/gastos">
            <Button variant="light" color="red" icon={ArrowRight} iconPosition="right">
              Ver todos los gastos
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}