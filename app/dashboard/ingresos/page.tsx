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
  TrendingUp, 
  Calendar, 
  Clock, 
  ChevronDown, 
  ChevronUp
} from 'lucide-react';
import { useAuthStore } from '@bill/_store/useAuthStore';
import { useIncomeStore } from '@bill/_store/useIncomeStore';
import { getUserIncomes, addIncome, updateIncome, deleteIncome } from '@bill/_firebase/incomeService';
import { isValid, format, subMonths, differenceInDays, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import SearchBar from '@bill/_components/SearchBar';
import FinanceForm from '@bill/_components/FinanceForm';
import FinanceTable from '@bill/_components/FinanceTable';

// Lista de categorías de ingresos
const categories = [
  'Salario',
  'Freelance',
  'Inversiones',
  'Ventas',
  'Regalos',
  'Reembolsos',
  'Otros'
];

// Función para obtener el color asociado a la categoría
const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Salario': return 'green';
    case 'Freelance': return 'blue';
    case 'Inversiones': return 'violet';
    case 'Ventas': return 'orange';
    case 'Regalos': return 'pink';
    case 'Reembolsos': return 'cyan';
    default: return 'gray';
  }
};

// Componente para la página de gestión de ingresos
export default function IncomesPage() {
  const { user } = useAuthStore();
  const { incomes, setIncomes, loading, setLoading } = useIncomeStore();
  
  // Estado para búsqueda y filtrado
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredIncomes, setFilteredIncomes] = useState<any[]>([]);
  
  // Estado para formulario
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentIncome, setCurrentIncome] = useState({
    id: '',
    description: '',
    amount: 0,
    category: 'Salario',
    date: new Date(),
    time: format(new Date(), 'HH:mm')
  });

  // Estado para métricas
  const [totalIncomes, setTotalIncomes] = useState(0);
  const [monthlyIncomes, setMonthlyIncomes] = useState(0);
  const [incomesByCategory, setIncomesByCategory] = useState<any[]>([]);
  const [incomesByMonth, setIncomesByMonth] = useState<any[]>([]);
  const [recentTrend, setRecentTrend] = useState(0);
  const [mostRecentIncome, setMostRecentIncome] = useState<any>(null);
  
  // Estado para vista de tabla
  const [showTable, setShowTable] = useState(true);
  
  // Cargar ingresos
  useEffect(() => {
    const loadIncomes = async () => {
      if (user) {
        setLoading(true);
        try {
          const userIncomes = await getUserIncomes(user.uid);
          setIncomes(userIncomes);
        } catch (error) {
          console.error('Error loading incomes:', error);
          setIncomes([]);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadIncomes();
  }, [user, setIncomes, setLoading]);
  
  // Calcular métricas cuando cambian los ingresos
  useEffect(() => {
    if (incomes.length > 0) {
      // Total general
      const total = incomes.reduce((sum, income) => sum + income.amount, 0);
      setTotalIncomes(total);
      
      // Obtener el mes actual
      const currentDate = new Date();
      const firstDayOfMonth = startOfMonth(currentDate);
      const lastDayOfMonth = endOfMonth(currentDate);
      
      // Calcular ingresos del mes actual
      const thisMonthIncomes = incomes.filter(income => {
        const incomeDate = new Date(income.date);
        return incomeDate >= firstDayOfMonth && incomeDate <= lastDayOfMonth;
      });
      
      const thisMonthTotal = thisMonthIncomes.reduce((sum, income) => sum + income.amount, 0);
      setMonthlyIncomes(thisMonthTotal);
      
      // Encontrar el ingreso con la fecha más reciente (por fecha de transacción, no de edición)
      const sortedByTransactionDate = [...incomes].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      if (sortedByTransactionDate.length > 0) {
        setMostRecentIncome(sortedByTransactionDate[0]);
      }
      
      // Calcular tendencia
      const prevMonthStart = startOfMonth(subMonths(currentDate, 1));
      const prevMonthEnd = endOfMonth(subMonths(currentDate, 1));
      
      const prevMonthIncomes = incomes.filter(income => {
        const incomeDate = new Date(income.date);
        return incomeDate >= prevMonthStart && incomeDate <= prevMonthEnd;
      });
      
      const prevMonthTotal = prevMonthIncomes.reduce((sum, income) => sum + income.amount, 0);
      
      if (prevMonthTotal > 0) {
        const trendPercentage = ((thisMonthTotal - prevMonthTotal) / prevMonthTotal) * 100;
        setRecentTrend(parseFloat(trendPercentage.toFixed(1)));
      }
      
      // Ingresos por categoría
      const byCategory = categories.map(category => {
        const categoryIncomes = incomes.filter(i => i.category === category);
        const categoryTotal = categoryIncomes.reduce((sum, i) => sum + i.amount, 0);
        const percentage = total > 0 ? (categoryTotal / total) * 100 : 0;
        
        return {
          category,
          amount: categoryTotal,
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
      
      const monthlyData = Object.entries(last6Months).map(([month, amount]) => ({
        month,
        "Ingresos": amount
      }));
      
      setIncomesByMonth(monthlyData);
    }
  }, [incomes]);
  
  // Filtrar ingresos cuando cambia el término de búsqueda o los ingresos
  useEffect(() => {
    if (incomes.length > 0) {
      const filtered = incomes.filter(income => 
        income.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        income.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // Ordenar por fecha (más reciente primero)
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setFilteredIncomes(filtered);
    } else {
      setFilteredIncomes([]);
    }
  }, [incomes, searchTerm]);
  
  // Manejar cambios en el formulario
  const handleFormChange = (field: string, value: any) => {
    setCurrentIncome({ ...currentIncome, [field]: value });
  };
  
  // Abrir formulario para edición
  const handleEdit = (income: any) => {
    const incomeDate = new Date(income.date);
    
    setCurrentIncome({
      id: income.id,
      description: income.description,
      amount: income.amount,
      category: income.category,
      date: incomeDate,
      time: format(incomeDate, 'HH:mm')
    });
    setIsEditing(true);
    setIsFormOpen(true);
  };
  
  // Abrir formulario para nuevo ingreso
  const handleNew = () => {
    const now = new Date();
    
    setCurrentIncome({
      id: '',
      description: '',
      amount: 0,
      category: 'Salario',
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
  
  // Guardar ingreso (nuevo o editado)
  const handleSave = async () => {
    if (!user) return;
    if (!currentIncome.description || currentIncome.amount <= 0 || !isValid(currentIncome.date)) {
      alert('Por favor completa todos los campos correctamente');
      return;
    }
    
    setLoading(true);
    
    try {
      // Verificar si hay conexión a internet
      const isOnline = navigator.onLine;
      
      if (isEditing) {
        // Actualizar ingreso existente
        const updatedIncome = {
          ...currentIncome,
          userId: user.uid
        };
        
        await updateIncome(updatedIncome);
        
        // Actualizar estado local
        setIncomes(incomes.map(income => 
          income.id === currentIncome.id ? updatedIncome : income
        ));
        
        // Mostrar feedback según el estado de conexión
        if (!isOnline) {
          alert('Ingreso actualizado en modo offline. Se sincronizará cuando recuperes conexión a internet.');
        }
      } else {
        // Añadir nuevo ingreso
        const newIncome = await addIncome({
          description: currentIncome.description,
          amount: currentIncome.amount,
          category: currentIncome.category,
          date: currentIncome.date,
          userId: user.uid
        });
        
        // Actualizar estado local
        setIncomes([...incomes, newIncome]);
        
        // Mostrar feedback según el estado de conexión
        if (!isOnline) {
          alert('Ingreso guardado en modo offline. Se sincronizará cuando recuperes conexión a internet.');
        }
      }
      
      // Cerrar formulario después de guardar
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error saving income:', error);
      alert('Ocurrió un error al guardar el ingreso. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };
  
  // Eliminar ingreso
  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este ingreso?')) return;
    
    setLoading(true);
    
    try {
      // Verificar si hay conexión a internet
      const isOnline = navigator.onLine;
      
      await deleteIncome(id);
      
      // Actualizar estado local
      setIncomes(incomes.filter(income => income.id !== id));
      
      // Mostrar feedback según el estado de conexión
      if (!isOnline) {
        alert('Ingreso eliminado en modo offline. Se sincronizará cuando recuperes conexión a internet.');
      }
    } catch (error) {
      console.error('Error deleting income:', error);
      alert('Ocurrió un error al eliminar el ingreso. Por favor, intenta de nuevo.');
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
          <DollarSign className="text-green-500 dark:text-green-400" />
          <Title>Gestión de Ingresos</Title>
        </div>
        <Text className="text-gray-600 dark:text-gray-400">
          Gestiona tus ingresos, añade nuevos, edita o elimina los existentes.
        </Text>
      </div>
      
      {/* Métricas de Ingresos */}
      <Grid numItemsMd={2} numItemsLg={4} className="gap-6 mb-6">
        <Card decoration="top" decorationColor="green">
          <Flex justifyContent="start" alignItems="center" className="space-x-4">
            <div className="rounded-full bg-green-100 dark:bg-green-800 p-2">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <Text>Total Ingresos</Text>
              <Metric>{formatCurrency(totalIncomes)}</Metric>
            </div>
          </Flex>
        </Card>
        
        <Card decoration="top" decorationColor="emerald">
          <Flex justifyContent="start" alignItems="center" className="space-x-4">
            <div className="rounded-full bg-emerald-100 dark:bg-emerald-800 p-2">
              <Calendar className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
            </div>
            <div>
              <Text>Ingresos del Mes</Text>
              <Metric>{formatCurrency(monthlyIncomes)}</Metric>
            </div>
          </Flex>
        </Card>
        
        <Card decoration="top" decorationColor="blue">
          <Flex justifyContent="start" alignItems="center" className="space-x-4">
            <div className="rounded-full bg-blue-100 dark:bg-blue-800 p-2">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <Text>Tendencia</Text>
              <Metric className={recentTrend >= 0 ? 'text-green-600' : 'text-red-600'}>
                {recentTrend >= 0 ? '+' : ''}{recentTrend}%
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
              <Text>Ingresos Recientes</Text>
              <Metric>{mostRecentIncome ? formatCurrency(mostRecentIncome.amount) : '$0'}</Metric>
              <Text className="text-xs">
                {mostRecentIncome 
                  ? `${formatDateTime(new Date(mostRecentIncome.date))} (hace ${differenceInDays(new Date(), new Date(mostRecentIncome.date))} días)` 
                  : 'No hay ingresos recientes'}
              </Text>
            </div>
          </Flex>
        </Card>
      </Grid>
      
      {/* Formulario para añadir/editar ingresos */}
      {isFormOpen && (
        <FinanceForm
          isOpen={isFormOpen}
          isEditing={isEditing}
          currentItem={currentIncome}
          categories={categories}
          title="Ingreso"
          onCancel={handleCancel}
          onSave={handleSave}
          onChange={handleFormChange}
        />
      )}
      
      {/* Visualizaciones y Tabla */}
      <TabGroup>
        <TabList className="mb-6">
          <Tab>Tabla de Ingresos</Tab>
          <Tab>Análisis</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            {/* Barra de búsqueda y botón para añadir */}
            <SearchBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onAddNew={handleNew}
              placeholder="Buscar ingresos..."
              addButtonLabel="Nuevo Ingreso"
            />
            
            {/* Tabla de ingresos */}
            <Card>
              <FinanceTable
                items={filteredIncomes}
                loading={loading}
                type="income"
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </Card>
          </TabPanel>
          
          <TabPanel>
            {/* Gráficos de Análisis */}
            <Grid numItemsMd={1} numItemsLg={2} className="gap-6 mb-6">
              <Card>
                <Title>Ingresos por Categoría</Title>
                <Text>Distribución de ingresos por categoría</Text>
                
                <DonutChart
                  className="mt-6 h-80"
                  data={incomesByCategory}
                  category="amount"
                  index="category"
                  valueFormatter={formatCurrency}
                  colors={incomesByCategory.map(c => getCategoryColor(c.category))}
                />
                
                <div className="mt-6">
                  {incomesByCategory.map((category) => (
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
                <Title>Ingresos por Mes</Title>
                <Text>Tendencia de ingresos de los últimos 6 meses</Text>
                
                <BarChart
                  className="mt-6 h-80"
                  data={incomesByMonth}
                  index="month"
                  categories={["Ingresos"]}
                  colors={["green"]}
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
