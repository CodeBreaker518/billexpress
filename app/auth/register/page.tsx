'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@bill/_hooks/useAuth';
import { Card, Text, Button, TextInput, Divider } from '@tremor/react';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import AuthRedirect from '@bill/_components/AuthRedirect';
import GoogleAuthButton from '@bill/_components/GoogleAuthButton';

// This is the actual register form component
function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const result = await signUp(email, password);
      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error || 'Error al registrar usuario');
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
      <Text className="mb-6 text-center">Crea una nueva cuenta</Text>

      {error && (
        <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}

      {/* Botón de Google */}
      <GoogleAuthButton 
        onClick={handleGoogleSignIn} 
        loading={googleLoading} 
        label="Registrarse con Google" 
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
        <div>
          <TextInput
            placeholder="Confirmar contraseña"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          loading={loading}
          disabled={loading}
          icon={UserPlus}
        >
          Registrarse
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Text>
          ¿Ya tienes una cuenta?{' '}
          <Link href="/auth/login" className="text-blue-600 hover:underline">
            Iniciar sesión
          </Link>
        </Text>
      </div>
    </Card>
  );
}

// Wrap the register form with the AuthRedirect to prevent authenticated users from accessing it
export default function RegisterPage() {
  return (
    <AuthRedirect>
      <RegisterForm />
    </AuthRedirect>
  );
}