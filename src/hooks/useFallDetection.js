import { useState, useEffect, useRef } from 'react';

// Sensitivity threshold — tune higher to reduce false triggers
// Typical fall: sharp spike >25 m/s², then free-fall near 0
const FALL_THRESHOLD = 25;    // m/s² total acceleration spike
const FREEFALL_THRESHOLD = 3; // m/s² near-zero gravity window

export const useFallDetection = ({ onFallDetected, enabled = true }) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastFallTime, setLastFallTime] = useState(null);
  const freefallRef = useRef(false);
  const cooldownRef = useRef(false); // prevent rapid re-trigger

  useEffect(() => {
    // Check hardware support
    if (typeof DeviceMotionEvent !== 'undefined') {
      setIsSupported(true);
    }
  }, []);

  const handleMotion = (event) => {
    if (!enabled || cooldownRef.current) return;

    const { accelerationIncludingGravity: acc } = event;
    if (!acc) return;

    const total = Math.sqrt(
      Math.pow(acc.x || 0, 2) +
      Math.pow(acc.y || 0, 2) +
      Math.pow(acc.z || 0, 2)
    );

    // Step 1: Detect free-fall (near-zero g window)
    if (total < FREEFALL_THRESHOLD) {
      freefallRef.current = true;
    }

    // Step 2: Detect impact spike AFTER free-fall → confirmed fall
    if (freefallRef.current && total > FALL_THRESHOLD) {
      freefallRef.current = false;
      cooldownRef.current = true;

      const now = Date.now();
      setLastFallTime(now);
      console.warn('🚨 Fall detected! Total acceleration:', total.toFixed(2));

      if (onFallDetected) onFallDetected();

      // 30-second cooldown to prevent cascade triggers
      setTimeout(() => {
        cooldownRef.current = false;
      }, 30000);
    }
  };

  const startMonitoring = async () => {
    if (!isSupported) return;

    // iOS 13+ requires explicit permission
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceMotionEvent.requestPermission();
        if (permission !== 'granted') {
          console.warn('Motion permission denied');
          return;
        }
      } catch (err) {
        console.error('Motion permission error:', err);
        return;
      }
    }

    window.addEventListener('devicemotion', handleMotion);
    setIsMonitoring(true);
    console.log('📱 Fall detection monitoring started');
  };

  const stopMonitoring = () => {
    window.removeEventListener('devicemotion', handleMotion);
    setIsMonitoring(false);
    freefallRef.current = false;
    console.log('🛑 Fall detection stopped');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopMonitoring();
  }, []);

  return { isSupported, isMonitoring, lastFallTime, startMonitoring, stopMonitoring };
};
