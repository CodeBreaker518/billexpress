// app/hooks/useAuth.ts
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, AuthError } from "firebase/auth";
import { auth } from "@bill/_firebase/config";
import { useAuthStore } from "@bill/_store/useAuthStore";

// Helper function to translate Firebase error codes into user-friendly messages
const getUserFriendlyErrorMessage = (error: AuthError): string => {
  const errorCode = error.code;

  // Common Firebase error codes mapped to user-friendly messages
  const errorMessages: Record<string, string> = {
    // Authentication errors
    "auth/email-already-in-use": "Este correo electrónico ya está en uso",
    "auth/invalid-email": "El correo electrónico no es válido",
    "auth/user-disabled": "Esta cuenta ha sido deshabilitada",
    "auth/user-not-found": "No existe una cuenta con este correo electrónico",
    "auth/wrong-password": "La contraseña es incorrecta",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres",
    "auth/operation-not-allowed": "Esta operación no está permitida",
    "auth/popup-closed-by-user": "Se cerró la ventana de inicio de sesión",
    "auth/cancelled-popup-request": "Se canceló la operación",
    "auth/popup-blocked": "El navegador bloqueó la ventana emergente",
    "auth/network-request-failed": "Error de conexión. Verifica tu internet",
    "auth/timeout": "La operación tardó demasiado tiempo",
    "auth/configuration-not-found": "Servicio no disponible. Inténtalo más tarde",

    // Other Firebase errors
    "permission-denied": "No tienes permisos para realizar esta acción",
    unavailable: "Servicio no disponible. Inténtalo más tarde",
  };

  // Return the user-friendly message or a generic error message
  return errorMessages[errorCode] || "Ocurrió un error. Inténtalo de nuevo más tarde.";
};

export const useAuth = () => {
  const { logout: storeLogout } = useAuthStore();

  // We no longer need the onAuthStateChanged listener here
  // as it's now handled directly in useAuthStore

  // Función para crear cuenta Efectivo por defecto
  const createDefaultAccount = async (userId: string) => {
    try {
      const { addAccount } = await import("@bill/_firebase/accountService");

      // Crear cuenta predeterminada
      const defaultAccount = await addAccount({
        name: "Efectivo",
        color: "#22c55e", // Verde
        balance: 0,
        userId: userId,
        isDefault: true,
      });

      return true;
    } catch (error) {
      console.error("Error al crear cuenta predeterminada:", error);
      return false;
    }
  };

  // User registration
  const signUp = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Enviar correo de verificación automáticamente
      if (userCredential.user) {
        // Enviar correo de verificación
        const { sendVerificationEmail } = await import("@bill/_firebase/authService");
        await sendVerificationEmail(userCredential.user);

        // Crear cuenta predeterminada
        await createDefaultAccount(userCredential.user.uid);
      }

      return { success: true, emailVerificationSent: true };
    } catch (error: any) {
      return {
        success: false,
        error: getUserFriendlyErrorMessage(error as AuthError),
      };
    }
  };

  // User login
  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Verificar si el correo está verificado
      if (userCredential.user && !userCredential.user.emailVerified) {
        // Enviar nuevo correo de verificación
        const { sendVerificationEmail } = await import("@bill/_firebase/authService");
        await sendVerificationEmail(userCredential.user);

        // Ya no cerramos la sesión para permitir permanecer en la página de verificación

        return {
          success: false,
          error:
            "Tu correo electrónico no ha sido verificado. Se ha enviado un nuevo correo de verificación a tu dirección. Por favor, verifica tu cuenta antes de iniciar sesión.",
          emailVerificationSent: true,
          user: userCredential.user,
        };
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: getUserFriendlyErrorMessage(error as AuthError),
      };
    }
  };

  // Google authentication
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);

      // Si es un nuevo usuario, crear cuenta predeterminada
      if (userCredential.user) {
        // @ts-ignore - Verificar si es un nuevo usuario
        const isNewUser = userCredential._tokenResponse?.isNewUser;

        if (isNewUser) {
          await createDefaultAccount(userCredential.user.uid);
        }
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: getUserFriendlyErrorMessage(error as AuthError),
      };
    }
  };

  // Logout user
  const logout = async () => {
    try {
      // Limpiar todos los stores antes de cerrar sesión
      const { useAccountStore } = await import("@bill/_store/useAccountStore");
      const { useIncomeStore } = await import("@bill/_store/useIncomeStore");
      const { useExpenseStore } = await import("@bill/_store/useExpenseStore");
      const { useFinanceStore } = await import("@bill/_store/useFinanceStore");
      const { useReminderStore } = await import("@bill/_store/useReminderStore");

      // Limpiar datos almacenados en las tiendas
      console.log("Limpiando datos de usuario antes de cerrar sesión...");
      useAccountStore.getState().setAccounts([]);
      useIncomeStore.getState().setIncomes([]);
      useExpenseStore.getState().setExpenses([]);
      useReminderStore.getState().setReminders([]);
      
      // Restablecer otras configuraciones
      useFinanceStore.getState().setSearchTerm("");
      
      // Usar la función de logout de useAuthStore que ya maneja el signOut
      await storeLogout();
      
      console.log("Sesión cerrada y datos limpiados correctamente");
      return { success: true };
    } catch (error: any) {
      console.error("Error al cerrar sesión:", error);
      return {
        success: false,
        error: getUserFriendlyErrorMessage(error as AuthError),
      };
    }
  };

  return { signUp, signIn, signInWithGoogle, logout };
};
