'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@bill/_store/useAuthStore';

interface AuthGuardProps {
  children: React.ReactNode;
  requireVerified?: boolean;
}

// Loading component for Suspense fallback
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}

function AuthGuardContent({ children, requireVerified = false }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading, initialized } = useAuthStore();
  const isNewRegistration = searchParams.get("new") === "true";

  useEffect(() => {
    // Esperar a que se inicialice el estado de autenticación
    if (!initialized || loading) return;

    // Si el usuario no está autenticado y no es un nuevo registro,
    // redirigir a la página de inicio de sesión
    if (!user && pathname !== '/auth/verify') {
      router.push('/auth/login');
      return;
    }

    // No aplicar redirección en la página de verificación de email
    // si es un nuevo registro o si tiene el parámetro new=true
    if (pathname === '/auth/verify' && isNewRegistration) {
      return;
    }

    // Si el usuario está autenticado pero su email no está verificado
    // y la ruta requiere verificación, redirigir a la página de verificación
    if (user && requireVerified && !user.emailVerified) {
      if (pathname !== '/auth/verify') {
        router.push('/auth/verify');
        return;
      }
    }

    // Si el usuario está autenticado y su email está verificado,
    // pero está en la página de verificación, redirigir al dashboard
    if (user && user.emailVerified && pathname === '/auth/verify' && !isNewRegistration) {
      router.push('/dashboard');
      return;
    }
  }, [user, loading, initialized, requireVerified, router, pathname, isNewRegistration]);

  // Mostrar un indicador de carga mientras se inicializa
  if (loading || (!user && !isNewRegistration)) {
    return <LoadingSpinner />;
  }

  // No renderizar nada si el usuario no está autenticado o si el email no está verificado
  // y la ruta requiere verificación (excepto en la página de verificación)
  if (requireVerified && user && !user.emailVerified && pathname !== '/auth/verify') {
    return null;
  }

  return <>{children}</>;
}

export default function AuthGuard(props: AuthGuardProps) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AuthGuardContent {...props} />
    </Suspense>
  );
}