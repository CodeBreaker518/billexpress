"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, CheckCircle2, AlertCircle, Loader2, RefreshCcw } from "lucide-react";
import { useAuthStore } from "@bill/_store/useAuthStore";
import { Card, CardContent, CardHeader, CardTitle } from "@bill/_components/ui/card";
import { Button } from "@bill/_components/ui/button";
import { Text } from "@bill/_components/ui/typography";
import { auth } from "@bill/_firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import BrandLoader from "@bill/_components/ui/BrandLoader";

function VerifyPageContent() {
  const { user, setUser } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewRegistration = searchParams.get("new") === "true";
  const [emailParam, setEmailParam] = useState<string | null>(searchParams.get("email"));
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);

  // Verificar el estado de verificación de email cada vez que se actualiza el usuario
  useEffect(() => {
    const checkVerification = () => {
      setIsCheckingVerification(true);
      // Forzar a actualizar el token para obtener el estado más reciente
      auth.currentUser?.reload().then(() => {
        // Actualizar el usuario en el estado global
        setUser(auth.currentUser);
        setIsCheckingVerification(false);
      }).catch(error => {
        console.error("Error al recargar el usuario:", error);
        setIsCheckingVerification(false);
      });
    };

    // Si es una nueva registración o hay un parámetro "new", no redirigir automáticamente
    // Esto permite que el usuario vea la página de verificación
    if (isNewRegistration) {
      // Solo verificar periódicamente
      const interval = setInterval(checkVerification, 5000);
      return () => clearInterval(interval);
    }

    // Si hay un usuario y tiene el email verificado, redirigir al dashboard
    if (user && user.emailVerified) {
      router.push("/dashboard");
    } else if (user) {
      // Si hay un usuario pero no tiene el email verificado, verificar periódicamente
      const interval = setInterval(checkVerification, 5000);
      return () => clearInterval(interval);
    }
  }, [user, router, setUser, isNewRegistration]);

  return (
    <div className="container max-w-md mx-auto py-12 flex flex-col items-center justify-center min-h-screen px-4">
      <VerifyEmailForm 
        isNewRegistration={isNewRegistration} 
        emailParam={emailParam} 
        isCheckingVerification={isCheckingVerification} 
      />
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<BrandLoader />}>
      <VerifyPageContent />
    </Suspense>
  );
}

interface VerifyEmailFormProps {
  isNewRegistration: boolean;
  emailParam: string | null;
  isCheckingVerification: boolean;
}

function VerifyEmailForm({ isNewRegistration, emailParam, isCheckingVerification }: VerifyEmailFormProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleResendVerification = async () => {
    if (!user && !emailParam) {
      setError("No se pudo determinar el correo electrónico para enviar la verificación");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const { sendVerificationEmail } = await import("@bill/_firebase/authService");
      
      if (user) {
        const result = await sendVerificationEmail(user);
        
        if (result.success) {
          setSuccess("Se ha enviado un nuevo correo de verificación. Por favor, revisa tu bandeja de entrada.");
        } else {
          setError(result.error || "Error al enviar el correo de verificación");
        }
      } else {
        setError("No se pudo enviar el correo de verificación. Por favor, intenta iniciar sesión nuevamente.");
      }
    } catch (err) {
      setError("Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = () => {
    // Forzar a actualizar el token para obtener el estado más reciente
    auth.currentUser?.reload().then(() => {
      if (auth.currentUser?.emailVerified) {
        setSuccess("¡Email verificado correctamente! Redirigiendo al dashboard...");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 2000);
      } else {
        setError("El email aún no ha sido verificado. Por favor, revisa tu bandeja de entrada y sigue las instrucciones.");
      }
    }).catch(error => {
      console.error("Error al recargar el usuario:", error);
      setError("Error al verificar el estado del email. Por favor, intenta nuevamente.");
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Verificación de Email</CardTitle>
        <Text className="text-center">Verifica tu correo electrónico para continuar</Text>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-md flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{success}</span>
          </div>
        )}

        <div className="space-y-6">
          <div className="text-center p-4 border rounded-md bg-gray-50 dark:bg-gray-900">
            <Mail className="h-12 w-12 mx-auto text-blue-500 mb-3" />
            <Text className="font-medium mb-2">
              Hemos enviado un correo de verificación a:
            </Text>
            <Text className="font-medium break-all mb-3 text-blue-600">
              {user?.email || emailParam || "tu correo electrónico"}
            </Text>
            <Text className="text-sm text-gray-600 dark:text-gray-400">
              Revisa tu bandeja de entrada (y carpeta de spam) y haz clic en el enlace para verificar tu cuenta.
            </Text>
          </div>

          <div className="flex flex-col space-y-2">
            <Button
              onClick={handleCheckVerification}
              disabled={isCheckingVerification}
              variant="outline"
              className="w-full"
            >
              {isCheckingVerification ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Ya verifiqué mi email
                </>
              )}
            </Button>

            <Button
              onClick={handleResendVerification}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Reenviar correo de verificación
                </>
              )}
            </Button>
          </div>

          <div className="text-center mt-4">
            <Text className="text-sm text-gray-600 dark:text-gray-400">
              Debes verificar tu email para acceder a la aplicación.
            </Text>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 