"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, BarChart2, LogOut, Menu, DollarSign, User } from "lucide-react";
import { useAuth } from "@bill/_hooks/useAuth";
import { useAuthStore } from "@bill/_store/useAuthStore";
import AuthGuard from "@bill/_components/AuthGuard";
import ThemeToggle from "@bill/_components/ThemeToggle";
import BillExpressLogo from "@bill/_components/BillExpressLogo";

// Importación de componentes de shadcn-ui
import { Button } from "@bill/_components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@bill/_components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@bill/_components/ui/dropdown-menu";
import { Separator } from "@bill/_components/ui/separator";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@bill/_components/ui/sheet";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { user } = useAuthStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [cleanedUpAccounts, setCleanedUpAccounts] = useState(false);
  const [defaultAccountChecked, setDefaultAccountChecked] = useState(false);

  // Efecto para limpiar cuentas duplicadas al iniciar sesión (de forma silenciosa)
  useEffect(() => {
    const cleanupAccounts = async () => {
      if (user && !cleanedUpAccounts) {
        try {
          // Ya no es necesario limpiar cuentas duplicadas con el nuevo sistema

          // Marcar como limpiado para no volver a ejecutar
          setCleanedUpAccounts(true);
        } catch (error) {
          // Solo log para desarrollo, el usuario no necesita ver este error
          console.error("Error en verificación automática de cuentas:", error);
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
          const { getUserAccounts, addAccount } = await import("@bill/_firebase/accountService");

          // Obtener cuentas del usuario
          const accounts = await getUserAccounts(user.uid);

          // Verificar si existe una cuenta Efectivo
          const hasDefaultAccount = accounts.some((acc) => acc.name === "Efectivo" && acc.isDefault);

          // Si no existe, crear la cuenta Efectivo por defecto
          if (!hasDefaultAccount) {
            await addAccount({
              name: "Efectivo",
              color: "#22c55e", // Verde
              balance: 0,
              userId: user.uid,
              isDefault: true,
            });
          }
        } catch (error) {
          console.error("Error al verificar cuenta Efectivo por defecto:", error);
        } finally {
          setDefaultAccountChecked(true);
        }
      }
    };

    ensureDefaultAccount();
  }, [user, defaultAccountChecked]);

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      router.push("/auth/login");
    }
  };

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Finanzas",
      href: "/dashboard/finanzas",
      icon: DollarSign,
    },
    {
      name: "Reportes",
      href: "/dashboard/reportes",
      icon: BarChart2,
    },
    {
      name: "Mi Perfil",
      href: "/dashboard/perfil",
      icon: User,
    },
  ];

  return (
    <AuthGuard requireVerified={true}>
      <div className="flex h-screen bg-background">
        {/* Sidebar para escritorio */}
        <aside className="hidden lg:flex lg:w-64 flex-col border-r bg-card">
          <div className="flex h-16 items-center border-b px-4">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <BillExpressLogo width={160} height={45} usePrimaryColor={true} />
            </Link>
          </div>
          <nav className="flex-1 overflow-auto py-4">
            <div className="px-3 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== "/dashboard");

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                      isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-primary/5 hover:text-primary"
                    }`}>
                    <span className="flex items-center justify-center w-5 h-5">
                      <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                    </span>
                    {item.name}
                  </Link>
                );
              })}
            </div>
            <Separator className="my-4" />
            <div className="px-3">
              <Button variant="ghost" className="w-full justify-start text-sm font-normal" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </Button>
            </div>
          </nav>
        </aside>

        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
            {/* Menú hamburguesa para móvil en el header */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex h-16 items-center border-b px-4">
                  <Link href="/dashboard" className="flex items-center gap-2 font-semibold" onClick={() => setSheetOpen(false)}>
                    <BillExpressLogo width={160} height={45} usePrimaryColor={true} />
                  </Link>
                </div>
                <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
                <nav className="flex-1 overflow-auto py-4">
                  <div className="px-3 space-y-1">
                    {navItems.map((item) => {
                      const isActive = pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== "/dashboard");

                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setSheetOpen(false)}
                          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                            isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-primary/5 hover:text-primary"
                          }`}>
                          <span className="flex items-center justify-center w-5 h-5">
                            <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                          </span>
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                  <Separator className="my-4" />
                  <div className="px-3">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm font-normal"
                      onClick={() => {
                        setSheetOpen(false);
                        handleLogout();
                      }}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar sesión
                    </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>

            <div className="ml-auto flex items-center gap-2">
              {/* Theme toggle */}
              <ThemeToggle />

              {/* Dropdown de perfil de usuario */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <Avatar className="h-10 w-10">
                      {user?.photoURL ? (
                        <AvatarImage src={user.photoURL} alt={user.displayName || "Avatar"} />
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-primary text-base">
                          {user?.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="h-6 w-6" />}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.displayName || "Usuario"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/dashboard/configuracion" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Mi Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="container p-4 py-6">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
