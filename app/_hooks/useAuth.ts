// app/hooks/useAuth.ts
import { useEffect, useState, Suspense } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  AuthError,
  User
} from 'firebase/auth';
import { auth } from '@bill/_firebase/config';
import { useAuthStore } from '@bill/_store/useAuthStore';
import { useRouter } from 'next/navigation';

// Helper function to translate Firebase error codes into user-friendly messages
const getUserFriendlyErrorMessage = (error: AuthError): string => {
  const errorCode = error.code;
  
  // Common Firebase error codes mapped to user-friendly messages
  const errorMessages: Record<string, string> = {
    // Authentication errors
    'auth/email-already-in-use': 'Este correo electrónico ya está en uso',
    'auth/invalid-email': 'El correo electrónico no es válido',
    'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
    'auth/user-not-found': 'No existe una cuenta con este correo electrónico',
    'auth/wrong-password': 'La contraseña es incorrecta',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
    'auth/operation-not-allowed': 'Esta operación no está permitida',
    'auth/popup-closed-by-user': 'Se cerró la ventana de inicio de sesión',
    'auth/cancelled-popup-request': 'Se canceló la operación',
    'auth/popup-blocked': 'El navegador bloqueó la ventana emergente',
    'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
    'auth/timeout': 'La operación tardó demasiado tiempo',
    'auth/configuration-not-found': 'Servicio no disponible. Inténtalo más tarde',
    'auth/unauthorized-domain': 'Este dominio no está autorizado para iniciar sesión. Por favor, contacta al administrador.',
    
    // Other Firebase errors
    'permission-denied': 'No tienes permisos para realizar esta acción',
    'unavailable': 'Servicio no disponible. Inténtalo más tarde',
  };

  // Return the user-friendly message or a generic error message
  return errorMessages[errorCode] || 'Ocurrió un error. Inténtalo de nuevo más tarde.';
};

// Componente separado para manejar la redirección
function GoogleRedirectHandler() {
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

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const provider = new GoogleAuthProvider();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);

      if (user) {
        // Importar dinámicamente para evitar circular imports
        const { cleanupDuplicateAccounts } = await import('@bill/_firebase/accountService');
        // Limpiar cuentas duplicadas silenciosamente
        await cleanupDuplicateAccounts(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (usePopup = false) => {
    try {
      if (usePopup) {
        await signInWithPopup(auth, provider);
      } else {
        await signInWithRedirect(auth, provider);
      }
    } catch (error: any) {
      console.error('Error al iniciar sesión con Google:', error);
      router.push(`/auth/login?error=${encodeURIComponent(error.message)}`);
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      router.push('/auth/login');
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return {
    user,
    loading,
    signInWithGoogle,
    signOut,
  };
}