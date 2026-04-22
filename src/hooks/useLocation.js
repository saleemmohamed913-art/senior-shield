import { useState, useRef, useEffect } from 'react';
import { getUserLocation } from '../services/sosService';

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const watchId = useRef(null);
  const lastSent = useRef(0);
  const prevLocation = useRef(null);

  const hasMovedEnough = (prev, next) => {
    if (!prev) return true;
    const distance = Math.sqrt(
      Math.pow(prev.latitude - next.latitude, 2) +
      Math.pow(prev.longitude - next.longitude, 2)
    );
    return distance > 0.0001; // ~10–15 meters
  };

  const getLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const loc = await getUserLocation();
      setLocation(loc);
      return loc;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const sendLiveLocation = async (uid, loc) => {
    const now = Date.now();
    // Throttle to send max once every 30 seconds AND only if moved enough
    if (now - lastSent.current > 30000 && hasMovedEnough(prevLocation.current, loc)) {
      lastSent.current = now;
      prevLocation.current = loc;
      try {
        const url = `https://us-central1-${import.meta.env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net/updateLocation`;
        await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid, location: loc }),
        });
        console.log(`📡 Background track pushed for ${uid}`);
      } catch (err) {
        console.error("❌ Live track send failed:", err);
      }
    }
  };

  const startTracking = (uid) => {
    if (!navigator.geolocation) {
      console.warn("Geolocation watchPosition not supported on this browser.");
      return;
    }

    if (watchId.current !== null) {
      return; // Already tracking
    }
    
    setIsTracking(true);
    console.log("📍 Initiating live tracking sequence...");
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setLocation(loc);
        if (uid) sendLiveLocation(uid, loc);
      },
      (err) => {
        console.error("Watch location error:", err);
        setError(err.message);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  };

  const stopTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      console.log("🛑 Live tracking halted.");
      watchId.current = null;
      setIsTracking(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  return { location, getLocation, loading, error, isTracking, startTracking, stopTracking };
};

export default useLocation;
