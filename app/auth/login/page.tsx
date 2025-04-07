"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "@bill/_hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@bill/_components/ui/card";
import { Input } from "@bill/_components/ui/input";
import { Button } from "@bill/_components/ui/button";
import { Text } from "@bill/_components/ui/typography";
import { Separator } from "@bill/_components/ui/separator";
import GoogleAuthButton from "@bill/_components/GoogleAuthButton";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="container max-w-md mx-auto py-12 flex flex-col items-center justify-center min-h-screen px-4">
      <LoginForm />
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn(email, password);
      if (!result.success) {
        throw new Error(result.error);
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      const result = await signInWithGoogle();
      if (!result.success) {
        throw new Error(result.error);
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión con Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">BillExpress</CardTitle>
        <Text className="text-center">Inicia sesión para continuar</Text>
      </CardHeader>
      <CardContent>
        {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md">{error}</div>}

        <GoogleAuthButton onClick={handleGoogleSignIn} loading={googleLoading} label="Iniciar sesión con Google" />

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
          <div className="mt-4 text-center text-sm">
            <Text>
              ¿Ya tienes una cuenta?{" "}
              <Link href="/auth/register" className="text-blue-600 hover:underline">
                Iniciar sesión
              </Link>
            </Text>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white"></span>}
            <LogIn className="mr-2 h-4 w-4" />
            Iniciar Sesión
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
