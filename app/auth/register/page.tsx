"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@bill/_hooks/useAuth";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import AuthRedirect from "@bill/_components/AuthRedirect";
import GoogleAuthButton from "@bill/_components/GoogleAuthButton";

// Importaciones de componentes shadcn/ui
import { Card, CardContent, CardHeader, CardTitle } from "@bill/_components/ui/card";
import { Input } from "@bill/_components/ui/input";
import { Button } from "@bill/_components/ui/button";
import { Text } from "@bill/_components/ui/typography";
import { Separator } from "@bill/_components/ui/separator";

export default function RegisterPage() {
  return (
    <div className="container max-w-md mx-auto py-12 flex flex-col items-center justify-center min-h-screen px-4">
      <AuthRedirect>
        <RegisterForm />
      </AuthRedirect>
    </div>
  );
}

// This is the actual register form component
function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validar que las contraseñas coincidan
      if (password !== confirmPassword) {
        throw new Error("Las contraseñas no coinciden");
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error("Formato de email inválido");
      }

      const result = await signUp(email, password);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // Redirigir a la página de verificación con el parámetro new=true
      router.push(`/auth/verify?new=true&email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err.message || "Error al registrar el usuario");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      const result = await signInWithGoogle();
      if (result.success) {
        router.push("/dashboard");
      } else {
        setError(result.error || "Error al iniciar sesión con Google");
      }
    } catch (err) {
      setError("Ocurrió un error inesperado");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">BillExpress</CardTitle>
        <Text className="text-center">Crea una nueva cuenta</Text>
      </CardHeader>
      <CardContent>
        {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md">{error}</div>}
        
        {registrationSuccess && (
          <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-md">
            <p>¡Cuenta creada exitosamente!</p>
            <p>Se ha enviado un correo de verificación a {email}. Por favor, revisa tu bandeja de entrada y sigue las instrucciones para verificar tu cuenta.</p>
            <p className="mt-2">Serás redirigido a la página de inicio de sesión en unos segundos...</p>
          </div>
        )}

        {!registrationSuccess && (
          <>
            <GoogleAuthButton onClick={handleGoogleSignIn} loading={googleLoading} label="Registrarse con Google" />

            <div className="relative my-4">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-background px-2 text-xs text-muted-foreground">O</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="relative">
                <Input placeholder="Contraseña" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                </button>
              </div>
              <div>
                <Input
                  placeholder="Confirmar contraseña"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <div className="mt-4 text-center text-sm">
                <Text>
                  ¿Ya tienes una cuenta?{" "}
                  <Link href="/auth/login" className="text-blue-600 hover:underline">
                    Iniciar sesión
                  </Link>
                </Text>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white"></span>}
                <UserPlus className="mr-2 h-4 w-4" />
                Crear Cuenta
              </Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
}
