import { logSOS } from './firestoreService';

// Helper: Pause for retry delays
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Generate Google Maps link with location
export const generateMapsLink = (lat, lng) => {
  return `https://maps.google.com/?q=${lat},${lng}`;
};

// Build the emergency SMS body
const buildSOSMessage = (userName, lat, lng, trackingLink) => {
  const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
  const tracker = trackingLink ? `\nLive Tracker: ${trackingLink}` : '';
  return `🚨 EMERGENCY ALERT!\n\n${userName} needs immediate help.\nLocation: ${mapsLink}${tracker}\n\nPlease check on them immediately.`;
};

// Open native SMS app pre-filled (free, no backend needed)
export const sendNativeSMS = (phone, message) => {
  // Android uses ?body=, iOS uses &body= — this covers both
  const encoded = encodeURIComponent(message);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const uri = isIOS
    ? `sms:${phone}&body=${encoded}`
    : `sms:${phone}?body=${encoded}`;
  window.open(uri, '_blank');
};

// Main SOS trigger — free native SMS to all emergency contacts
export const triggerSOS = async (uid, location, userProfile) => {
  console.log('🚨 SOS TRIGGER INITIATED', { uid, location });

  if (!uid) return { success: false, error: 'User ID missing' };

  if (!userProfile?.emergencyContacts?.length) {
    return { success: false, error: 'No emergency contacts configured. Please add contacts in your Profile.' };
  }

  const lat = location?.latitude;
  const lng = location?.longitude;
  const baseUrl = window.location.hostname === "localhost"
    ? "https://senior-sheild-4ec1d.web.app"
    : window.location.origin;
  const trackingLink = `${baseUrl}/track/${uid}`;
  const message = buildSOSMessage(
    userProfile.name || 'User',
    lat || 'Unknown',
    lng || 'Unknown',
    lat && lng ? trackingLink : null
  );

  const contacts = userProfile.emergencyContacts;
  let contactsNotified = 0;

  // Open SMS for primary contact first, then the rest sequentially
  const primary = contacts.find(c => c.isPrimary) || contacts[0];
  const others = contacts.filter(c => c !== primary);

  // Small delay between SMS opens to prevent browser blocking
  sendNativeSMS(primary.phone, message);
  contactsNotified++;

  for (const contact of others) {
    await new Promise(r => setTimeout(r, 800));
    sendNativeSMS(contact.phone, message);
    contactsNotified++;
  }

  // Log to Firestore
  try {
    const mapsLink = lat && lng ? generateMapsLink(lat, lng) : null;
    await logSOS(uid, {
      location: location || {},
      mapsLink,
      triggeredAt: new Date(),
      triggeredBy: 'user',
      smsSent: true,
      contactsNotified,
      status: 'completed',
      attempts: 1,
    });
  } catch (logError) {
    console.warn('SOS logged but Firestore write failed:', logError);
  }

  return {
    success: true,
    data: {
      contactsNotified,
      message: `SMS opened for ${contactsNotified} contact${contactsNotified !== 1 ? 's' : ''}`,
    },
  };
};

// Get user location with high accuracy
export const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported on this device'));
      return;
    }

    console.log('📍 Requesting geolocation...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          timestamp: new Date().toISOString(),
        };
        console.log('✅ Location acquired:', locationData);
        resolve(locationData);
      },
      (error) => {
        console.error('❌ Geolocation error:', error);
        let errorMessage = 'Could not get location';
        if (error.code === 1) errorMessage = 'Location permission denied';
        if (error.code === 2) errorMessage = 'Location service unavailable';
        if (error.code === 3) errorMessage = 'Location request timeout';
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0, // Force fresh location
      }
    );
  });
};


