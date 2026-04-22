const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

// Initialize Firebase Admin for Firestore access
admin.initializeApp();
const db = admin.firestore();

// Fast2SMS Configuration
// Get API key from Firebase config: firebase functions:config:set fast2sms.api_key="YOUR_KEY"
const FAST2SMS_API_KEY = functions.config().fast2sms?.api_key || process.env.FAST2SMS_API_KEY;
const FAST2SMS_ENDPOINT = "https://www.fast2sms.com/dev/bulkV2";

console.log("🔧 Fast2SMS Configuration:", {
  hasApiKey: !!FAST2SMS_API_KEY,
  endpoint: FAST2SMS_ENDPOINT,
});

const rateLimitCache = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 60 seconds

exports.sendSOS = functions.https.onRequest(async (req, res) => {
  // CORS setup
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  try {
    const { uid, location } = req.body;

    if (!uid || !location) {
      return res.status(400).json({ error: "Missing uid or location in request body" });
    }

    const now = Date.now();
    const lastRequest = rateLimitCache.get(uid);
    if (lastRequest && (now - lastRequest < RATE_LIMIT_WINDOW_MS)) {
      return res.status(429).json({ error: "Rate limit exceeded. Please wait 30 seconds before sending another SOS." });
    }
    rateLimitCache.set(uid, now);

    // 1. Fetch user contacts from Firestore
    console.log(`Fetching profile for user: ${uid}`);
    const userDoc = await db.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();
    const contacts = userData.emergencyContacts || [];

    if (contacts.length === 0) {
      return res.status(400).json({ error: "No contacts found for this user" });
    }

    // 2. Generate secure tracking token (1-hour expiry)
    const token = require('crypto').randomUUID();
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
    await db.collection('trackingSessions').doc(uid).set({ token, expiresAt });
    console.log(`🔐 Tracking token generated for ${uid}`);

    // 3. Build message with token-gated tracking link
    const lat = location.lat || location.latitude;
    const lng = location.lng || location.longitude;
    const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
    const trackingLink = location.trackingLink
      ? `${location.trackingLink.split('?')[0]}?token=${token}`
      : null;
    const liveTrackMsg = trackingLink ? `\nLive Tracker: ${trackingLink}` : '';
    const userName = userData.name || 'User';
    const message = `🚨 EMERGENCY ALERT!\n\n${userName} needs immediate help.\nLocation: ${mapsLink}${liveTrackMsg}\n\nPlease check on them immediately.`;

    // 4. Send SMS to all contacts via Fast2SMS
    let contactsNotified = 0;
    let smsErrors = [];

    if (!FAST2SMS_API_KEY) {
      console.warn("⚠️ Fast2SMS API key not configured. Simulating SMS dispatch...");
      console.log("Message that would be sent:", message);
      contactsNotified = contacts.length;
    } else {
      // Extract phone numbers and normalize them
      const phoneNumbers = contacts
        .map(c => c.phone)
        .filter(Boolean)
        .map(phone => {
          // Remove all non-digits and country code if present
          let cleaned = phone.replace(/\D/g, '');
          // Handle different formats
          if (cleaned.startsWith('91')) {
            return cleaned; // Already has country code
          } else if (cleaned.length === 10) {
            return '91' + cleaned; // Add India country code
          }
          return cleaned;
        });

      if (phoneNumbers.length > 0) {
        try {
          console.log(`📞 Sending SMS via Fast2SMS to ${phoneNumbers.length} contacts...`);

          const response = await axios.post(
            FAST2SMS_ENDPOINT,
            {
              route: "q", // Quick route
              message: message,
              numbers: phoneNumbers.join(","),
            },
            {
              headers: {
                authorization: FAST2SMS_API_KEY,
              },
              timeout: 10000, // 10 second timeout
            }
          );

          console.log("✅ Fast2SMS Response:", response.data);

          // Check response status
          if (response.data.return === true) {
            contactsNotified = phoneNumbers.length;
            console.log(`✅ SMS sent successfully to ${contactsNotified} contacts`);
          } else {
            smsErrors.push(`Fast2SMS returned error: ${response.data.message || 'Unknown error'}`);
            console.error("❌ Fast2SMS error:", response.data);
          }
        } catch (err) {
          smsErrors.push(`Fast2SMS API error: ${err.message}`);
          console.error("❌ SMS sending failed:", err.message);
        }
      }
    }

    // 5. Send FCM push notifications to contacts who have the app installed
    const fcmTokens = contacts
      .map(c => c.fcmToken)
      .filter(Boolean);

    if (fcmTokens.length > 0 && admin.messaging) {
      try {
        const pushPayload = {
          notification: {
            title: '🚨 Emergency Alert',
            body: `${userName} has triggered an SOS and needs help immediately.`,
          },
          data: {
            trackingLink: trackingLink || '',
            mapsLink: mapsLink,
            uid: uid,
          },
          tokens: fcmTokens,
        };
        const pushResult = await admin.messaging().sendEachForMulticast(pushPayload);
        console.log(`📲 FCM push sent: ${pushResult.successCount}/${fcmTokens.length} delivered`);
      } catch (fcmErr) {
        console.error('FCM push failed (non-critical):', fcmErr.message);
      }
    }

    res.json({
      success: true,
      contactsNotified,
      smsErrors: smsErrors.length > 0 ? smsErrors : undefined,
    });
  } catch (error) {
    console.error("Critical error in sendSOS:", error);
    res.status(500).json({ error: "Failed to send SOS" });
  }
});

// Live Tracking Receiver
exports.updateLocation = functions.https.onRequest(async (req, res) => {
  // CORS setup
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  try {
    const { uid, location } = req.body;

    if (!uid || !location) {
      return res.status(400).json({ error: "Missing uid or location" });
    }

    await db.collection("liveLocations").doc(uid).set({
      location,
      updatedAt: Date.now(),
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Live track update failed:", error);
    res.status(500).json({ error: "Location update failed" });
  }
});
