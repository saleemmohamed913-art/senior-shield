import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { getMessaging, onMessage } from 'firebase/messaging';

// Firebase Configuration - Replace with your own config from Firebase Console
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

// Initialize FCM (with error handling for browsers without support)
export let messaging = null;
try {
  messaging = getMessaging(app);
} catch (error) {
  console.log('Messaging not supported:', error);
}

// Development: Emulators (uncomment if using Firebase Emulator Suite)
// const isDev = import.meta.env.DEV;
// if (isDev) {
//   if (!auth._initialized) {
//     connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
//   }
//   if (!db._initialized) {
//     connectFirestoreEmulator(db, 'localhost', 8080);
//   }
//   if (!rtdb._initialized) {
//     connectDatabaseEmulator(rtdb, 'localhost', 9000);
//   }
// }

// Listen for messages when app is in foreground
if (messaging) {
  onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    // Handle notification in foreground
    if (payload.notification) {
      new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: payload.notification.image || '/logo.png',
      });
    }
  });
}

export default app;
