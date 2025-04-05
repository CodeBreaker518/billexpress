'use client';

import { useState, useEffect } from 'react';
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
  Grid,
  Badge,
  Bold,
  Button,
  Flex
} from '@tremor/react';
import { 
  DollarSign, 
  TrendingDown, 
  Calendar, 
  Clock,
  ChevronDown, 
  ChevronUp
} from 'lucide-react';
import { useAuthStore } from '@bill/_store/useAuthStore';
import { useExpenseStore } from '@bill/_store/useExpenseStore';
import { getUserExpenses, addExpense, updateExpense, deleteExpense } from '@bill/_firebase/expenseService';
import { isValid, format, subMonths, differenceInDays, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import SearchBar from '@bill/_components/SearchBar';
import FinanceForm from '@bill/_components/FinanceForm';
import FinanceTable from '@bill/_components/FinanceTable';

// Lista de categorías
const categories = [
  'Comida',
  'Transporte',
  'Entretenimiento',
  'Servicios',
  'Compras',
  'Salud',
  'Educación',
  'Otros'
];

// Función para obtener el color asociado a la categoría
const getCategoryColor = (category: string) => {
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
};

// Componente para la página de gestión de gastos
export default function ExpensesPage() {
  const { user } = useAuthStore();
  const { expenses, setExpenses, loading, setLoading } = useExpenseStore();
  
  // Estado para búsqueda y filtrado
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredExpenses, setFilteredExpenses] = useState<any[]>([]);
  
  // Estado para formulario
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentExpense, setCurrentExpense] = useState({
    id: '',
    description: '',
    amount: 0,
    category: 'Otros',
    date: new Date(),
    time: format(new Date(), 'HH:mm')
  });

  // Estado para métricas
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [expensesByCategory, setExpensesByCategory] = useState<any[]>([]);
  const [expensesByMonth, setExpensesByMonth] = useState<any[]>([]);
  const [recentTrend, setRecentTrend] = useState(0);
  const [mostRecentExpense, setMostRecentExpense] = useState<any>(null);
  
  // Cargar gastos
  useEffect(() => {
    const loadExpenses = async () => {
      if (user) {
        setLoading(true);
        try {
          const userExpenses = await getUserExpenses(user.uid);
          setExpenses(userExpenses);
        } catch (error) {
          console.error('Error loading expenses:', error);
          setExpenses([]);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadExpenses();
  }, [user, setExpenses, setLoading]);

  // Calcular métricas cuando cambian los gastos
  useEffect(() => {
    if (expenses.length > 0) {
      // Total general
      const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      setTotalExpenses(total);
      
      // Obtener el mes actual
      const currentDate = new Date();
      const firstDayOfMonth = startOfMonth(currentDate);
      const lastDayOfMonth = endOfMonth(currentDate);
      
      // Calcular gastos del mes actual
      const thisMonthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= firstDayOfMonth && expenseDate <= lastDayOfMonth;
      });
      
      const thisMonthTotal = thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      setMonthlyExpenses(thisMonthTotal);
      
      // Encontrar el gasto con la fecha más reciente (por fecha de transacción, no de edición)
      const sortedByTransactionDate = [...expenses].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      if (sortedByTransactionDate.length > 0) {
        setMostRecentExpense(sortedByTransactionDate[0]);
      }
      
      // Calcular tendencia
      const prevMonthStart = startOfMonth(subMonths(currentDate, 1));
      const prevMonthEnd = endOfMonth(subMonths(currentDate, 1));
      
      const prevMonthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= prevMonthStart && expenseDate <= prevMonthEnd;
      });
      
      const prevMonthTotal = prevMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      if (prevMonthTotal > 0) {
        const trendPercentage = ((thisMonthTotal - prevMonthTotal) / prevMonthTotal) * 100;
        setRecentTrend(parseFloat(trendPercentage.toFixed(1)));
      }
      
      // Gastos por categoría
      const byCategory = categories.map(category => {
        const categoryExpenses = expenses.filter(e => e.category === category);
        const categoryTotal = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
        const percentage = total > 0 ? (categoryTotal / total) * 100 : 0;
        
        return {
          category,
          amount: categoryTotal,
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
      
      const monthlyData = Object.entries(last6Months).map(([month, amount]) => ({
        month,
        "Gastos": amount
      }));
      
      setExpensesByMonth(monthlyData);
    }
  }, [expenses]);
  
  // Filtrar gastos cuando cambia el término de búsqueda o los gastos
  useEffect(() => {
    if (expenses.length > 0) {
      const filtered = expenses.filter(expense => 
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // Ordenar por fecha (más reciente primero)
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setFilteredExpenses(filtered);
    } else {
      setFilteredExpenses([]);
    }
  }, [expenses, searchTerm]);
  
  // Manejar cambios en el formulario
  const handleFormChange = (field: string, value: any) => {
    setCurrentExpense({ ...currentExpense, [field]: value });
  };
  
  // Abrir formulario para edición
  const handleEdit = (expense: any) => {
    const expenseDate = new Date(expense.date);
    
    setCurrentExpense({
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      date: expenseDate,
      time: format(expenseDate, 'HH:mm')
    });
    setIsEditing(true);
    setIsFormOpen(true);
  };
  
  // Abrir formulario para nuevo gasto
  const handleNew = () => {
    const now = new Date();
    
    setCurrentExpense({
      id: '',
      description: '',
      amount: 0,
      category: 'Otros',
      date: now,
      time: format(now, 'HH:mm')
    });
    setIsEditing(false);
    setIsFormOpen(true);
  };
  
  // Cerrar formulario
  const handleCancel = () => {
    setIsFormOpen(false);
  };
  
  // Guardar gasto (nuevo o editado)
  const handleSave = async () => {
    if (!user) return;
    if (!currentExpense.description || currentExpense.amount <= 0 || !isValid(currentExpense.date)) {
      alert('Por favor completa todos los campos correctamente');
      return;
    }
    
    setLoading(true);
    
    try {
      // Verificar si hay conexión a internet
      const isOnline = navigator.onLine;
      
      if (isEditing) {
        // Actualizar gasto existente
        const updatedExpense = {
          ...currentExpense,
          userId: user.uid
        };
        
        await updateExpense(updatedExpense);
        
        // Actualizar estado local
        setExpenses(expenses.map(expense => 
          expense.id === currentExpense.id ? updatedExpense : expense
        ));
        
        // Mostrar feedback según el estado de conexión
        if (!isOnline) {
          alert('Gasto actualizado en modo offline. Se sincronizará cuando recuperes conexión a internet.');
        }
      } else {
        // Añadir nuevo gasto
        const newExpense = await addExpense({
          description: currentExpense.description,
          amount: currentExpense.amount,
          category: currentExpense.category,
          date: currentExpense.date,
          userId: user.uid
        });
        
        // Actualizar estado local
        setExpenses([...expenses, newExpense]);
        
        // Mostrar feedback según el estado de conexión
        if (!isOnline) {
          alert('Gasto guardado en modo offline. Se sincronizará cuando recuperes conexión a internet.');
        }
      }
      
      // Cerrar formulario después de guardar
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Ocurrió un error al guardar el gasto. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };
  
  // Eliminar gasto
  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este gasto?')) return;
    
    setLoading(true);
    
    try {
      // Verificar si hay conexión a internet
      const isOnline = navigator.onLine;
      
      await deleteExpense(id);
      
      // Actualizar estado local
      setExpenses(expenses.filter(expense => expense.id !== id));
      
      // Mostrar feedback según el estado de conexión
      if (!isOnline) {
        alert('Gasto eliminado en modo offline. Se sincronizará cuando recuperes conexión a internet.');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Ocurrió un error al eliminar el gasto. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };
  
  // Formatear fecha y hora
  const formatDateTime = (date: Date) => {
    return format(new Date(date), 'dd MMM yyyy HH:mm', { locale: es });
  };
  
  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="text-red-500 dark:text-red-400" />
          <Title>Gestión de Gastos</Title>
        </div>
        <Text className="text-gray-600 dark:text-gray-400">
          Gestiona tus gastos, añade nuevos, edita o elimina los existentes.
        </Text>
      </div>
      
      {/* Métricas de Gastos */}
      <Grid numItemsMd={2} numItemsLg={4} className="gap-6 mb-6">
        <Card decoration="top" decorationColor="red">
          <Flex justifyContent="start" alignItems="center" className="space-x-4">
            <div className="rounded-full bg-red-100 dark:bg-red-800 p-2">
              <DollarSign className="h-6 w-6 text-red-600 dark:text-red-300" />
            </div>
            <div>
              <Text>Total Gastos</Text>
              <Metric>{formatCurrency(totalExpenses)}</Metric>
            </div>
          </Flex>
        </Card>
        
        <Card decoration="top" decorationColor="amber">
          <Flex justifyContent="start" alignItems="center" className="space-x-4">
            <div className="rounded-full bg-amber-100 dark:bg-amber-800 p-2">
              <Calendar className="h-6 w-6 text-amber-600 dark:text-amber-300" />
            </div>
            <div>
              <Text>Gastos del Mes</Text>
              <Metric>{formatCurrency(monthlyExpenses)}</Metric>
            </div>
          </Flex>
        </Card>
        
        <Card decoration="top" decorationColor="blue">
          <Flex justifyContent="start" alignItems="center" className="space-x-4">
            <div className="rounded-full bg-blue-100 dark:bg-blue-800 p-2">
              <TrendingDown className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <Text>Tendencia</Text>
              <Metric className={recentTrend < 0 ? 'text-green-600' : 'text-red-600'}>
                {recentTrend < 0 ? '' : '+'}{recentTrend}%
              </Metric>
              <Text className="text-xs">vs. mes anterior</Text>
            </div>
          </Flex>
        </Card>
        
        <Card decoration="top" decorationColor="violet">
          <Flex justifyContent="start" alignItems="center" className="space-x-4">
            <div className="rounded-full bg-violet-100 dark:bg-violet-800 p-2">
              <Clock className="h-6 w-6 text-violet-600 dark:text-violet-300" />
            </div>
            <div>
              <Text>Gastos Recientes</Text>
              <Metric>{mostRecentExpense ? formatCurrency(mostRecentExpense.amount) : '$0'}</Metric>
              <Text className="text-xs">
                {mostRecentExpense 
                  ? `${formatDateTime(new Date(mostRecentExpense.date))} (hace ${differenceInDays(new Date(), new Date(mostRecentExpense.date))} días)` 
                  : 'No hay gastos recientes'}
              </Text>
            </div>
          </Flex>
        </Card>
      </Grid>
      
      {/* Formulario para añadir/editar gastos */}
      {isFormOpen && (
        <FinanceForm
          isOpen={isFormOpen}
          isEditing={isEditing}
          currentItem={currentExpense}
          categories={categories}
          title="Gasto"
          onCancel={handleCancel}
          onSave={handleSave}
          onChange={handleFormChange}
        />
      )}
      
      {/* Visualizaciones y Tabla */}
      <TabGroup>
        <TabList className="mb-6">
          <Tab>Tabla de Gastos</Tab>
          <Tab>Análisis</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            {/* Barra de búsqueda y botón para añadir */}
            <SearchBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onAddNew={handleNew}
              placeholder="Buscar gastos..."
              addButtonLabel="Nuevo Gasto"
            />
            
            {/* Tabla de gastos */}
            <Card>
              <FinanceTable
                items={filteredExpenses}
                loading={loading}
                type="expense"
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </Card>
          </TabPanel>
          
          <TabPanel>
            {/* Gráficos de Análisis */}
            <Grid numItemsMd={1} numItemsLg={2} className="gap-6 mb-6">
              <Card>
                <Title>Gastos por Categoría</Title>
                <Text>Distribución de gastos por categoría</Text>
                
                <DonutChart
                  className="mt-6 h-80"
                  data={expensesByCategory}
                  category="amount"
                  index="category"
                  valueFormatter={formatCurrency}
                  colors={expensesByCategory.map(c => getCategoryColor(c.category))}
                />
                
                <div className="mt-6">
                  {expensesByCategory.map((category) => (
                    <div key={category.category} className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Badge color={getCategoryColor(category.category)} size="xs" className="mr-2">
                          {category.percentage}%
                        </Badge>
                        <Text>{category.category}</Text>
                      </div>
                      <Bold>{formatCurrency(category.amount)}</Bold>
                    </div>
                  ))}
                </div>
              </Card>
              
              <Card>
                <Title>Gastos por Mes</Title>
                <Text>Tendencia de gastos de los últimos 6 meses</Text>
                
                <BarChart
                  className="mt-6 h-80"
                  data={expensesByMonth}
                  index="month"
                  categories={["Gastos"]}
                  colors={["red"]}
                  valueFormatter={formatCurrency}
                  yAxisWidth={80}
                />
              </Card>
            </Grid>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </>
  );
}
