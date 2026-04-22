/**
 * SMS Rate Limiter
 * Controls daily SMS limits to manage costs instead of relying on Fast2SMS pricing
 */

import axios from 'axios';
import { doc, getDoc, updateDoc, Timestamp, increment } from 'firebase/firestore';
import { db } from '../services/firebase.js';

// Daily SMS limit per user
const DAILY_SMS_LIMIT = 5; // SMS per day
const RESET_HOUR = 0; // Reset at midnight (UTC)

/**
 * Check if user has remaining SMS quota for today
 */
export const checkSMSQuota = async (userId) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return { allowed: false, reason: 'User not found' };
    }

    const smsData = userDoc.data().smsQuota || {};
    const lastReset = smsData.lastReset ? new Date(smsData.lastReset.toDate()) : new Date(0);

    let todaysSent = smsData.todaysSent || 0;

    // Reset if new day
    if (lastReset < today) {
      todaysSent = 0;
    }

    const remaining = DAILY_SMS_LIMIT - todaysSent;

    return {
      allowed: remaining > 0,
      remaining,
      limit: DAILY_SMS_LIMIT,
      used: todaysSent,
      reason: remaining > 0 ? null : `Daily SMS limit (${DAILY_SMS_LIMIT}/day) reached. Try again tomorrow.`,
    };
  } catch (error) {
    console.error('❌ Error checking SMS quota:', error);
    return { allowed: false, reason: error.message };
  }
};

/**
 * Send SMS via Fast2SMS (with rate limiting)
 */
export const sendSMSWithLimit = async (userId, phoneNumbers, message) => {
  try {
    // Check quota first
    const quotaCheck = await checkSMSQuota(userId);
    if (!quotaCheck.allowed) {
      console.log('📵 SMS blocked:', quotaCheck.reason);
      return {
        success: false,
        blocked: true,
        reason: quotaCheck.reason,
        remaining: quotaCheck.remaining,
      };
    }

    const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;
    if (!FAST2SMS_API_KEY) {
      throw new Error('Fast2SMS API key not configured');
    }

    // Send SMS via Fast2SMS
    const response = await axios({
      method: 'POST',
      url: 'https://www.fast2sms.com/dev/bulkV2',
      headers: {
        authorization: FAST2SMS_API_KEY,
        'Content-Type': 'application/json',
      },
      data: {
        route: 'q',
        message,
        language: 'english',
        flash: 0,
        numbers: phoneNumbers.join(','),
      },
    });

    // Check if SMS was actually sent
    const smsSent = response.data.return && response.data.return === 1;

    if (smsSent) {
      // Update quota in Firestore
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        'smsQuota.todaysSent': increment(1),
        'smsQuota.lastReset': Timestamp.fromDate(today),
        'smsQuota.lastSentAt': Timestamp.now(),
      });

      console.log(`✅ SMS sent to ${phoneNumbers.length} contacts. Quota used: 1/${DAILY_SMS_LIMIT}`);
      
      return {
        success: true,
        smsSent: 1,
        remaining: quotaCheck.remaining - 1,
        response: response.data,
      };
    } else {
      console.error('❌ Fast2SMS returned error:', response.data);
      return {
        success: false,
        reason: response.data.message || 'Fast2SMS error',
      };
    }
  } catch (error) {
    console.error('❌ Error sending SMS:', error);
    return {
      success: false,
      reason: error.message,
    };
  }
};

/**
 * Send SMS via alternative provider (free tier option)
 * Using Twilio trial account (free 50 SMS)
 */
export const sendSMSViaTwilio = async (userId, phoneNumbers, message) => {
  try {
    const quotaCheck = await checkSMSQuota(userId);
    if (!quotaCheck.allowed) {
      return {
        success: false,
        blocked: true,
        reason: quotaCheck.reason,
        remaining: quotaCheck.remaining,
      };
    }

    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    const TWILIO_PHONE = process.env.TWILIO_PHONE;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE) {
      throw new Error('Twilio credentials not configured');
    }

    let successCount = 0;

    // Send to each contact
    for (const phoneNumber of phoneNumbers) {
      try {
        const response = await axios.post(
          `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
          `From=${TWILIO_PHONE}&To=${phoneNumber}&Body=${encodeURIComponent(message)}`,
          {
            auth: {
              username: TWILIO_ACCOUNT_SID,
              password: TWILIO_AUTH_TOKEN,
            },
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );

        if (response.data.sid) {
          successCount++;
        }
      } catch (contactError) {
        console.error(`Failed to send to ${phoneNumber}:`, contactError.message);
      }
    }

    if (successCount > 0) {
      // Update quota
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        'smsQuota.todaysSent': increment(1),
        'smsQuota.lastReset': Timestamp.fromDate(today),
        'smsQuota.lastSentAt': Timestamp.now(),
      });

      console.log(`✅ Twilio: Sent to ${successCount}/${phoneNumbers.length} contacts`);
      
      return {
        success: true,
        smsSent: successCount,
        remaining: quotaCheck.remaining - 1,
      };
    } else {
      throw new Error('No SMS were sent');
    }
  } catch (error) {
    console.error('❌ Error sending SMS via Twilio:', error);
    return {
      success: false,
      reason: error.message,
    };
  }
};

/**
 * Get user's current SMS quota stats
 */
export const getSMSStats = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return { error: 'User not found' };
    }

    const smsData = userDoc.data().smsQuota || {};
    const lastSentAt = smsData.lastSentAt ? new Date(smsData.lastSentAt.toDate()) : null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      dailyLimit: DAILY_SMS_LIMIT,
      used: smsData.todaysSent || 0,
      remaining: DAILY_SMS_LIMIT - (smsData.todaysSent || 0),
      lastSent: lastSentAt,
      resetsAt: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Tomorrow at midnight
    };
  } catch (error) {
    console.error('❌ Error getting SMS stats:', error);
    return { error: error.message };
  }
};

/**
 * Admin function: Reset user's daily quota
 */
export const resetUserSMSQuota = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'smsQuota.todaysSent': 0,
      'smsQuota.lastReset': Timestamp.now(),
    });

    console.log(`✅ SMS quota reset for user: ${userId}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error resetting quota:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Admin function: Set custom daily limit
 */
export const setCustomSMSLimit = async (userId, newLimit) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'smsQuota.customLimit': newLimit,
    });

    console.log(`✅ Custom SMS limit set to ${newLimit} for user: ${userId}`);
    return { success: true, newLimit };
  } catch (error) {
    console.error('❌ Error setting custom limit:', error);
    return { success: false, error: error.message };
  }
};
