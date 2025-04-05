'use client';

import { 
  sendEmailVerification, 
  sendPasswordResetEmail,
  updateProfile,
  User
} from 'firebase/auth';
import { auth, storage } from './config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
