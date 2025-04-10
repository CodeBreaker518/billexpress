"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@bill/_components/ui/card";
import { Input } from "@bill/_components/ui/input";
import { Button } from "@bill/_components/ui/button";
import { Text } from "@bill/_components/ui/typography";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="container max-w-md mx-auto py-12 flex flex-col items-center justify-center min-h-screen px-4">
      <ForgotPasswordForm />
    </div>
  );
}

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!email) {
        throw new Error("Debes ingresar tu correo electrónico");
      }

      const { sendPasswordReset } = await import("@bill/_firebase/authService");
      const result = await sendPasswordReset(email);
      
      if (result.success) {
        setSuccess("Se ha enviado un correo de restablecimiento de contraseña a tu dirección de correo electrónico.");
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setError(err.message || "Error al enviar el correo de restablecimiento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Recuperar Contraseña</CardTitle>
        <Text className="text-center">Ingresa tu correo electrónico para recibir un enlace de restablecimiento</Text>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md flex items-center gap-2 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-md flex items-center gap-2 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input 
              placeholder="Correo electrónico" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white"></span>}
            <Mail className="mr-2 h-4 w-4" />
            Enviar correo de recuperación
          </Button>

          <div className="mt-4 text-center">
            <Link href="/auth/login" className="text-blue-600 hover:underline inline-flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 