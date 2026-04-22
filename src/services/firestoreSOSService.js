import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  Timestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";
import { getEmergencyContacts } from "./firestoreContactsService";
import { sendSOSAlert } from "./twilioService";

/**
 * Trigger SOS Alert - Send SMS to all emergency contacts
 */
export const triggerSOSAlert = async (userId, latitude, longitude, address = "") => {
  try {
    // 1. Get user info
    const { currentUser, userProfile } = (await import("../contexts/AuthContext")).useAuth();
    
    if (!userProfile) {
      throw new Error("User profile not found");
    }

    // 2. Get all emergency contacts
    const contactsResult = await getEmergencyContacts(userId);
    if (!contactsResult.success || contactsResult.data.length === 0) {
      throw new Error("No emergency contacts found");
    }

    const contacts = contactsResult.data;

    // 3. Create maps link
    const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;

    // 4. Create message
    const message = `🚨 EMERGENCY ALERT!\n\n${userProfile.name} needs help!\n\nLocation: ${address || `${latitude}, ${longitude}`}\n\nGoogle Maps: ${mapsLink}\n\nPlease call 911 or reply immediately.`;

    // 5. Send SMS to all contacts
    let messagesSent = 0;
    for (const contact of contacts) {
      try {
        await sendSOSAlert(contact.phone, message, userProfile);
        messagesSent++;
      } catch (smsError) {
        console.error(`Failed to send SMS to ${contact.name}:`, smsError);
      }
    }

    // 6. Save SOS alert to Firestore
    const sosRef = await addDoc(collection(db, "sos_alerts"), {
      userId,
      location: {
        latitude,
        longitude,
        address,
        mapsLink,
      },
      contacts: contacts.map((c) => c.id),
      alertType: "manual",
      status: "active",
      messagesSent,
      userInfo: {
        name: userProfile.name,
        phone: userProfile.phone,
        age: userProfile.age,
        medicalCondition: userProfile.medicalCondition,
      },
      createdAt: Timestamp.now(),
    });

    console.log(`✅ SOS Alert triggered! ${messagesSent} SMS(s) sent`);

    return {
      success: true,
      message: `SOS alert sent to ${messagesSent} contacts!`,
      data: {
        id: sosRef.id,
        messagesSent,
        location: { latitude, longitude, address },
      },
    };
  } catch (error) {
    console.error("❌ Error triggering SOS:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get SOS Alert History for User
 */
export const getSOSHistory = async (userId) => {
  try {
    const q = query(
      collection(db, "sos_alerts"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const querySnapshot = await getDocs(q);
    const alerts = [];

    querySnapshot.forEach((doc) => {
      alerts.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log(`✅ Retrieved ${alerts.length} SOS alerts`);
    return {
      success: true,
      data: alerts,
      count: alerts.length,
    };
  } catch (error) {
    console.error("❌ Error getting SOS history:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Update SOS Alert Status
 */
export const updateSOSStatus = async (alertId, status) => {
  try {
    const validStatuses = ["active", "acknowledged", "resolved"];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }

    const alertRef = doc(db, "sos_alerts", alertId);
    await updateDoc(alertRef, {
      status,
      updatedAt: Timestamp.now(),
    });

    console.log(`✅ Alert status updated to ${status}`);
    return {
      success: true,
      message: `Alert status updated to ${status}`,
    };
  } catch (error) {
    console.error("❌ Error updating SOS status:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get Active SOS Alert
 */
export const getActiveSOSAlert = async (userId) => {
  try {
    const q = query(
      collection(db, "sos_alerts"),
      where("userId", "==", userId),
      where("status", "==", "active"),
      limit(1)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return {
        success: true,
        data: null,
        message: "No active SOS alert",
      };
    }

    const alert = {
      id: querySnapshot.docs[0].id,
      ...querySnapshot.docs[0].data(),
    };

    console.log("✅ Retrieved active SOS alert");
    return {
      success: true,
      data: alert,
    };
  } catch (error) {
    console.error("❌ Error getting active alert:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
