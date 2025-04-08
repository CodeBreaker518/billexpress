import { FirebaseError } from 'firebase/app';

export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/invalid-email':
        return 'El correo electrónico no es válido.';
      case 'auth/user-disabled':
        return 'Esta cuenta ha sido deshabilitada.';
      case 'auth/user-not-found':
        return 'No existe una cuenta con este correo electrónico.';
      case 'auth/wrong-password':
        return 'La contraseña es incorrecta.';
      case 'auth/email-already-in-use':
        return 'Ya existe una cuenta con este correo electrónico.';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 6 caracteres.';
      case 'auth/operation-not-allowed':
        return 'Esta operación no está permitida.';
      case 'auth/popup-closed-by-user':
        return 'Se cerró la ventana de inicio de sesión.';
      case 'auth/popup-blocked':
        return 'El navegador bloqueó la ventana emergente. Por favor, permite las ventanas emergentes para este sitio.';
      case 'auth/network-request-failed':
        return 'Error de conexión. Por favor, verifica tu conexión a internet.';
      case 'auth/too-many-requests':
        return 'Demasiados intentos fallidos. Por favor, intenta más tarde.';
      case 'auth/requires-recent-login':
        return 'Esta operación es sensible y requiere que vuelvas a iniciar sesión.';
      case 'auth/invalid-credential':
        return 'Las credenciales proporcionadas son inválidas o han expirado.';
      default:
        return `Error: ${error.message}`;
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'Ha ocurrido un error inesperado.';
} 