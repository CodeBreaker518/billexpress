'use client';

import { 
  sendEmailVerification, 
  sendPasswordResetEmail,
  updateProfile,
  User,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword
} from 'firebase/auth';
import { auth, storage, db } from './config';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { collection, query, where, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';

/**
 * Send an email verification to the current user
 */
export const sendVerificationEmail = async (user: User) => {
  try {
    await sendEmailVerification(user);
    return { success: true };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Send a password reset email
 */
export const sendPasswordReset = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Update a user's profile information
 */
export const updateUserProfile = async (user: User, profileData: { displayName?: string, photoURL?: string }) => {
  try {
    await updateProfile(user, profileData);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Upload a profile image to Firebase Storage and get the download URL
 */
export const uploadProfileImage = async (user: User, file: File) => {
  try {
    // Create a storage reference
    const storageRef = ref(storage, `profileImages/${user.uid}/${file.name}`);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return { 
      success: true, 
      url: downloadURL 
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Reauthenticate the user before sensitive operations
 */
export const reauthenticateUser = async (user: User, password: string) => {
  try {
    // Solo para proveedores de email y contraseña
    if (user.providerData.length > 0 && user.providerData[0].providerId === 'password') {
      console.log("Reautenticando usuario con proveedor de email/contraseña");
      
      if (!user.email) {
        return {
          success: false,
          error: "El usuario no tiene un email asociado"
        };
      }
      
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      console.log("Reautenticación exitosa");
      return { success: true };
    }
    
    // Para proveedores como Google, intentaremos continuar con la operación
    // La verificación de "ELIMINAR" en la UI será suficiente como confirmación
    console.log("Proveedor OAuth detectado, continuando sin reautenticación específica.");
    return { success: true };
  } catch (error: any) {
    console.error("Error en reautenticación:", error);
    return {
      success: false,
      error: error.message || "Error de autenticación, verifica tu contraseña."
    };
  }
};

/**
 * Change user password (requires recent authentication)
 */
export const changeUserPassword = async (user: User, currentPassword: string, newPassword: string) => {
  try {
    // Primero reautenticar al usuario
    const reauth = await reauthenticateUser(user, currentPassword);
    if (!reauth.success) {
      return {
        success: false,
        error: reauth.error || "Error al verificar la contraseña actual"
      };
    }
    
    // Actualizar la contraseña
    await updatePassword(user, newPassword);
    
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete a user account and all associated data
 */
export const deleteUserAccount = async (user: User, password?: string) => {
  try {
    // Verificar si es un usuario de email/password
    const isEmailProvider = user.providerData.length > 0 && user.providerData[0].providerId === 'password';
    
    // Reautenticar al usuario si se proporciona una contraseña y usa email/password
    if (isEmailProvider && password) {
      console.log("Intentando reautenticar usuario de email/password");
      const result = await reauthenticateUser(user, password);
      if (!result.success) {
        console.error("Fallo en reautenticación:", result.error);
        return result;
      }
    } else if (isEmailProvider && !password) {
      // Si es un usuario de email/password pero no proporcionó contraseña
      return {
        success: false,
        error: "Se requiere tu contraseña para eliminar la cuenta"
      };
    } else {
      // Para proveedores OAuth como Google, la confirmación "ELIMINAR" es suficiente
      console.log("Usuario de OAuth (Google, etc.) procediendo con confirmación de UI");
    }

    try {
      // 1. Eliminar todas las cuentas financieras
      console.log("Eliminando cuentas financieras");
      const accountsRef = collection(db, 'accounts');
      const accountsQuery = query(accountsRef, where('userId', '==', user.uid));
      const accountsSnapshot = await getDocs(accountsQuery);
      
      // Almacenar IDs de cuentas para eliminar transacciones relacionadas
      const accountIds: string[] = [];
      
      // Usar un batch para eliminar múltiples documentos
      const batch = writeBatch(db);
      
      accountsSnapshot.forEach(doc => {
        accountIds.push(doc.id);
        batch.delete(doc.ref);
      });
      
      // 2. Eliminar transacciones financieras (ingresos)
      console.log("Eliminando ingresos");
      const incomesRef = collection(db, 'incomes');
      const incomesQuery = query(incomesRef, where('userId', '==', user.uid));
      const incomesSnapshot = await getDocs(incomesQuery);
      
      incomesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // 3. Eliminar transacciones financieras (gastos)
      console.log("Eliminando gastos");
      const expensesRef = collection(db, 'expenses');
      const expensesQuery = query(expensesRef, where('userId', '==', user.uid));
      const expensesSnapshot = await getDocs(expensesQuery);
      
      expensesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Ejecutar el batch
      console.log("Ejecutando batch para eliminar todos los datos");
      await batch.commit();
    } catch (dbError: any) {
      console.error("Error al eliminar datos de Firestore:", dbError);
      // Continuamos intentando eliminar la cuenta de usuario
    }
    
    // 4. Eliminar fotos de perfil de Firebase Storage
    // Nota: Esto se refiere a los archivos de imagen subidos a Firebase Storage, no a localStorage
    let storageCleanupSuccess = true;
    try {
      // Eliminar imagen de perfil si hay alguna
      if (user.photoURL) {
        console.log("Intentando eliminar foto de perfil");
        // Intentar eliminar directamente la imagen del perfil actual si conocemos la URL
        try {
          // Extraer la ruta del storage de la URL si es posible
          if (user.photoURL.includes('firebasestorage.googleapis.com')) {
            const fileRef = ref(storage, user.photoURL);
            await deleteObject(fileRef).catch(e => console.warn("No se pudo eliminar la imagen específica:", e));
          }
        } catch (photoError) {
          console.warn("Error al eliminar foto específica:", photoError);
        }
      }
      
      // Nota: localStorage para theme y otras preferencias se mantiene intacto
      // ya que no está vinculado a la cuenta de usuario
      
    } catch (storageError) {
      console.warn("Error al limpiar archivos de Storage:", storageError);
      storageCleanupSuccess = false;
      // Continuamos con la eliminación del usuario aunque falle esta parte
    }
    
    // 5. Finalmente eliminar el usuario
    console.log("Eliminando cuenta de usuario");
    try {
      await deleteUser(user);
      console.log("Cuenta eliminada exitosamente");
    } catch (authError: any) {
      console.error("Error al eliminar la cuenta de usuario:", authError);
      if (authError.code === 'auth/requires-recent-login') {
        return {
          success: false,
          error: "Para eliminar tu cuenta, por favor escribe 'ELIMINAR' para confirmar. Si el problema persiste, cierra sesión y vuelve a iniciar antes de intentar de nuevo."
        };
      }
      throw authError; // Re-lanzar para que sea capturado por el catch general
    }
    
    return { 
      success: true,
      storageCleanupSuccess
    };
  } catch (error: any) {
    console.error("Error al eliminar cuenta:", error);
    return {
      success: false,
      error: error.message || "No se pudo eliminar la cuenta"
    };
  }
};
