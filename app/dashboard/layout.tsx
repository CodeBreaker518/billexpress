'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, BarChart2, LogOut, Menu, User, DollarSign, Calendar, Settings } from 'lucide-react';
import { useAuth } from '@bill/_hooks/useAuth';
import { useAuthStore } from '@bill/_store/useAuthStore';
import { useReminderStore } from '@bill/_store/useReminderStore';
import { checkDueReminders, checkUpcomingReminders } from '@bill/_services/reminderNotificationService';
import AuthGuard from '@bill/_components/AuthGuard';
import ThemeToggle from '@bill/_components/ThemeToggle';
import BillExpressLogo from '@bill/_components/BillExpressLogo';
import { useTheme } from 'next-themes';
import { useToast } from '@bill/_components/ui/use-toast';

// Importación de componentes de shadcn-ui
import { Button } from '@bill/_components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@bill/_components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@bill/_components/ui/dropdown-menu';
import { Separator } from '@bill/_components/ui/separator';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@bill/_components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@bill/_components/ui/tooltip";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { user } = useAuthStore();
  const { reminders, loadReminders } = useReminderStore();
  const { toast } = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [cleanedUpAccounts, setCleanedUpAccounts] = useState(false);
  const [defaultAccountChecked, setDefaultAccountChecked] = useState(false);
  const [remindersChecked, setRemindersChecked] = useState(false);

  // Efecto para limpiar cuentas duplicadas al iniciar sesión (de forma silenciosa)
  useEffect(() => {
    const cleanupAccounts = async () => {
      if (user && !cleanedUpAccounts) {
        try {
          // Importar las funciones necesarias
          const { getUserAccounts } = await import('@bill/_firebase/accountService');
          const { db } = await import('@bill/_firebase/config');
          const { doc, updateDoc } = await import('firebase/firestore');

          // Obtener cuentas del usuario
          const accounts = await getUserAccounts(user.uid);

          // Verificar si hay múltiples cuentas predeterminadas
          const defaultAccounts = accounts.filter((acc) => acc.isDefault);

          if (defaultAccounts.length > 1) {
            console.log('Se encontraron cuentas predeterminadas duplicadas. Corrigiendo automáticamente...');

            // Mantener la primera cuenta predeterminada y quitar la marca de las demás
            for (let i = 1; i < defaultAccounts.length; i++) {
              const accountRef = doc(db, 'accounts', defaultAccounts[i].id);
              await updateDoc(accountRef, {
                isDefault: false,
              });
            }
          }

          // Marcar como limpiado para no volver a ejecutar
          setCleanedUpAccounts(true);
        } catch (error) {
          // Solo log para desarrollo, el usuario no necesita ver este error
          console.error('Error en verificación automática de cuentas:', error);
        }
      }
    };

    // Ejecutar limpieza silenciosa de cuentas
    cleanupAccounts();
  }, [user, cleanedUpAccounts]);

  // Verificar y crear cuenta Efectivo por defecto si no existe
  useEffect(() => {
    const ensureDefaultAccount = async () => {
      if (user && !defaultAccountChecked) {
        try {
          // Importar las funciones necesarias
          const { getUserAccounts, addAccount } = await import('@bill/_firebase/accountService');

          // Obtener cuentas del usuario
          const accounts = await getUserAccounts(user.uid);

          // Verificar si existe una cuenta Efectivo
          const hasDefaultAccount = accounts.some((acc) => acc.name === 'Efectivo' && acc.isDefault);

          // Si no existe, crear la cuenta Efectivo por defecto
          if (!hasDefaultAccount) {
            await addAccount({
              name: 'Efectivo',
              color: '#22c55e', // Verde
              balance: 0,
              userId: user.uid,
              isDefault: true,
            });
          }
        } catch (error) {
          console.error('Error al verificar cuenta Efectivo por defecto:', error);
        } finally {
          setDefaultAccountChecked(true);
        }
      }
    };

    ensureDefaultAccount();
  }, [user, defaultAccountChecked]);

  // Cargar y verificar recordatorios vencidos
  useEffect(() => {
    const checkReminders = async () => {
      if (user && !remindersChecked) {
        try {
          // Cargar recordatorios si no están cargados
          await loadReminders(user.uid);
          
          // Verificar recordatorios vencidos y mostrar notificaciones
          checkDueReminders(reminders);
          
          // Verificar recordatorios próximos
          checkUpcomingReminders(reminders);
          
          // Marcar como verificados para no mostrar notificaciones duplicadas
          setRemindersChecked(true);
        } catch (error) {
          console.error('Error al verificar recordatorios:', error);
        }
      }
    };

    checkReminders();
  }, [user, reminders, loadReminders, remindersChecked]);

  const handleLogout = async () => {
    try {
      const result = await logout();
      if (result.success) {
        router.push("/auth/login");
      } else {
        toast({
          title: "Error al cerrar sesión",
          description: result.error || "Ha ocurrido un error al cerrar sesión. Inténtalo de nuevo.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast({
        title: "Error al cerrar sesión",
        description: "Ha ocurrido un error inesperado. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  };

  const navItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Finanzas',
      icon: DollarSign,
      href: '/dashboard/finanzas',
    },
    {
      title: 'Analíticas',
      icon: BarChart2,
      href: '/dashboard/analiticas',
      disabled: false,
    },
    {
      title: 'Calendario',
      icon: Calendar,
      href: '/dashboard/calendario',
    },
    {
      title: 'Mi Perfil',
      href: '/dashboard/perfil',
      icon: User,
    },
  ];

  return (
    <AuthGuard requireVerified={true}>
      <div className='flex h-screen bg-background'>
        {/* Sidebar para escritorio */}
        <aside className='hidden lg:flex lg:w-64 flex-col border-r bg-card'>
          <div className='flex h-16 justify-center items-center border-b px-4'>
            <Link href='/dashboard' className='flex items-center gap-2 font-semibold'>
              <BillExpressLogo width={160} height={45} usePrimaryColor={true} />
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="ml-2 flex items-center px-2 py-0.5 rounded-full bg-transparent hover:bg-transparent text-green-600 text-xs font-bold shadow border border-green-300 cursor-pointer select-none transition"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      beta
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="center" className="max-w-xs text-xs">
                    Billexpress está en <span className="font-bold">fase beta</span> y puede tener errores.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Link>
          </div>
          <nav className='flex-1 overflow-auto py-4'>
            <div className='px-3 space-y-1'>
              {navItems.map((item) => {
                const isActive = pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== '/dashboard');

                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                      isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-primary/5 hover:text-primary'
                    }`}>
                    <span className='flex items-center justify-center w-5 h-5'>
                      <item.icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    </span>
                    {item.title}
                  </Link>
                );
              })}
            </div>
            <Separator className='my-4' />
            
          </nav>
        </aside>

        <div className='flex flex-col flex-1 overflow-hidden'>
          <header className='sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6 flex-shrink-0'>
            {/* Menú hamburguesa para móvil en el header */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant='ghost' size='icon' className='lg:hidden'>
                  <Menu className='h-5 w-5' />
                  <span className='sr-only'>Abrir menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side='left' className='w-64 p-0'>
                <div className='flex flex-col items-center justify-center h-auto border-b  py-4 px-4'>
                  <Link href='/dashboard' className='flex items-center gap-2 font-semibold' onClick={() => setSheetOpen(false)}>
                    <BillExpressLogo width={160} height={45} usePrimaryColor={true} />
                  </Link>
                  <div
                    className="mt-2 flex items-center px-2 py-0.5 rounded-full bg-transparent text-green-600 text-xs font-bold shadow border border-green-300 select-none"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    beta
                  </div>
                </div>
                <SheetTitle className='sr-only'>Menú de navegación</SheetTitle>
                <nav className='flex-1 overflow-auto py-4'>
                  <div className='px-3 space-y-1'>
                    {navItems.map((item) => {
                      const isActive = pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== '/dashboard');

                      return (
                        <Link
                          key={item.title}
                          href={item.href}
                          onClick={() => setSheetOpen(false)}
                          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                            isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-primary/5 hover:text-primary'
                          }`}>
                          <span className='flex items-center justify-center w-5 h-5'>
                            <item.icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                          </span>
                          {item.title}
                        </Link>
                      );
                    })}
                  </div>
                  <Separator className='my-4' />
                  
                </nav>
              </SheetContent>
            </Sheet>

            <div className='ml-auto flex items-center gap-2'>
              {/* Theme toggle */}
              <ThemeToggle />
              {/* Dropdown de perfil de usuario */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' className='relative h-10 w-10 rounded-full p-0'>
                    <Avatar className='h-10 w-10'>
                      {user?.photoURL ? (
                        <AvatarImage src={user.photoURL} alt={user.displayName || 'Avatar'} />
                      ) : (
                        <AvatarFallback className='bg-primary/10 text-primary text-base'>
                          {user?.displayName ? user.displayName.charAt(0).toUpperCase() : <User className='h-6 w-6' />}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-56'>
                  <DropdownMenuLabel>
                    <div className='flex flex-col space-y-1'>
                      <p className='text-sm font-medium leading-none'>{user?.displayName || 'Usuario'}</p>
                      <p className='text-xs leading-none text-muted-foreground'>{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className='cursor-pointer'>
                    <Link href='/dashboard/perfil' className='flex items-center'>
                      <User className='mr-2 h-4 w-4' />
                      Mi Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className='text-destructive focus:text-destructive cursor-pointer' onClick={handleLogout}>
                    <LogOut className='mr-2 h-4 w-4' />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Área de contenido principal con scroll */}
          <main className='overflow-y-auto p-4 sm:p-6 lg:p-8'>
            {/* El contenido de la página se renderiza aquí */}
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
