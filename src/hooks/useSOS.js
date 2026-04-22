import { useState } from 'react';
import { triggerSOS as triggerSOSBackend } from '../services/sosBackendService';
import { triggerSOS as triggerSOSNative } from '../services/sosService';
import { useLocation } from './useLocation';

export const useSOS = () => {
  const [sosTriggered, setSosTriggered] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [sosError, setSosError] = useState(null);
  const { location, getLocation, isTracking, startTracking, stopTracking } = useLocation();

  const triggerEmergencyAlert = async (userProfile, useBackend = true) => {
    setSosLoading(true);
    setSosError(null);
    try {
      // Get current location
      let currentLocation = location;
      if (!currentLocation) {
        currentLocation = await getLocation();
      }

      if (!currentLocation) {
        throw new Error('Could not get location');
      }

      // Trigger SOS via backend API or native SMS
      let result;
      
      if (useBackend) {
        // Use backend API (Fast2SMS) - recommended for production
        result = await triggerSOSBackend(userProfile.uid, currentLocation, userProfile, 'manual');
        
        // 🔥 FALLBACK: If backend fails, use native SMS
        if (!result.success) {
          console.warn('⚠️ Backend SOS failed, trying native SMS fallback...');
          result = await triggerSOSNative(userProfile.uid, currentLocation, userProfile);
          if (result.success) {
            setSosError('Backend unavailable - SMS sent via alternative method');
          }
        }
      } else {
        // Use native SMS (browser-based, no backend needed)
        result = await triggerSOSNative(userProfile.uid, currentLocation, userProfile);
      }
      
      if (result.success) {
        setSosTriggered(true);
        startTracking(userProfile.uid); // 🔥 Engage persistent live tracking

        // Reset after 5 seconds
        setTimeout(() => setSosTriggered(false), 5000);
        return result;
      } else {
        throw new Error(result.error || 'Failed to send SOS alert');
      }
    } catch (err) {
      setSosError(err.message);
      // Show alert to user about the error
      console.error('❌ SOS Error:', err.message);
      return { success: false, error: err.message };
    } finally {
      setSosLoading(false);
    }
  };

  return {
    sosTriggered,
    sosLoading,
    sosError,
    location,
    getLocation,
    triggerEmergencyAlert,
    isTracking,
    startTracking,
    stopTracking
  };
};

export default useSOS;
