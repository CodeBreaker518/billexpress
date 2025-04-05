'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  BarChart2, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  DollarSign,
  User,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@bill/_hooks/useAuth';
import { useAuthStore } from '@bill/_store/useAuthStore';
import { useThemeStore } from '@bill/_store/useThemeStore';
import AuthGuard from '@bill/_components/AuthGuard';
import ThemeToggle from '@bill/_components/ThemeToggle';
import ConnectivityStatus from '@bill/_components/ConnectivityStatus';
import SyncManager from '@bill/_components/SyncManager';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { user } = useAuthStore();

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      router.push('/auth/login');
    }
  };

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Ingresos',
      href: '/dashboard/ingresos',
      icon: DollarSign,
      color: 'text-green-500 dark:text-green-400',
    },
    {
      name: 'Gastos',
      href: '/dashboard/gastos',
      icon: DollarSign,
      color: 'text-red-500 dark:text-red-400',
    },
    {
      name: 'Reportes',
      href: '/dashboard/reportes',
      icon: BarChart2,
    },
    {
      name: 'Mi Perfil',
      href: '/dashboard/configuracion',
      icon: User,
    },
  ];

  return (
    <AuthGuard requireVerified={true}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar para móvil */}
        <div
          className={`fixed inset-0 z-40 lg:hidden ${
            sidebarOpen ? 'block' : 'hidden'
          }`}
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75"></div>
        </div>

        <div
          className={`fixed z-40 inset-y-0 left-0 w-64 transition-transform duration-300 transform bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 lg:translate-x-0 lg:static lg:inset-0 ${
            sidebarOpen ? 'translate-x-0 ease-out' : '-translate-x-full ease-in'
          }`}
        >
          <div className="flex items-center justify-between flex-shrink-0 px-6 py-4">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span className="text-xl font-semibold text-gray-900 dark:text-white">BillExpress</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 -mr-1 rounded-md lg:hidden focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <X className="w-6 h-6 dark:text-gray-300" />
            </button>
          </div>

          <nav className="flex-1 px-3 mt-5 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-2 rounded-md ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/40'
                  }`}
                >
                  <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-700 dark:text-blue-300' : item.color || 'text-gray-500 dark:text-gray-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 mt-4 text-left text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/40"
            >
              <LogOut className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
              <span>Cerrar sesión</span>
            </button>
          </nav>
        </div>

        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1 -ml-1 rounded-md lg:hidden focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <Menu className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </button>
            
            {/* Status de conectividad */}
            <div className="hidden md:block">
              <ConnectivityStatus />
            </div>
            
            {/* Theme toggle button */}
            <div className="mr-4">
              <ThemeToggle />
            </div>

            {/* User profile section */}
            <div className="relative ml-auto">
              <div 
                className="flex items-center space-x-3 cursor-pointer rounded-full p-1 hover:bg-gray-100"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                {user?.photoURL ? (
                  <Image 
                    src={user.photoURL} 
                    alt="Foto de perfil"
                    width={36} 
                    height={36} 
                    className="rounded-full border border-gray-200" 
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                    <User size={18} />
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium dark:text-white">{user?.displayName || user?.email || 'Usuario'}</p>
                  {user?.displayName && <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>

              {/* Dropdown menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
                  <Link 
                    href="/dashboard/configuracion" 
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Mi Perfil
                  </Link>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </header>

          <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
            <div className="container p-6 mx-auto">
              {/* Mobile connectivity status */}
              <div className="md:hidden mb-4">
                <ConnectivityStatus />
              </div>
              
              {children}
            </div>
          </main>
        </div>
      </div>
      
      {/* Componente invisible que gestiona la sincronización */}
      <SyncManager />
    </AuthGuard>
  );
}