// API Base URL - change to your backend URL in production
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Add Emergency Contact
 */
export const addEmergencyContact = async (userId, contactData) => {
  try {
    const response = await fetch(`${API_URL}/contacts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        ...contactData,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to add contact");
    }

    return data;
  } catch (error) {
    console.error("Error adding contact:", error);
    throw error;
  }
};

/**
 * Get User's Emergency Contacts
 */
export const getEmergencyContacts = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/contacts/${userId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch contacts");
    }

    return data;
  } catch (error) {
    console.error("Error fetching contacts:", error);
    throw error;
  }
};

/**
 * Update Emergency Contact
 */
export const updateEmergencyContact = async (contactId, contactData) => {
  try {
    const response = await fetch(`${API_URL}/contacts/${contactId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(contactData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to update contact");
    }

    return data;
  } catch (error) {
    console.error("Error updating contact:", error);
    throw error;
  }
};

/**
 * Delete Emergency Contact
 */
export const deleteEmergencyContact = async (contactId) => {
  try {
    const response = await fetch(`${API_URL}/contacts/${contactId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to delete contact");
    }

    return data;
  } catch (error) {
    console.error("Error deleting contact:", error);
    throw error;
  }
};
