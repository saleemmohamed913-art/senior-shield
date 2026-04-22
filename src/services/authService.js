import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from './firebase';

// Phone OTP Authentication
export const sendPhoneOTP = async (phoneNumber, appVerifier) => {
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    return { success: true, confirmationResult };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const verifyPhoneOTP = async (confirmationResult, code) => {
  try {
    const userCredential = await confirmationResult.confirm(code);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Setup reCAPTCHA verifier
export const setupRecaptchaVerifier = () => {
  try {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA verified');
        },
      });
    }
    return window.recaptchaVerifier;
  } catch (error) {
    console.error('reCAPTCHA setup failed:', error);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (displayName) => {
  try {
    await updateProfile(auth.currentUser, { displayName });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Logout
export const logout = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};
