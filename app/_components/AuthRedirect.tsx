'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@bill/_store/useAuthStore';

// This component is used on auth pages (login/register) to redirect
// authenticated users to the dashboard
export default function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // If user is authenticated, redirect to dashboard
    // This effect runs after render, so the login page will
    // be briefly visible before redirect happens
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Always render the children (login/register form) immediately
  // If user is authenticated, the useEffect above will handle redirection after mount
  return <>{children}</>;
}
