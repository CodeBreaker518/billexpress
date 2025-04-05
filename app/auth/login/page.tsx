'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@bill/_hooks/useAuth';
import { Card, Text, Button, TextInput, Divider } from '@tremor/react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import AuthRedirect from '@bill/_components/AuthRedirect';
import GoogleAuthButton from '@bill/_components/GoogleAuthButton';

// This is the actual login form component
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn(email, password);
      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const result = await signInWithGoogle();
      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error || 'Error al iniciar sesión con Google');
      }
    } catch (err) {
      setError('Ocurrió un error inesperado');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2 text-center">BillExpress</h1>
      <h2 className="text-lg font-semibold mb-2 text-center">Control de Gastos</h2>
      <Text className="mb-6 text-center">Inicia sesión para continuar</Text>

      {error && (
        <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}

      {/* Botón de Google */}
      <GoogleAuthButton 
        onClick={handleGoogleSignIn} 
        loading={googleLoading} 
        label="Iniciar sesión con Google" 
      />

      <Divider>O</Divider>

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div>
          <TextInput
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="relative">
          <TextInput
            placeholder="Contraseña"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5 text-gray-500" />
            ) : (
              <Eye className="w-5 h-5 text-gray-500" />
            )}
          </button>
        </div>
        <Button
          type="submit"
          className="w-full"
          loading={loading}
          disabled={loading}
          icon={LogIn}
        >
          Iniciar Sesión
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Text>
          ¿No tienes una cuenta?{' '}
          <Link href="/auth/register" className="text-blue-600 hover:underline">
            Regístrate
          </Link>
        </Text>
      </div>
    </Card>
  );
}

// Wrap the login form with the AuthRedirect to prevent authenticated users from accessing it
export default function LoginPage() {
  return (
    <AuthRedirect>
      <LoginForm />
    </AuthRedirect>
  );
}