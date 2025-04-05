'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@bill/_store/useAuthStore';
import { Card, Title, Text, Button } from '@tremor/react';
import { sendVerificationEmail } from '@bill/_firebase/authService';
import { useAuth } from '@bill/_hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  requireVerified?: boolean;
}

export default function AuthGuard({ children, requireVerified = false }: AuthGuardProps) {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Get the logout function from useAuth
  const { logout } = useAuth();

  // Handle email verification checks
  const handleSendVerificationEmail = async () => {
    if (!user) return;
    
    setSendingVerification(true);
    try {
      const result = await sendVerificationEmail(user);
      if (result.success) {
        setVerificationSent(true);
      } else {
        console.error('Error sending verification email:', result.error);
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
    } finally {
      setSendingVerification(false);
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  // Email verification check (only if required)
  if (requireVerified && user && !user.emailVerified) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="max-w-md mx-auto p-6">
          <Title className="text-center mb-2">Verificación de Correo Requerida</Title>
          <Text className="text-center mb-6">
            Por favor verifica tu correo electrónico para continuar.
          </Text>
          
          {verificationSent ? (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md mb-4">
              <p>Email de verificación enviado. Revisa tu bandeja de entrada.</p>
              <p className="mt-2 text-sm">Si no lo encuentras, revisa tu carpeta de spam.</p>
            </div>
          ) : null}
          
          <div className="space-y-4">
            <Button 
              onClick={handleSendVerificationEmail}
              loading={sendingVerification}
              disabled={sendingVerification || verificationSent}
              className="w-full"
            >
              {verificationSent ? 'Email Enviado' : 'Enviar Email de Verificación'}
            </Button>
            
            <Button
              onClick={() => window.location.reload()}
              variant="secondary"
              className="w-full"
            >
              Ya verifiqué mi correo
            </Button>
            
            <Button
              onClick={handleLogout}
              variant="light"
              color="red"
              className="w-full"
            >
              Cerrar Sesión
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // All checks passed, render the protected content
  return <>{children}</>;
}