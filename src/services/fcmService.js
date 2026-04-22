import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from './firebase';
import { db } from './firebase';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

/**
 * Request notification permission and get FCM token
 * Stores token in Firestore for backend to send notifications
 */
export const requestNotificationPermission = async (uid) => {
  try {
    if (!messaging) {
      console.log('📱 Messaging not available in this browser');
      return null;
    }

    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.log('❌ Notifications not supported');
      return null;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    console.log('🔔 Notification permission:', permission);

    if (permission !== 'granted') {
      console.log('🚫 Notification permission denied');
      return null;
    }

    // Get VAPID key from environment
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn('⚠️ VAPID key not configured in .env');
      return null;
    }

    // Get FCM token
    console.log('📡 Getting FCM token...');
    const token = await getToken(messaging, {
      vapidKey: vapidKey,
    });

    if (!token) {
      console.error('❌ Failed to get FCM token');
      return null;
    }

    console.log('✅ FCM Token received:', token.substring(0, 30) + '...');

    // Store token in Firestore
    if (uid) {
      await storeFCMToken(uid, token);
    }

    return token;
  } catch (error) {
    console.error('❌ Error getting notification permission:', error);
    return null;
  }
};

/**
 * Store FCM token in Firestore for backend to use
 */
export const storeFCMToken = async (uid, token) => {
  try {
    const tokenRef = doc(db, 'users', uid, 'settings', 'fcm');
    await setDoc(
      tokenRef,
      {
        token,
        createdAt: new Date(),
        updatedAt: new Date(),
        browserInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
        },
      },
      { merge: true }
    );
    console.log('✅ FCM token stored in Firestore');
  } catch (error) {
    console.error('❌ Error storing FCM token:', error);
  }
};

/**
 * Remove FCM token from Firestore (e.g., on logout)
 */
export const removeFCMToken = async (uid) => {
  try {
    const tokenRef = doc(db, 'users', uid, 'settings', 'fcm');
    await deleteDoc(tokenRef);
    console.log('✅ FCM token removed from Firestore');
  } catch (error) {
    console.error('❌ Error removing FCM token:', error);
  }
};

/**
 * Handle foreground messages (when app is open)
 */
export const setupForegroundMessageHandler = (onMessageCallback) => {
  if (!messaging) {
    console.log('📱 Messaging not available');
    return;
  }

  onMessage(messaging, (payload) => {
    console.log('📬 Foreground message received:', payload);

    const { notification, data } = payload;

    // Show notification in app (using browser notification)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification?.title || 'Senior Shield', {
        body: notification?.body || 'New notification',
        icon: '/icon.png',
        badge: '/badge.png',
        data: data || {},
      });
    }

    // Call custom callback if provided
    if (onMessageCallback) {
      onMessageCallback(payload);
    }
  });
};

/**
 * Register service worker for background messages
 */
export const registerServiceWorkerForMessaging = async (firebaseConfig) => {
  try {
    if (!('serviceWorker' in navigator)) {
      console.log('❌ Service Workers not supported');
      return;
    }

    console.log('📋 Registering service worker for Firebase Messaging...');

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });

    console.log('✅ Service Worker registered:', registration);

    // Send Firebase config to service worker
    if (registration.active) {
      registration.active.postMessage({
        type: 'FIREBASE_CONFIG',
        config: firebaseConfig,
      });
      console.log('✅ Firebase config sent to Service Worker');
    }

    return registration;
  } catch (error) {
    console.error('❌ Error registering service worker:', error);
    return null;
  }
};

/**
 * Test notification function (for development)
 */
export const sendTestNotification = async () => {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('Test Notification 🧪', {
        body: 'FCM is working correctly!',
        icon: '/icon.png',
      });

      notification.onclick = () => {
        window.focus();
      };

      console.log('✅ Test notification sent');
    } else {
      console.log('⚠️ Notification permission not granted');
    }
  } catch (error) {
    console.error('❌ Error sending test notification:', error);
  }
};
