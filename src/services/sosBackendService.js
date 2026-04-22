// API Base URL - change to your backend URL in production
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

import { formatContactsForAPI } from '../utils/phoneUtils';

/**
 * Trigger SOS Alert with Location and Emergency Contacts
 * @param {string} userId - User ID
 * @param {object} location - Location object { latitude, longitude }
 * @param {object} userProfile - User profile with emergencyContacts, name, age, medicalCondition
 * @param {string} alertType - Type of alert (manual, auto, fallDetected)
 */
export const triggerSOS = async (userId, location, userProfile, alertType = "manual") => {
  try {
    if (!location || location.latitude === undefined || location.longitude === undefined) {
      throw new Error("Location data is required");
    }

    if (!userProfile?.emergencyContacts || userProfile.emergencyContacts.length === 0) {
      throw new Error("No emergency contacts configured");
    }

    // Build user info object for message
    const userInfo = {
      name: userProfile.name || "User",
      age: userProfile.age || null,
      medicalCondition: userProfile.medicalCondition || null,
    };

    // Format emergency contacts for API (extract phone numbers and validate)
    const formattedContacts = formatContactsForAPI(userProfile.emergencyContacts);
    
    console.log('📞 Raw contacts:', userProfile.emergencyContacts);
    console.log('📞 Formatted contacts for API:', formattedContacts);

    const response = await fetch(`${API_URL}/sos/trigger`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || "",
        alertType,
        emergencyContacts: formattedContacts, // Send formatted contacts
        userInfo, // Include user info in the message
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to trigger SOS");
    }

    return { success: true, ...data };
  } catch (error) {
    console.error("❌ Error triggering SOS:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get SOS History for User
 */
export const getSOSHistory = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/sos/${userId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch SOS history");
    }

    return data;
  } catch (error) {
    console.error("Error fetching SOS history:", error);
    throw error;
  }
};

/**
 * Get Active SOS Alert
 */
export const getActiveSOSAlert = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/sos/${userId}/active`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch active alert");
    }

    return data;
  } catch (error) {
    console.error("Error fetching active alert:", error);
    throw error;
  }
};

/**
 * Update SOS Alert Status
 */
export const updateSOSAlertStatus = async (alertId, status) => {
  try {
    const response = await fetch(`${API_URL}/sos/${alertId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to update alert status");
    }

    return data;
  } catch (error) {
    console.error("Error updating alert status:", error);
    throw error;
  }
};
