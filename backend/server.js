import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Environment variables
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || "YOUR_FAST2SMS_API_KEY";
const PORT = process.env.PORT || 5000;

/**
 * ✅ Health Check Endpoint
 */
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

/**
 * 🚨 SOS TRIGGER ENDPOINT
 * POST /api/sos/trigger
 * 
 * Body:
 * {
 *   userId: string,
 *   latitude: number,
 *   longitude: number,
 *   address: string (optional),
 *   alertType: string (manual | auto | fallDetected),
 *   emergencyContacts: [ { name: string, phone: string }, ... ]
 * }
 */
app.post("/api/sos/trigger", async (req, res) => {
  try {
    const { userId, latitude, longitude, address, alertType, emergencyContacts } = req.body;

    // Validate required fields
    if (!userId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: userId, latitude, longitude"
      });
    }

    if (!emergencyContacts || emergencyContacts.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No emergency contacts provided"
      });
    }

    const { userInfo } = req.body;

    // Build the SOS message with location information
    const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
    const trackingLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/track/${userId}`;
    
    // Build user info section
    let userInfoSection = '';
    if (userInfo) {
      userInfoSection = `\nPerson: ${userInfo.name}`;
      if (userInfo.age) userInfoSection += `, Age ${userInfo.age}`;
      if (userInfo.medicalCondition) userInfoSection += `\nMedical: ${userInfo.medicalCondition}`;
    }
    
    // Build location section with GPS coordinates
    let locationSection = `\n📍 LOCATION:\nCoordinates: ${latitude}, ${longitude}\nMaps: ${mapsLink}`;
    if (address) {
      locationSection += `\nAddress: ${address}`;
    }
    
    // Final message - includes all location details
    const sosMessage = `🚨 EMERGENCY ALERT! 🚨\n${userInfoSection}${locationSection}\n\nType: ${alertType}\n\nTrack Live: ${trackingLink}`;

    // Extract phone numbers and format them
    // Handle both object format { phone: "..." } and string format
    const phoneNumbers = emergencyContacts
      .map(contact => {
        // Handle both object and string formats
        const phone = typeof contact === 'string' ? contact : (contact?.phone || contact?.number);
        
        if (!phone) return null;
        
        // Convert to string
        const phoneStr = String(phone);
        
        // Remove +91, +1, or any other country code prefix
        let cleaned = phoneStr.replace(/^\+\d+/, '');
        
        // Remove any spaces, dashes, parentheses
        cleaned = cleaned.replace(/[\s\-()]/g, '');
        
        // Validate minimum length
        return cleaned.length >= 10 ? cleaned : null;
      })
      .filter(phone => phone !== null);

    if (phoneNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No valid phone numbers found"
      });
    }

    console.log("📱 Sending SOS to numbers:", phoneNumbers);
    console.log("📍 Location:", { latitude, longitude });
    console.log("📝 Message:", sosMessage);

    // Send SMS via Fast2SMS API - CORRECTED FORMAT
    try {
      // Verify API key is set
      if (!FAST2SMS_API_KEY || FAST2SMS_API_KEY === "YOUR_FAST2SMS_API_KEY") {
        return res.status(400).json({
          success: false,
          error: "Fast2SMS API key not configured. Please set FAST2SMS_API_KEY in .env file"
        });
      }

      const response = await axios({
        method: "POST",
        url: "https://www.fast2sms.com/dev/bulkV2",
        headers: {
          authorization: FAST2SMS_API_KEY,
          "Content-Type": "application/json",
        },
        data: {
          route: "q", // Quality route - important!
          message: sosMessage,
          language: "english",
          flash: 0, // Set to 0 for regular SMS
          numbers: phoneNumbers.join(","), // Must be joined string!
        },
      });

      console.log("✅ Fast2SMS Response:", response.data);

      res.json({
        success: true,
        message: "SOS alert sent successfully",
        contactsNotified: phoneNumbers.length,
        fast2smsResponse: response.data,
      });
    } catch (smsError) {
      console.error("❌ Fast2SMS API Error Details:");
      console.error("Status:", smsError.response?.status);
      console.error("Data:", smsError.response?.data);
      console.error("Message:", smsError.message);
      
      res.status(500).json({
        success: false,
        error: "Failed to send SMS",
        details: smsError.response?.data || smsError.message,
        debugInfo: {
          status: smsError.response?.status,
          message: smsError.message,
        },
        contactsAttempted: phoneNumbers.length
      });
    }
  } catch (error) {
    console.error("❌ SOS Trigger Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error"
    });
  }
});

/**
 * 📜 GET SOS HISTORY ENDPOINT
 * GET /api/sos/:userId
 * 
 * Returns SOS history for a user (Note: requires database integration)
 */
app.get("/api/sos/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // TODO: Query database for SOS history
    // This is a placeholder - integrate with your Firestore/MongoDB
    res.json({
      success: true,
      userId,
      message: "SOS history endpoint - connect to your database",
      sosHistory: []
    });
  } catch (error) {
    console.error("❌ Get SOS History Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error"
    });
  }
});

/**
 * 📞 BULK SMS ENDPOINT (Alternative)
 * POST /api/send-sms
 * 
 * Body:
 * {
 *   numbers: ["9876543210", "9123456789"],
 *   message: "Your message here"
 * }
 */
app.post("/api/send-sms", async (req, res) => {
  try {
    const { numbers, message } = req.body;

    if (!numbers || !Array.isArray(numbers) || numbers.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid or empty numbers array"
      });
    }

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Message cannot be empty"
      });
    }

    // Format phone numbers
    const formattedNumbers = numbers
      .map(num => num.replace(/^\+\d+/, '').replace(/[\s\-]/g, ''))
      .filter(num => num.length > 0);

    if (formattedNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No valid phone numbers found"
      });
    }

    // Verify API key
    if (!FAST2SMS_API_KEY || FAST2SMS_API_KEY === "YOUR_FAST2SMS_API_KEY") {
      return res.status(400).json({
        success: false,
        error: "Fast2SMS API key not configured"
      });
    }

    // CORRECTED FORMAT for Fast2SMS API
    const response = await axios({
      method: "POST",
      url: "https://www.fast2sms.com/dev/bulkV2",
      headers: {
        authorization: FAST2SMS_API_KEY,
        "Content-Type": "application/json",
      },
      data: {
        route: "q",
        message: message,
        language: "english",
        flash: 0,
        numbers: formattedNumbers.join(","),
      },
    });

    console.log("✅ SMS sent to", formattedNumbers.length, "contact(s)");

    res.json({
      success: true,
      message: "SMS sent successfully",
      contactsSent: formattedNumbers.length,
      fast2smsResponse: response.data,
    });
  } catch (error) {
    console.error("❌ Send SMS Error:");
    console.error("Status:", error.response?.status);
    console.error("Data:", error.response?.data);
    console.error("Message:", error.message);

    res.status(500).json({
      success: false,
      error: error.message || "Failed to send SMS",
      details: error.response?.data,
      debugInfo: {
        status: error.response?.status,
      }
    });
  }
});

/**
 * ⚠️ ERROR HANDLING
 */
app.use((err, req, res, next) => {
  console.error("❌ Unhandled Error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: err.message
  });
});

/**
 * 🚀 START SERVER
 */
app.listen(PORT, () => {
  console.log(`
    ╔══════════════════════════════════════╗
    ║  🚨 Senior Shield SOS Backend Ready  ║
    ║  Server running on port ${PORT}        ║
    ║  FAST2SMS API Key: ${FAST2SMS_API_KEY ? '✅ Configured' : '❌ NOT SET'}   ║
    ╚══════════════════════════════════════╝
  `);
  console.log(`📍 API Base URL: http://localhost:${PORT}`);
  console.log(`📚 Endpoints:`);
  console.log(`   ✅ GET  /health`);
  console.log(`   🚨 POST /api/sos/trigger`);
  console.log(`   📜 GET  /api/sos/:userId`);
  console.log(`   📞 POST /api/send-sms`);
});
