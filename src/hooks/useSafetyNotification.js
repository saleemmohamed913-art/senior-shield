import { useEffect } from 'react';

/**
 * Custom hook for periodic safety check notifications
 * - Requests notification permission on first use
 * - Shows notification every 15 minutes when app is in background
 * - Includes click handler to bring app to focus
 * 
 * ⚠️ Note: Won't work when app is completely closed (needs Service Worker for that)
 */
export const useSafetyNotification = () => {
  useEffect(() => {
    // Check if Notifications API is supported
    if (!('Notification' in window)) {
      console.log('📱 Notifications API not supported');
      return;
    }

    // Request permission on first load
    if (Notification.permission === 'default') {
      console.log('🔔 Requesting notification permission...');
      Notification.requestPermission().then(permission => {
        console.log('✅ Permission status:', permission);
      });
    }

    // Function to show notification
    const showNotification = () => {
      // Only show if permission granted AND app is in background
      if (Notification.permission === 'granted' && document.hidden) {
        console.log('📬 Showing safety notification');

        const notification = new Notification('Safety Check 🚨', {
          body: 'Are you safe? Tap to confirm or report emergency.',
          icon: '/icon.png',
          tag: 'safety-check', // Only one notification per tag
          badge: '/badge.png',
          requireInteraction: false, // Auto-dismiss after timeout
        });

        // Click handler - bring app to focus
        notification.onclick = () => {
          console.log('👆 Notification clicked');
          window.focus();
          window.location.href = '/dashboard';
        };

        // Error handler
        notification.onerror = (error) => {
          console.error('❌ Notification error:', error);
        };
      }
    };

    // Trigger notification every 15 minutes (900,000 ms)
    console.log('⏱️  Safety notification scheduled every 15 minutes');
    const interval = setInterval(showNotification, 15 * 60 * 1000);

    // Cleanup on unmount
    return () => {
      console.log('🧹 Clearing safety notification interval');
      clearInterval(interval);
    };
  }, []);
};

/**
 * Request notification permission explicitly
 * Can be called from a button or settings
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('📱 Notifications API not supported');
    return 'not-supported';
  }

  if (Notification.permission === 'granted') {
    console.log('✅ Notifications already enabled');
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    console.log('🚫 Notifications blocked - user must enable manually');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('✅ Permission requested:', permission);
    return permission;
  } catch (error) {
    console.error('❌ Error requesting permission:', error);
    return 'error';
  }
};

/**
 * Send a custom notification
 * Useful for manual testing or specific events
 */
export const sendNotification = (title, options = {}) => {
  if (!('Notification' in window)) {
    console.log('📱 Notifications API not supported');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.log('🚫 Notification permission not granted');
    return;
  }

  const notification = new Notification(title, {
    icon: '/icon.png',
    ...options,
  });

  notification.onclick = () => {
    window.focus();
  };

  return notification;
};
