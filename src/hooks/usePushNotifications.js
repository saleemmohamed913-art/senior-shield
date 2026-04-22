import { useState, useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { messaging, db } from '../services/firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const usePushNotifications = (uid) => {
  const [permission, setPermission] = useState(Notification.permission);
  const [fcmToken, setFcmToken] = useState(null);
  const [error, setError] = useState(null);

  // Register the Firebase SW and pass config via postMessage
  const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) return null;
    try {
      const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      // Send Firebase config to the SW so it can init FCM
      const config = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      };
      reg.active?.postMessage({ type: 'FIREBASE_CONFIG', config });
      return reg;
    } catch (err) {
      console.error('SW registration failed:', err);
      return null;
    }
  };

  // Save FCM token to Firestore under user document
  const saveTokenToFirestore = async (token) => {
    if (!uid || !token) return;
    try {
      await updateDoc(doc(db, 'users', uid), {
        fcmToken: token,
        fcmUpdatedAt: Date.now(),
      });
      console.log('✅ FCM token saved to Firestore');
    } catch (err) {
      console.error('Failed to save FCM token:', err);
    }
  };

  // Request permission and get token
  const requestPermission = async () => {
    if (!messaging) {
      setError('Push notifications not supported on this browser.');
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') {
        setError('Notification permission denied.');
        return;
      }

      await registerServiceWorker();

      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (token) {
        setFcmToken(token);
        await saveTokenToFirestore(token);
        console.log('📲 FCM Token acquired:', token);
      } else {
        setError('Could not get push token. Try again.');
      }
    } catch (err) {
      console.error('Push notification error:', err);
      setError(err.message);
    }
  };

  // Auto-request on mount if uid is ready and permission not yet decided
  useEffect(() => {
    if (!uid || !messaging) return;
    if (Notification.permission === 'granted') {
      requestPermission(); // silently re-acquire token (handles token refresh)
    }
  }, [uid]);

  // Foreground message handler — shows native notification
  useEffect(() => {
    if (!messaging) return;
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('📬 Foreground push received:', payload);
      if (Notification.permission === 'granted' && payload.notification) {
        new Notification(payload.notification.title || '🚨 Emergency', {
          body: payload.notification.body,
          icon: '/favicon.svg',
          requireInteraction: true,
        });
      }
    });
    return () => unsubscribe();
  }, []);

  return { permission, fcmToken, error, requestPermission };
};
