'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@bill/_store/useAuthStore';

interface AuthGuardProps {
  children: React.ReactNode;
  requireVerified?: boolean;
}

export default function AuthGuard({ children, requireVerified = false }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (requireVerified && !user.emailVerified) {
      if (pathname !== '/auth/verify') {
        router.push('/auth/verify');
      }
    }
  }, [user, loading, requireVerified, router, pathname]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (requireVerified && !user.emailVerified && pathname !== '/auth/verify') {
    return null;
  }

  return <>{children}</>;
}