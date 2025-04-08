import { useEffect, useState } from 'react';
import { getRedirectResult } from 'firebase/auth';
import { auth } from '@bill/_firebase/config';
import { useRouter } from 'next/navigation';

export function GoogleRedirectHandler() {
  const router = useRouter();
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(false);

  useEffect(() => {
    const handleRedirectResult = async () => {
      if (isProcessingRedirect) return;
      
      try {
        setIsProcessingRedirect(true);
        console.log("🔍 Verificando resultado de redirección...");
        const result = await getRedirectResult(auth);
        
        if (result?.user) {
          console.log("✅ Usuario autenticado después de redirección:", result.user.email);
          
          try {
            // @ts-ignore
            const isNewUser = result._tokenResponse?.isNewUser;
            console.log("ℹ️ ¿Es usuario nuevo?", isNewUser);
            
            // Verificar si el usuario ya tiene una cuenta predeterminada
            const { getUserAccounts } = await import('@bill/_firebase/accountService');
            const accounts = await getUserAccounts(result.user.uid);
            const hasDefaultAccount = accounts.some(acc => acc.name === "Efectivo" && acc.isDefault);
            
            if (isNewUser || !hasDefaultAccount) {
              console.log("⚠️ Creando cuenta predeterminada...");
              const { addAccount } = await import('@bill/_firebase/accountService');
              
              // Crear cuenta predeterminada
              const defaultAccount = await addAccount({
                name: "Efectivo",
                color: "#22c55e", // Verde
                balance: 0,
                userId: result.user.uid,
                isDefault: true,
              });
              
              if (!defaultAccount) {
                throw new Error("No se pudo crear la cuenta predeterminada");
              }
              console.log("✅ Cuenta predeterminada creada exitosamente");
            }

            // Redirigir al dashboard
            router.push('/dashboard');
          } catch (error) {
            console.error("❌ Error en el proceso post-redirección:", error);
            throw error;
          }
        } else {
          console.log("ℹ️ No hay resultado de redirección pendiente");
        }
      } catch (error: any) {
        console.error("❌ Error al manejar resultado de redirección:", error);
        router.push(`/auth/login?error=${encodeURIComponent(error.message || "Error al procesar el inicio de sesión")}`);
      } finally {
        setIsProcessingRedirect(false);
      }
    };

    // Ejecutar solo si no hay usuario actual
    if (!auth.currentUser) {
      handleRedirectResult();
    }
  }, [router, isProcessingRedirect]);

  return null;
} 