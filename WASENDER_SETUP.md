# WaSender API Setup Guide

## Quick Setup

### 1. Create WaSender Account
1. Go to [https://wasenderapi.com](https://wasenderapi.com)
2. Sign up for an account
3. Choose a plan (they have a free tier for testing)

### 2. Connect Your WhatsApp
1. After logging in, go to **Sessions** → **Create Session**
2. Scan the QR code with your WhatsApp
3. Note down your **Session ID** (e.g., `default` or custom name)

### 3. Get Your API Key
1. Go to **Settings** → **Personal Access Token**
2. Create a new token
3. Copy the API key (starts with `was_...`)

### 4. Set Supabase Secrets

Run these commands in your terminal:

```bash
supabase secrets set WASENDER_API_KEY=your_api_key_here
supabase secrets set WASENDER_SESSION_ID=your_session_id_here
```

Replace:
- `your_api_key_here` with your actual WaSender API key
- `your_session_id_here` with your session ID (usually `default`)

### 5. Test the Integration

1. Create a test signal in your admin panel
2. Check if you receive the WhatsApp message
3. Check the Edge Function logs in Supabase Dashboard

## API Details

**Endpoint**: `https://api.wasenderapi.com/api/send-message`

**Request Format**:
```json
{
  "session": "your_session_id",
  "to": "255712345678",  // Phone number without +
  "text": "Your message here"
}
```

**Headers**:
```
Authorization: Bearer your_api_key
Content-Type: application/json
```

## Switching Back to Twilio

The Twilio code is commented out in the Edge Function. To switch back:

1. Uncomment the Twilio code in `supabase/functions/send-whatsapp-notification/index.ts`
2. Comment out the WaSender code
3. Redeploy: `supabase functions deploy send-whatsapp-notification`
4. Set Twilio secrets:
   ```bash
   supabase secrets set TWILIO_ACCOUNT_SID=your_sid
   supabase secrets set TWILIO_AUTH_TOKEN=your_token
   supabase secrets set TWILIO_WHATSAPP_NUMBER=your_number
   ```

## Troubleshooting

### "WaSender API credentials not configured"
- Make sure you've set both `WASENDER_API_KEY` and `WASENDER_SESSION_ID`
- Verify with: `supabase secrets list`

### Message not received
- Check if your WhatsApp session is still connected in WaSender dashboard
- Verify the phone number format (no + sign, just digits with country code)
- Check Edge Function logs for errors

### Session disconnected
- Go to WaSender dashboard → Sessions
- Reconnect by scanning QR code again
- No need to change the session ID

## Pricing

WaSender offers:
- **Free tier**: Limited messages for testing
- **Paid plans**: Starting from $10/month for more messages
- Much cheaper than Twilio for high volume

Check current pricing at: https://wasenderapi.com/pricing
