'use client';

import { 
  sendEmailVerification, 
  sendPasswordResetEmail,
  updateProfile,
  User,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider
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
      const credential = EmailAuthProvider.credential(user.email || '', password);
      await reauthenticateWithCredential(user, credential);
      return { success: true };
    }
    
    // Para otros proveedores, asumimos que ya está autenticado
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
    // Reautenticar al usuario si se proporciona una contraseña
    if (password) {
      const result = await reauthenticateUser(user, password);
      if (!result.success) {
        return result;
      }
    }

    // 1. Eliminar todas las cuentas financieras
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
    const incomesRef = collection(db, 'incomes');
    const incomesQuery = query(incomesRef, where('userId', '==', user.uid));
    const incomesSnapshot = await getDocs(incomesQuery);
    
    incomesSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // 3. Eliminar transacciones financieras (gastos)
    const expensesRef = collection(db, 'expenses');
    const expensesQuery = query(expensesRef, where('userId', '==', user.uid));
    const expensesSnapshot = await getDocs(expensesQuery);
    
    expensesSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // 4. Eliminar operaciones pendientes
    const pendingOpsRef = collection(db, 'pendingOperations');
    const pendingOpsQuery = query(pendingOpsRef, where('userId', '==', user.uid));
    const pendingOpsSnapshot = await getDocs(pendingOpsQuery);
    
    pendingOpsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Ejecutar el batch
    await batch.commit();
    
    // 5. Eliminar archivos de Storage
    try {
      // Eliminar imágenes de perfil
      const profileImagesRef = ref(storage, `profileImages/${user.uid}`);
      const profileImagesList = await listAll(profileImagesRef);
      
      // Eliminar cada archivo
      const deletePromises = profileImagesList.items.map(item => deleteObject(item));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Error al eliminar archivos de Storage:", error);
      // Continuamos con la eliminación del usuario aunque falle esta parte
    }
    
    // 6. Finalmente eliminar el usuario
    await deleteUser(user);
    
    return { success: true };
  } catch (error: any) {
    console.error("Error al eliminar cuenta:", error);
    return {
      success: false,
      error: error.message || "No se pudo eliminar la cuenta"
    };
  }
};
