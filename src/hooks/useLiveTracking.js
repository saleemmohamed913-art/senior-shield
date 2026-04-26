import { useEffect, useRef, useState } from 'react';
import { updateTrackingLocation } from '../services/firestoreService';

/**
 * Hook to start sending live location updates to a tracking session
 * Usage: useLiveTracking(sessionId, isEnabled)
 */
export function useLiveTracking(sessionId, isEnabled = true) {
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isEnabled || !sessionId) {
      console.log('⏸️ useLiveTracking: disabled or no sessionId', { isEnabled, sessionId });
      return;
    }

    console.log('📡 useLiveTracking: STARTING for session:', sessionId);

    // Start tracking location
    const startTracking = () => {
      setIsTracking(true);
      setError(null);

      const sendLocation = async () => {
        console.log('📍 useLiveTracking: requesting GPS...');
        if (!('geolocation' in navigator)) {
          console.error('❌ useLiveTracking: geolocation not supported');
          setError('Geolocation not supported');
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            console.log(`📍 useLiveTracking: GPS acquired → ${latitude}, ${longitude} (±${Math.round(accuracy)}m)`);

            try {
              const result = await updateTrackingLocation(sessionId, latitude, longitude, accuracy);
              if (result.success) {
                console.log('✅ useLiveTracking: Firestore updated');
              } else {
                console.error('❌ useLiveTracking: Firestore update failed:', result.error);
                setError(result.error);
              }
            } catch (err) {
              console.error('❌ useLiveTracking: unexpected error:', err);
              setError(err.message);
            }
          },
          (err) => {
            console.error('❌ useLiveTracking: GPS error:', err.message, '(code:', err.code, ')');
            setError(`GPS error: ${err.message}`);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      };

      // Send immediately, then every 5 seconds
      sendLocation();
      intervalRef.current = setInterval(sendLocation, 5000);
    };

    startTracking();

    return () => {
      console.log('🛑 useLiveTracking: STOPPING for session:', sessionId);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsTracking(false);
    };
  }, [sessionId, isEnabled]);

  return { isTracking, error };
}

export default useLiveTracking;
