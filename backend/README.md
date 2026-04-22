# Senior Shield Backend - SOS Alert System

Backend service for triggering emergency SOS alerts via SMS using Fast2SMS API.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables
Copy `.env.example` to `.env` and add your Fast2SMS API key:

```bash
cp .env.example .env
```

Edit `.env` and add:
```
FAST2SMS_API_KEY=your_api_key_here
```

**Get your API key:** https://www.fast2sms.com/dashboard

### 3. Start Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server will start on `http://localhost:5000`

## 📚 API Endpoints

### ✅ Health Check
```
GET /health
```

### 🚨 Trigger SOS Alert
```
POST /api/sos/trigger
```

**Request Body:**
```json
{
  "userId": "user123",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "address": "Delhi, India",
  "alertType": "manual",
  "emergencyContacts": [
    { "name": "Mom", "phone": "9876543210" },
    { "name": "Dad", "phone": "9123456789" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "SOS alert sent successfully",
  "contactsNotified": 2,
  "fast2smsResponse": {...}
}
```

### 📜 Get SOS History
```
GET /api/sos/:userId
```

### 📞 Send Custom SMS
```
POST /api/send-sms
```

**Request Body:**
```json
{
  "numbers": ["9876543210", "9123456789"],
  "message": "Your emergency message"
}
```

## ⚠️ Important Notes

### Phone Number Format
✅ **Correct:**
- `9876543210` (10 digits for India)
- `1234567890` (10 digits for US)

❌ **Incorrect:**
- `+919876543210` (don't include country code)
- `+1-123-456-7890` (remove country code and dashes)

### CORS Configuration
CORS is already enabled for all origins. In production, restrict to your frontend domain:

```javascript
app.use(cors({
  origin: 'https://yourdomain.com'
}));
```

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `FAST2SMS_API_KEY` | Your Fast2SMS API key | `abc123xyz` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` or `production` |
| `FRONTEND_URL` | Frontend URL for tracking links | `http://localhost:5173` |

## 🐛 Troubleshooting

### Server won't start
- Check if port 5000 is already in use
- Try: `npm run dev`

### SMS not sending
- Verify `FAST2SMS_API_KEY` is correct
- Check phone numbers format (no country code)
- Check console logs for API errors

### CORS errors
- Make sure backend is running on correct port
- Verify frontend API URL matches

## 📦 Dependencies
- **express**: Web framework
- **axios**: HTTP client for Fast2SMS API
- **cors**: Enable CORS
- **dotenv**: Environment variable management

## 🚨 Fast2SMS API Limits
- Check your account for daily/monthly SMS limits
- Route 'q' = Quality route (recommended for SOS)
- Route 't' = Transactional (cheaper but slower)

## 📝 Production Deployment

Before deploying to production:
1. Set `NODE_ENV=production`
2. Restrict CORS to your frontend domain
3. Use environment-specific API keys
4. Add proper error logging (Winston, Sentry)
5. Add request validation/sanitization
6. Consider rate limiting
7. Add database integration for SOS history

## 📞 Support
For issues with Fast2SMS API: https://www.fast2sms.com/support
