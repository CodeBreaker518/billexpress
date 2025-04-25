import { Skeleton } from "@bill/_components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@bill/_components/ui/card";
import { cn } from "@bill/_lib/utils";

// Esqueleto para tarjetas de estadísticas
export function StatsCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-2">
          <Skeleton className="h-5 w-[100px]" />
          <Skeleton className="h-8 w-[130px]" />
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/20">
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
      </div>
      <div className="p-6 pt-0">
        <div className="flex items-center space-x-1">
          <Skeleton className="h-4 w-[60px]" />
          <Skeleton className="h-4 w-[80px]" />
        </div>
      </div>
    </div>
  );
}

// Esqueleto para la lista de transacciones recientes
export function TransactionListSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-4 sm:px-6">
        <CardTitle className="text-base sm:text-lg">Transacciones Recientes</CardTitle>
        <Skeleton className="h-8 w-[80px]" />
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="space-y-4">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-3 w-[80px]" />
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <Skeleton className="h-4 w-[70px]" />
                  <Skeleton className="h-5 w-[60px] mt-1" />
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Esqueleto para la distribución por categoría (gráfico de donut)
export function CategoryChartSkeleton() {
  return (
    <Card>
      <CardHeader className="px-4 sm:px-6">
        <div className="flex flex-col space-y-2">
          <CardTitle className="text-base sm:text-lg">Distribución por Categoría</CardTitle>
          <div className="flex border-b">
            <div className="px-4 py-2">
              <Skeleton className="h-5 w-[60px]" />
            </div>
            <div className="px-4 py-2">
              <Skeleton className="h-5 w-[60px]" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="h-44 sm:h-60 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            <Skeleton className="h-36 w-36 rounded-full" />
            <Skeleton className="absolute h-20 w-20 rounded-full bg-background" style={{ top: "calc(50% - 40px)", left: "calc(50% - 40px)" }} />
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-sm" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
                <div className="flex flex-col items-end">
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-3 w-[40px] mt-1" />
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Esqueleto para el gráfico de barras (evolución financiera)
export function BarChartSkeleton() {
  return (
    <Card>
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-base sm:text-lg">Evolución Financiera</CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="h-56 sm:h-72 space-y-2">
          <div className="w-full flex items-end justify-between pt-10 relative">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2 w-1/6">
                  <div className="flex flex-col gap-1">
                    <Skeleton className={cn("w-6", `h-${20 + Math.floor(Math.random() * 36)}`)} />
                    <Skeleton className={cn("w-6", `h-${15 + Math.floor(Math.random() * 25)}`)} />
                    <Skeleton className={cn("w-6", `h-${5 + Math.floor(Math.random() * 15)}`)} />
                  </div>
                  <Skeleton className="h-4 w-14 mt-2" />
                </div>
              ))}
            <div className="absolute top-0 right-0 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Skeleton className="h-3 w-3" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex items-center gap-1">
                <Skeleton className="h-3 w-3" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex items-center gap-1">
                <Skeleton className="h-3 w-3" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Esqueleto completo del dashboard
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Cabecera de la página */}
      <div className="mb-6">
        <Skeleton className="h-8 w-[180px] mb-2" />
        <Skeleton className="h-4 w-[280px]" />
      </div>

      {/* Botones de acciones rápidas */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Skeleton className="h-10 w-[160px]" />
        <Skeleton className="h-10 w-[160px]" />
      </div>

      {/* Resumen financiero */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>

      {/* Gráficos y estadísticas */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <TransactionListSkeleton />
        <CategoryChartSkeleton />
      </div>

      {/* Gráfico temporal */}
      <BarChartSkeleton />
    </div>
  );
}

// Esqueleto para la página de finanzas
export function FinancesPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Cabecera de la página */}
      <div className="mb-6">
        <Skeleton className="h-8 w-[180px] mb-2" />
        <Skeleton className="h-4 w-[280px]" />
      </div>

      {/* Botones de acciones rápidas */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Skeleton className="h-10 w-[160px]" />
        <Skeleton className="h-10 w-[160px]" />
      </div>
    </div>
  );
}

// Esqueleto para el perfil de usuario
export function ProfileCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-36" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-60" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-48" />
            </div>
          </div>
        </div>
        <div className="pt-4 space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

// Esqueleto para la sección de cuentas
export function AccountsSectionSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          <Skeleton className="h-6 w-32" />
        </CardTitle>
        <Skeleton className="h-9 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="border rounded-md p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div>
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24 mt-1" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <Skeleton className="h-5 w-28" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Esqueleto para la página de perfil
export function ProfilePageSkeleton() {
  return (
    <div className="space-y-6 pb-28 sm:pb-0">
      {/* Header de usuario */}
      <div className="flex flex-col md:flex-row gap-4 items-center p-4 bg-card border rounded-lg mb-6">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-1 text-center md:text-left">
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      {/* Tabs skeleton */}
      <div className="hidden sm:flex overflow-x-auto border-b border-muted mb-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 mx-2 rounded" />
        ))}
      </div>
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-background border-t border-muted flex justify-around shadow-lg">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-20 my-2 rounded" />
        ))}
      </div>
      {/* Cards de secciones */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="shadow-soft">
            <CardHeader>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// SKELETON PARA FINANZAS
export function FinanceSkeletonLoader() {
  return (
    <div className="space-y-6">
      {/* Header con título, subtítulo y acciones rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 w-full">
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left w-full max-w-2xl mx-auto">
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center sm:items-end justify-center sm:justify-end">
          <Skeleton className="h-10 w-full sm:w-40" />
          <Skeleton className="h-10 w-full sm:w-40" />
        </div>
      </div>
      {/* Grid de cuentas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="shadow-soft">
            <CardHeader className="px-4 sm:px-6">
              <Skeleton className="h-5 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Tabla de transacciones */}
      <Card className="shadow-soft">
        <CardHeader className="px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <Skeleton className="h-6 w-48" />
          <div className="flex gap-2 w-full sm:w-auto">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center justify-between border-b pb-2">
                <div className="flex flex-col gap-2 w-1/2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* Tabla de transferencias */}
      <Card className="shadow-soft">
        <CardHeader className="px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <Skeleton className="h-6 w-48" />
          <div className="flex gap-2 w-full sm:w-auto">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between border-b pb-2">
                <div className="flex flex-col gap-2 w-1/2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// SKELETON PARA CALENDARIO
export function CalendarSkeleton() {
  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-64 mb-4" />
      {/* Controles de calendario */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4 mb-4 flex flex-col sm:flex-row gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      {/* Grid de calendario */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden p-4">
        <div className="grid grid-cols-7 gap-2">
          {[...Array(35)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded" />
          ))}
        </div>
      </div>
      {/* Card de detalle (opcional) */}
      <div className="max-w-md mx-auto">
        <Card className="shadow-soft">
          <CardHeader>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// SKELETON PARA ANALÍTICAS
export function AnaliticasSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      {/* Gráfico principal */}
      <div className="bg-card p-4 rounded-lg shadow-sm border space-y-4">
        <Skeleton className="h-6 w-1/2 mb-4" />
        <Skeleton className="h-72 w-full" />
      </div>
      {/* Gráficos secundarios */}
      <div className="bg-card p-4 rounded-lg shadow-sm border space-y-4">
        <Skeleton className="h-6 w-40 mb-3" />
        <Skeleton className="h-9 w-full sm:w-[300px]" />
        <Skeleton className="h-4 w-full mt-2" />
        <Skeleton className="h-10 w-52 mt-4" />
      </div>
    </div>
  );
}
