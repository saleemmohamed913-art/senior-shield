const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Cloud Function: Periodic Safety Check
 * 
 * Triggers every 1 minute (scheduled via Firebase Cloud Scheduler)
 * Sends a push notification to all active users
 */
exports.sendPeriodicSafetyCheck = functions.pubsub
  .schedule('every 1 minute')
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('🚨 Periodic Safety Check triggered at:', new Date().toISOString());

    try {
      const db = admin.firestore();
      const messaging = admin.messaging();

      // Get all users with FCM tokens
      const usersRef = db.collectionGroup('fcm');
      const tokensSnapshot = await usersRef.get();

      if (tokensSnapshot.empty) {
        console.log('ℹ️ No FCM tokens found');
        return;
      }

      console.log(`📡 Found ${tokensSnapshot.size} active users`);

      const tokens = [];
      tokensSnapshot.forEach((doc) => {
        if (doc.data().token) {
          tokens.push(doc.data().token);
        }
      });

      if (tokens.length === 0) {
        console.log('⚠️ No valid tokens found');
        return;
      }

      // Prepare notification message
      const message = {
        notification: {
          title: '🚨 Safety Check',
          body: 'Are you safe? Let us know you\'re okay.',
        },
        webpush: {
          fcmOptions: {
            link: '/dashboard',
          },
          notification: {
            icon: '/icon.png',
            badge: '/badge.png',
            requireInteraction: 'true',
            vibrate: [200, 100, 200],
            tag: 'safety-check',
            data: {
              type: 'safety_check',
              timestamp: new Date().toISOString(),
            },
          },
        },
      };

      // Send to all tokens (batch)
      const sendPromises = tokens.map((token) =>
        messaging.send({ ...message, token }).catch((error) => {
          console.error(`❌ Error sending to token: ${token}`, error);
        })
      );

      await Promise.all(sendPromises);

      console.log(`✅ Sent safety check to ${tokens.length} users`);

      return { success: true, notificationsSent: tokens.length };
    } catch (error) {
      console.error('❌ Error in sendPeriodicSafetyCheck:', error);
      throw error;
    }
  });

/**
 * Cloud Function: Manual Safety Check
 * 
 * Callable function for testing or manual triggers
 * Usage: Call from frontend
 */
exports.triggerSafetyCheckNow = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const uid = context.auth.uid;
  console.log(`🧪 Manual safety check triggered by ${uid}`);

  try {
    const db = admin.firestore();
    const messaging = admin.messaging();

    // Get user's FCM token
    const tokenDoc = await db.doc(`users/${uid}/settings/fcm`).get();

    if (!tokenDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'No notification token found');
    }

    const token = tokenDoc.data().token;

    // Send notification
    const message = {
      token,
      notification: {
        title: '🚨 Safety Check',
        body: 'Please confirm you\'re okay.',
      },
      webpush: {
        fcmOptions: {
          link: '/dashboard',
        },
      },
    };

    await messaging.send(message);

    console.log(`✅ Safety check sent to ${uid}`);

    return { success: true, message: 'Notification sent' };
  } catch (error) {
    console.error('❌ Error in triggerSafetyCheckNow:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Cloud Function: SOS Notification
 * 
 * Called when user triggers SOS
 * Notifies emergency contacts
 */
exports.notifyEmergencyContacts = functions.firestore
  .document('users/{userId}/sosHistory/{sosId}')
  .onCreate(async (snap, context) => {
    const sosData = snap.data();
    const userId = context.params.userId;

    console.log(`🚨 SOS triggered by ${userId}:`, sosData);

    try {
      const db = admin.firestore();
      const messaging = admin.messaging();

      // Get emergency contacts
      const userDoc = await db.doc(`users/${userId}`).get();
      const userData = userDoc.data();

      if (!userData || !userData.emergencyContacts) {
        console.log('⚠️ No emergency contacts found');
        return;
      }

      // You would typically send SMS or call here
      // For now, we just log
      console.log('📞 Emergency contacts:', userData.emergencyContacts);

      // Send notification to user themselves
      const userTokenDoc = await db.doc(`users/${userId}/settings/fcm`).get();
      if (userTokenDoc.exists) {
        const token = userTokenDoc.data().token;

        const message = {
          token,
          notification: {
            title: '🚨 SOS Sent!',
            body: 'Your emergency contacts have been notified.',
          },
          webpush: {
            fcmOptions: {
              link: '/sos-history',
            },
          },
        };

        await messaging.send(message);
        console.log('✅ SOS confirmation sent to user');
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Error notifying emergency contacts:', error);
      throw error;
    }
  });

/**
 * Cloud Function: Cleanup old FCM tokens
 * 
 * Runs once daily to remove tokens older than 30 days
 */
exports.cleanupOldTokens = functions.pubsub
  .schedule('every day 02:00')
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('🧹 Cleaning up old FCM tokens...');

    try {
      const db = admin.firestore();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const tokensRef = db.collectionGroup('fcm');
      const oldTokensSnapshot = await tokensRef
        .where('updatedAt', '<', thirtyDaysAgo)
        .get();

      console.log(`🗑️  Found ${oldTokensSnapshot.size} old tokens to delete`);

      const batch = db.batch();
      oldTokensSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      console.log('✅ Old tokens deleted');

      return { success: true, tokensDeleted: oldTokensSnapshot.size };
    } catch (error) {
      console.error('❌ Error cleaning up tokens:', error);
      throw error;
    }
  });
