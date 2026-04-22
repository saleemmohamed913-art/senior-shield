import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  onSnapshot,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// ==================== USER PROFILE OPERATIONS ====================

/**
 * Create a new user profile in Firestore
 */
export const createUserProfile = async (uid, profileData) => {
  try {
    const userData = {
      uid,
      name: profileData.name || '',
      phone: profileData.phone || '',
      age: profileData.age || '',
      medicalCondition: profileData.medicalCondition || '',
      emergencyContacts: [],
      guardians: [],
      locationSharingEnabled: true,
      activityTrackingEnabled: true,
      fallDetectionEnabled: true,
      inactivityAlertEnabled: true,
      inactivityTimeout: 900000, // 15 minutes in ms
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await setDoc(doc(db, 'users', uid), userData);
    console.log('✅ User profile created:', uid);
    return { success: true, data: userData };
  } catch (error) {
    console.error('❌ Error creating profile:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (uid) => {
  try {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      console.log('📍 User profile not found, creating default:', uid);
      // Auto-create with default values
      const defaultProfile = {
        uid,
        name: '',
        phone: '',
        age: '',
        medicalCondition: '',
        emergencyContacts: [],
        guardians: [],
        locationSharingEnabled: true,
        activityTrackingEnabled: true,
        fallDetectionEnabled: true,
        inactivityAlertEnabled: true,
        inactivityTimeout: 900000,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      try {
        await setDoc(doc(db, 'users', uid), defaultProfile);
        console.log('✅ Default profile created for:', uid);
      } catch (createError) {
        // If creation fails due to permissions, still return the default profile
        // The document will be created on next write operation
        console.warn('⚠️ Could not persist default profile, returning in-memory:', createError.message);
      }
      
      return { success: true, data: defaultProfile };
    }
  } catch (error) {
    console.error('❌ Error getting profile:', error);
    // Return a basic profile even if Firestore fails, to unblock the app
    const fallbackProfile = {
      uid,
      name: '',
      phone: '',
      age: '',
      emergencyContacts: [],
      guardians: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    return { success: true, data: fallbackProfile, partial: true };
  }
};

/**
 * Update user profile (name, age, medical condition, settings)
 */
export const updateUserProfile = async (uid, updates) => {
  try {
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(doc(db, 'users', uid), updateData);
    console.log('✅ User profile updated:', uid);
    return { success: true, data: updateData };
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update user settings
 */
export const updateUserSettings = async (uid, settings) => {
  try {
    const updateData = {
      locationSharingEnabled: settings.locationSharingEnabled ?? true,
      activityTrackingEnabled: settings.activityTrackingEnabled ?? true,
      fallDetectionEnabled: settings.fallDetectionEnabled ?? true,
      inactivityAlertEnabled: settings.inactivityAlertEnabled ?? true,
      inactivityTimeout: settings.inactivityTimeout ?? 900000,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(doc(db, 'users', uid), updateData);
    console.log('✅ User settings updated:', uid);
    return { success: true, data: updateData };
  } catch (error) {
    console.error('❌ Error updating settings:', error);
    return { success: false, error: error.message };
  }
};

// ==================== EMERGENCY CONTACTS OPERATIONS ====================

/**
 * Add emergency contact to user profile
 */
export const addEmergencyContact = async (uid, contact) => {
  try {
    console.log('🔴 Adding emergency contact for UID:', uid, 'Contact:', contact);
    
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      console.log('❌ User profile not found');
      return { success: false, error: 'User profile not found' };
    }

    const userData = userDoc.data();
    const existingContacts = userData.emergencyContacts || [];
    
    if (existingContacts.length >= 10) {
      console.log('❌ Max contacts reached');
      return { success: false, error: 'Maximum 10 emergency contacts allowed' };
    }

    const newContact = {
      id: `contact_${Date.now()}`,
      name: contact.name.trim(),
      phone: contact.phone.trim(),
      relation: contact.relation?.trim() || 'Emergency Contact',
      addedAt: Timestamp.now(),
    };

    const updatedContacts = [...existingContacts, newContact];
    
    await updateDoc(userDocRef, { 
      emergencyContacts: updatedContacts,
      updatedAt: Timestamp.now(),
    });

    console.log('✅ Contact added successfully');
    return { success: true, data: newContact };
  } catch (error) {
    console.error('❌ Error adding contact:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all emergency contacts for user
 */
export const getEmergencyContacts = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) {
      return { success: false, error: 'User profile not found', data: [] };
    }

    const contacts = userDoc.data().emergencyContacts || [];
    console.log(`✅ Retrieved ${contacts.length} emergency contacts`);
    return { success: true, data: contacts };
  } catch (error) {
    console.error('❌ Error getting contacts:', error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Update emergency contact
 */
export const updateEmergencyContact = async (uid, contactId, updates) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: 'User profile not found' };
    }

    const contacts = userDoc.data().emergencyContacts || [];
    const updatedContacts = contacts.map(c => 
      c.id === contactId ? { ...c, ...updates, updatedAt: Timestamp.now() } : c
    );

    await updateDoc(userDocRef, { 
      emergencyContacts: updatedContacts,
      updatedAt: Timestamp.now(),
    });

    console.log('✅ Contact updated successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating contact:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete emergency contact
 */
export const removeEmergencyContact = async (uid, contactId) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: 'User profile not found' };
    }

    const existingContacts = userDoc.data().emergencyContacts || [];
    const updatedContacts = existingContacts.filter(c => c.id !== contactId);

    await updateDoc(userDocRef, { 
      emergencyContacts: updatedContacts,
      updatedAt: Timestamp.now(),
    });

    console.log('✅ Contact deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error removing contact:', error);
    return { success: false, error: error.message };
  }
};

// ==================== SOS HISTORY OPERATIONS ====================

/**
 * Log SOS alert to Firestore
 */
export const logSOS = async (uid, sosData) => {
  try {
    console.log('📝 Logging SOS to Firestore:', sosData);
    
    const sosRecord = {
      uid,
      status: sosData.status || 'completed',
      location: sosData.location || {},
      address: sosData.address || '',
      mapsLink: sosData.mapsLink || '',
      triggeredAt: sosData.triggeredAt || Timestamp.now(),
      triggeredBy: sosData.triggeredBy || 'user',
      contactsNotified: sosData.contactsNotified || 0,
      messagesSent: sosData.messagesSent || 0,
      userInfo: sosData.userInfo || {},
      error: sosData.error || null,
      attempts: sosData.attempts || 1,
    };

    const userDocRef = doc(db, 'users', uid);
    const sosRef = await addDoc(collection(userDocRef, 'sosHistory'), sosRecord);

    console.log('✅ SOS logged successfully');
    return { success: true, id: sosRef.id, data: sosRecord };
  } catch (error) {
    console.error('❌ Error logging SOS:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get SOS history for user
 */
export const getSOSHistory = async (uid, limitCount = 10) => {
  try {
    console.log('📜 Fetching SOS history for UID:', uid);
    
    const userDocRef = doc(db, 'users', uid);
    const q = query(
      collection(userDocRef, 'sosHistory'),
      orderBy('triggeredAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const sosHistory = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log('✅ SOS history fetched:', sosHistory.length, 'records');
    return { success: true, data: sosHistory };
  } catch (error) {
    console.error('❌ Error fetching SOS history:', error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Get specific SOS record
 */
export const getSOSRecord = async (uid, sosId) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const sosRef = doc(userDocRef, 'sosHistory', sosId);
    const snapshot = await getDoc(sosRef);
    
    if (!snapshot.exists()) {
      return { success: false, error: 'SOS record not found' };
    }

    return { success: true, data: { id: snapshot.id, ...snapshot.data() } };
  } catch (error) {
    console.error('❌ Error fetching SOS record:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update SOS record status
 */
export const updateSOSStatus = async (uid, sosId, status) => {
  try {
    const validStatuses = ['active', 'acknowledged', 'resolved', 'completed'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const userDocRef = doc(db, 'users', uid);
    const sosRef = doc(userDocRef, 'sosHistory', sosId);
    
    await updateDoc(sosRef, {
      status,
      updatedAt: Timestamp.now(),
    });

    console.log(`✅ SOS status updated to ${status}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating SOS status:', error);
    return { success: false, error: error.message };
  }
};

// ==================== GUARDIAN OPERATIONS ====================

/**
 * Add guardian for this user
 */
export const addGuardian = async (uid, guardianData) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: 'User profile not found' };
    }

    const guardians = userDoc.data().guardians || [];
    
    if (guardians.length >= 5) {
      return { success: false, error: 'Maximum 5 guardians allowed' };
    }

    const newGuardian = {
      id: `guardian_${Date.now()}`,
      name: guardianData.name.trim(),
      phone: guardianData.phone.trim(),
      relation: guardianData.relation?.trim() || 'Guardian',
      role: guardianData.role || 'monitor', // 'monitor' or 'primary'
      addedAt: Timestamp.now(),
    };

    const updatedGuardians = [...guardians, newGuardian];
    
    await updateDoc(userDocRef, { 
      guardians: updatedGuardians,
      updatedAt: Timestamp.now(),
    });

    console.log('✅ Guardian added successfully');
    return { success: true, data: newGuardian };
  } catch (error) {
    console.error('❌ Error adding guardian:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all guardians for user
 */
export const getGuardians = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) {
      return { success: false, error: 'User profile not found', data: [] };
    }

    const guardians = userDoc.data().guardians || [];
    return { success: true, data: guardians };
  } catch (error) {
    console.error('❌ Error getting guardians:', error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Update guardian information
 */
export const updateGuardian = async (uid, guardianId, updates) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: 'User profile not found' };
    }

    const guardians = userDoc.data().guardians || [];
    const updatedGuardians = guardians.map(g => 
      g.id === guardianId ? { ...g, ...updates, updatedAt: Timestamp.now() } : g
    );

    await updateDoc(userDocRef, { 
      guardians: updatedGuardians,
      updatedAt: Timestamp.now(),
    });

    console.log('✅ Guardian updated successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating guardian:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove guardian
 */
export const removeGuardian = async (uid, guardianId) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: 'User profile not found' };
    }

    const guardians = userDoc.data().guardians || [];
    const updatedGuardians = guardians.filter(g => g.id !== guardianId);

    await updateDoc(userDocRef, { 
      guardians: updatedGuardians,
      updatedAt: Timestamp.now(),
    });

    console.log('✅ Guardian removed successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error removing guardian:', error);
    return { success: false, error: error.message };
  }
};

// ==================== LOCATION TRACKING OPERATIONS ====================

/**
 * Save location snapshot to Firestore
 */
export const saveLocationSnapshot = async (uid, location) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    
    const locationRecord = {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy || null,
      address: location.address || '',
      timestamp: Timestamp.now(),
    };

    await addDoc(collection(userDocRef, 'locationHistory'), locationRecord);

    console.log('✅ Location snapshot saved');
    return { success: true, data: locationRecord };
  } catch (error) {
    console.error('❌ Error saving location:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get recent location snapshots
 */
export const getLocationHistory = async (uid, limitCount = 20) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const q = query(
      collection(userDocRef, 'locationHistory'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const locations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, data: locations };
  } catch (error) {
    console.error('❌ Error getting location history:', error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Get last known location
 */
export const getLastLocation = async (uid) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const q = query(
      collection(userDocRef, 'locationHistory'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { success: true, data: null };
    }

    const doc = snapshot.docs[0];
    return { success: true, data: { id: doc.id, ...doc.data() } };
  } catch (error) {
    console.error('❌ Error getting last location:', error);
    return { success: false, error: error.message };
  }
};

// ==================== ACTIVITY & PREFERENCES OPERATIONS ====================

/**
 * Update user preferences and settings
 */
export const updateUserPreferences = async (uid, preferences) => {
  try {
    const updateData = {
      preferences: {
        preferredLanguage: preferences.preferredLanguage || 'en',
        notificationsEnabled: preferences.notificationsEnabled ?? true,
        highContrast: preferences.highContrast ?? false,
        fontSize: preferences.fontSize || 'base',
        ...preferences,
      },
      updatedAt: Timestamp.now(),
    };

    await updateDoc(doc(db, 'users', uid), updateData);
    console.log('✅ User preferences updated');
    return { success: true, data: updateData };
  } catch (error) {
    console.error('❌ Error updating preferences:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Log user activity (for tracking inactivity)
 */
export const logActivity = async (uid, activityType = 'interaction') => {
  try {
    const userDocRef = doc(db, 'users', uid);
    
    const activity = {
      type: activityType,
      timestamp: Timestamp.now(),
    };

    await addDoc(collection(userDocRef, 'activityLog'), activity);
    console.log('✅ Activity logged');
    return { success: true };
  } catch (error) {
    console.error('❌ Error logging activity:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get last activity timestamp for user
 */
export const getLastActivityTime = async (uid) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const q = query(
      collection(userDocRef, 'activityLog'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { success: true, data: null };
    }

    const activity = snapshot.docs[0].data();
    return { success: true, data: activity.timestamp.toDate() };
  } catch (error) {
    console.error('❌ Error getting last activity:', error);
    return { success: false, error: error.message };
  }
};

// ==================== REAL-TIME TRACKING OPERATIONS ====================

/**
 * Create tracking session for guardian to view location
 */
export const createTrackingSession = async (uid, expiryMinutes = 60) => {
  try {
    const token = `token_${uid}_${Date.now()}`;
    const expiresAt = Date.now() + (expiryMinutes * 60 * 1000);

    const sessionData = {
      userId: uid,
      token,
      expiresAt,
      createdAt: Timestamp.now(),
    };

    const trackingRef = await addDoc(
      collection(db, 'trackingSessions'),
      sessionData
    );

    console.log('✅ Tracking session created');
    return { success: true, data: { sessionId: trackingRef.id, token } };
  } catch (error) {
    console.error('❌ Error creating tracking session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Validate tracking token for guardian access
 */
export const validateTrackingToken = async (uid, token) => {
  try {
    const q = query(
      collection(db, 'trackingSessions'),
      where('userId', '==', uid),
      where('token', '==', token)
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { valid: false, reason: 'Invalid token' };
    }

    const session = querySnapshot.docs[0].data();
    
    if (Date.now() > session.expiresAt) {
      return { valid: false, reason: 'Token has expired' };
    }

    return { valid: true, userId: session.userId };
  } catch (error) {
    console.error('❌ Error validating token:', error);
    return { valid: false, reason: error.message };
  }
};

/**
 * Get user's public name for display
 */
export const getUserPublicName = async (uid) => {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return snap.data().name || 'Unknown User';
  } catch (error) {
    console.error('❌ Error getting user name:', error);
    return null;
  }
};

// ==================== WATCH/SUBSCRIBE OPERATIONS ====================

/**
 * Subscribe to real-time user profile updates
 */
export const subscribeToUserProfile = (uid, callback) => {
  try {
    const unsubscribe = onSnapshot(doc(db, 'users', uid), (doc) => {
      if (doc.exists()) {
        callback({ success: true, data: doc.data() });
      } else {
        callback({ success: false, error: 'User not found' });
      }
    });
    return unsubscribe;
  } catch (error) {
    console.error('❌ Error subscribing to profile:', error);
    return null;
  }
};

/**
 * Subscribe to real-time SOS alerts
 */
export const subscribeToSOSAlerts = (uid, callback) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const q = query(
      collection(userDocRef, 'sosHistory'),
      orderBy('triggeredAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback({ success: true, data: alerts });
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('❌ Error subscribing to SOS alerts:', error);
    return null;
  }
};

/**
 * Subscribe to location updates
 */
export const subscribeToLocationUpdates = (uid, callback) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const q = query(
      collection(userDocRef, 'locationHistory'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const location = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data(),
        };
        callback({ success: true, data: location });
      }
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('❌ Error subscribing to location:', error);
    return null;
  }
};
