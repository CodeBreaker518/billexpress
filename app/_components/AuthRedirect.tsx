'use client';

import { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@bill/_store/useAuthStore';

// This component is used on auth pages (login/register) to redirect
// authenticated users to the dashboard
export default function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isNewRegistration = searchParams.get("new") === "true";

  useEffect(() => {
    // Esperar a que el estado de autenticación esté cargado
    if (loading) return;

    // Comprobar si la ruta actual es de tipo auth o dashboard
    const isAuthRoute = pathname?.startsWith('/auth');
    const isVerifyRoute = pathname === '/auth/verify';
    const isDashboardRoute = pathname?.startsWith('/dashboard');
    const isLandingRoute = pathname === '/';

    if (user) {
      // Usuario autenticado
      if (isAuthRoute && !isVerifyRoute) {
        // Redirigir al dashboard si intenta acceder a rutas de autenticación
        // EXCEPTO a la ruta de verificación
        router.push('/dashboard');
      }
      // Si está en la landing, verify o en dashboard, permitir acceso normalmente
    } else {
      // Usuario NO autenticado
      if (isDashboardRoute) {
        // Redirigir a login si intenta acceder al dashboard
        router.push('/auth/login');
      }
      // Si está en la landing o en auth, permitir acceso normalmente
    }
  }, [user, router, pathname, loading, isNewRegistration]);

  // Renderizar los hijos mientras se procesa la redirección
  return <>{children}</>;
}
