# Fast2SMS Setup Guide for Senior Shield

## What Changed
✅ Switched from **Twilio** to **Fast2SMS** for SMS delivery
✅ Auto SMS now works without user action
✅ Cost-effective and supports India region

---

## Step 1: Get Fast2SMS API Key

1. Go to https://www.fast2sms.com
2. Sign up (free account available)
3. Get your **API Key** from dashboard
4. Note: Free tier includes trial credits

---

## Step 2: Configure Firebase Cloud Functions

### Option A: Using Firebase CLI

```bash
# Set the API key in Firebase config
firebase functions:config:set fast2sms.api_key="YOUR_API_KEY_HERE"

# Deploy
firebase deploy --only functions
```

### Option B: Using Environment Variables (Local Development)

Create `.env.local` in the `functions` folder:
```
FAST2SMS_API_KEY=YOUR_API_KEY_HERE
```

---

## Step 3: Deploy

```bash
# Install dependencies
cd functions
npm install

# Deploy functions
cd ..
firebase deploy --only functions
```

---

## Step 4: Test It

**Trigger SOS from your web app:**

1. Open https://senior-sheild-4ec1d.web.app
2. Go to Dashboard
3. Tap SOS button
4. Check if emergency contacts receive SMS automatically ✅

---

## Troubleshooting

### SMS Not Sending?

Check Cloud Functions logs:
```bash
firebase functions:log
```

Look for:
- ✅ "Fast2SMS Response:" → Success
- ❌ "SMS sending failed" → Check API key

### Common Issues

| Issue | Solution |
|-------|----------|
| API Key not found | Run: `firebase functions:config:set fast2sms.api_key="KEY"` |
| Rate limit | Fast2SMS has daily limits - check your plan |
| Invalid phone format | Ensure numbers include country code (e.g., 919876543210) |
| Network timeout | Check internet connection in Cloud Functions |

---

## API Response Codes

Fast2SMS returns:
```json
{
  "return": true,
  "request_id": "12345",
  "message": "SMS sent successfully",
  "balance": 450,
  "numbers": 1
}
```

---

## Cost Estimation

**Fast2SMS Pricing (India):**
- ~₹0.50-1.50 per SMS (varies)
- Free trial credits available
- Bulk discounts available

**Example:**
- 10 SOS alerts per month → ₹50-150/month
- Much cheaper than Twilio

---

## Features Enabled

✅ Auto SMS to emergency contacts on SOS  
✅ No manual action needed  
✅ Works even if app is closed (via backend)  
✅ Supports multiple recipients  
✅ Real tracking link included in SMS  

---

## Next Steps (Phase 2)

- [ ] Add SMS delivery receipt tracking
- [ ] Store SMS status in Firestore
- [ ] Add SMS retry logic (if delivery failed)
- [ ] Create SMS history log
- [ ] Add option to customize message template

---

## Important Notes

⚠️ **API Key Security:**
- Never commit API key to GitHub
- Use Firebase config secrets
- Rotate API keys periodically

⚠️ **Compliance:**
- Ensure GDPR/privacy compliance
- Inform users about SMS collection
- Store phone numbers securely

---

For support: https://www.fast2sms.com/support
