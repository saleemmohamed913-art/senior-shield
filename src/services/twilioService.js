/**
 * Twilio SMS Service
 * Sends SMS alerts to emergency contacts
 * 
 * NOTE: For security, SMS sending should be routed through a Cloud Function
 * Direct API calls from frontend are not recommended
 * 
 * This file shows the integration pattern
 */

/**
 * Send SOS Alert via SMS using Cloud Function
 * 
 * This calls a Firebase Cloud Function that handles Twilio integration
 * The function must be deployed separately (see FIREBASE_SETUP.md)
 */
export const sendSOSAlert = async (phoneNumber, message, userInfo) => {
  try {
    // Get the Cloud Function URL from environment
    const cloudFunctionUrl = import.meta.env.VITE_CLOUD_FUNCTION_URL;
    
    if (!cloudFunctionUrl) {
      console.warn("⚠️ Cloud Function URL not set. SMS alerts disabled.");
      return {
        success: false,
        message: "Cloud Function not configured",
      };
    }

    // Call Firebase Cloud Function to send SMS
    const response = await fetch(cloudFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: phoneNumber,
        message,
        userInfo, // Include user info for context
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to send SMS");
    }

    console.log(`✅ SMS sent to ${phoneNumber}`);
    return {
      success: true,
      message: "SMS sent successfully",
      data,
    };
  } catch (error) {
    console.error("❌ Error sending SMS:", error);
    // Don't throw - allow SOS to continue even if SMS fails
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Alternative: Send SMS using Backend Service
 * 
 * If you have a backend server, use this instead:
 * 
 * export const sendSOSAlert = async (phoneNumber, message, userInfo) => {
 *   try {
 *     const backendUrl = import.meta.env.VITE_API_URL;
 *     
 *     const response = await fetch(`${backendUrl}/send-sms`, {
 *       method: "POST",
 *       headers: { "Content-Type": "application/json" },
 *       body: JSON.stringify({
 *         to: phoneNumber,
 *         message,
 *         userInfo,
 *       }),
 *     });
 *     
 *     const data = await response.json();
 *     return data;
 *   } catch (error) {
 *     console.error("Error sending SMS:", error);
 *     return { success: false, error: error.message };
 *   }
 * };
 */
