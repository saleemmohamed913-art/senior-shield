/**
 * Extract and validate phone numbers from various contact formats
 * Handles both object and string formats
 */
export const extractPhoneNumbers = (contacts) => {
  if (!contacts || !Array.isArray(contacts)) {
    return [];
  }

  return contacts
    .map(contact => {
      // Handle both object { phone: "..." } and string formats
      const phone = typeof contact === 'string' ? contact : contact?.phone || contact?.number;
      
      if (!phone) return null;
      
      // Convert to string if it's not already
      const phoneStr = String(phone);
      
      // Remove country codes (+91, +1, etc)
      const withoutCode = phoneStr.replace(/^\+\d+/, '');
      
      // Remove spaces, dashes, parentheses
      const cleaned = withoutCode.replace(/[\s\-()]/g, '');
      
      // Validate minimum length (10 digits for Indian numbers)
      return cleaned.length >= 10 ? cleaned : null;
    })
    .filter(phone => phone !== null);
};

/**
 * Format contact objects for API transmission
 * Ensures consistent structure for backend
 */
export const formatContactsForAPI = (contacts) => {
  if (!contacts || !Array.isArray(contacts)) {
    return [];
  }

  return contacts.map(contact => {
    if (typeof contact === 'string') {
      return { phone: contact };
    }
    return {
      name: contact.name || 'Unknown',
      phone: String(contact.phone || contact.number || ''),
    };
  });
};
