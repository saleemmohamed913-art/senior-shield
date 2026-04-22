import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../services/firebase';
import { getUserProfile } from '../services/firestoreService';
import { logout as firebaseLogout } from '../services/authService';
import { changeLanguage } from '../utils/i18n';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false); // FORCE FALSE FOR TESTING
  const [error, setError] = useState(null);

  useEffect(() => {
    // Safety: Mark as not loading after 3 seconds regardless
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 1000); // Reduced to 1 second

    let unsubscribe;

    try {
      unsubscribe = auth.onAuthStateChanged(async (user) => {
        clearTimeout(timeout);
        setCurrentUser(user);
        
        if (user) {
          try {
            // Fetch user profile from Firestore
            const profileResult = await getUserProfile(user.uid);
            if (profileResult.success) {
              setUserProfile(profileResult.data);
              
              // Load user's preferred language and set it in i18n
              const userPreferredLanguage = profileResult.data?.preferences?.preferredLanguage;
              if (userPreferredLanguage && ['en', 'ta'].includes(userPreferredLanguage)) {
                await changeLanguage(userPreferredLanguage);
              }
            } else {
              console.error('Failed to load profile:', profileResult.error);
              setError(profileResult.error);
            }
          } catch (err) {
            console.error('Auth context profile fetch error:', err);
            setError(err.message);
          }
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      });
    } catch (err) {
      clearTimeout(timeout);
      setError(err.message);
      setLoading(false);
    }

    return () => {
      clearTimeout(timeout);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const value = {
    currentUser,
    userProfile,
    setUserProfile,
    loading,
    error,
    isAuthenticated: !!currentUser,
    logout: firebaseLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
