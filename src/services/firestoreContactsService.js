import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Add Emergency Contact to Firestore
 */
export const addEmergencyContact = async (userId, contactData) => {
  try {
    const docRef = await addDoc(collection(db, "emergency_contacts"), {
      userId,
      ...contactData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log("✅ Contact added successfully:", docRef.id);
    return {
      success: true,
      id: docRef.id,
      data: { id: docRef.id, ...contactData },
    };
  } catch (error) {
    console.error("❌ Error adding contact:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get All Emergency Contacts for User
 */
export const getEmergencyContacts = async (userId) => {
  try {
    const q = query(
      collection(db, "emergency_contacts"),
      where("userId", "==", userId)
    );

    const querySnapshot = await getDocs(q);
    const contacts = [];

    querySnapshot.forEach((doc) => {
      contacts.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log(`✅ Retrieved ${contacts.length} contacts`);
    return {
      success: true,
      data: contacts,
      count: contacts.length,
    };
  } catch (error) {
    console.error("❌ Error getting contacts:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Update Emergency Contact
 */
export const updateEmergencyContact = async (contactId, updateData) => {
  try {
    const contactRef = doc(db, "emergency_contacts", contactId);

    await updateDoc(contactRef, {
      ...updateData,
      updatedAt: Timestamp.now(),
    });

    console.log("✅ Contact updated successfully");
    return {
      success: true,
      data: { id: contactId, ...updateData },
    };
  } catch (error) {
    console.error("❌ Error updating contact:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Delete Emergency Contact
 */
export const deleteEmergencyContact = async (contactId) => {
  try {
    await deleteDoc(doc(db, "emergency_contacts", contactId));
    console.log("✅ Contact deleted successfully");
    return {
      success: true,
      message: "Contact deleted",
    };
  } catch (error) {
    console.error("❌ Error deleting contact:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
