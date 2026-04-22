// Firebase Messaging Service Worker
// This file MUST be in /public and named firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize firebase config (injected by main app)
let messaging;
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    firebase.initializeApp(event.data.config);
    messaging = firebase.messaging();
    console.log('[SW] Firebase initialized with messaging');
  }
});

// ⚠️ These MUST be top-level (initial evaluation) for Firebase to register them correctly
// Handle background messages
self.addEventListener('push', (event) => {
  if (!messaging) return;
  
  if (event.data) {
    const data = event.data.json();
    const { title, body, icon } = data.notification || {};
    
    event.waitUntil(
      self.registration.showNotification(title || '🚨 Emergency Alert', {
        body: body || 'An emergency has been triggered.',
        icon: icon || '/favicon.svg',
        badge: '/favicon.svg',
        vibrate: [200, 100, 200, 100, 200],
        requireInteraction: true,
        data: data.data || {},
        actions: [
          { action: 'view', title: '📍 View Location' },
          { action: 'dismiss', title: 'Dismiss' },
        ],
      })
    );
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      if (event.action === 'view' && event.notification.data?.trackingLink) {
        return clients.openWindow(event.notification.data.trackingLink);
      } else {
        return clients.openWindow('/dashboard');
      }
    })
  );
});

// Handle subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Push subscription changed, requesting new subscription');
  if (messaging) {
    event.waitUntil(
      messaging.getToken().then((token) => {
        if (token) {
          console.log('[SW] New token after subscription change:', token);
          // Notify app about new token
          self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage({
                type: 'NEW_FCM_TOKEN',
                token: token,
              });
            });
          });
        }
      })
    );
  }
});
