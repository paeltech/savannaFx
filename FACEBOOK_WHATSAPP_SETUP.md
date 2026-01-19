npm run dev# Facebook WhatsApp Business API Setup Guide

This guide will help you set up the Facebook WhatsApp Business API (Graph API) for sending WhatsApp notifications in SavannaFX.

## Prerequisites

- Facebook Business Account
- WhatsApp Business Account
- Meta Business App
- Supabase project with Edge Functions enabled

## Step 1: Set Up Facebook WhatsApp Business API

### 1.1 Create Meta Business Account
1. Go to [Meta Business Suite](https://business.facebook.com/)
2. Create a Business Account if you don't have one
3. Verify your business information

### 1.2 Create Meta App
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Select **Business** as the app type
4. Fill in app details and create the app

### 1.3 Add WhatsApp Product
1. In your app dashboard, go to **Add Products**
2. Find **WhatsApp** and click **Set Up**
3. Follow the setup wizard

### 1.4 Get Phone Number ID
1. In your app dashboard, go to **WhatsApp** → **API Setup**
2. Find your **Phone number ID** (it's a long numeric ID)
3. Copy this ID - you'll need it for the environment variable

### 1.5 Get Access Token

**IMPORTANT**: The access token is different from the Phone Number ID. It's a long string that starts with something like `EAAB...` or `EAA...`.

#### Option 1: Temporary Token (For Testing)
1. In **WhatsApp** → **API Setup**, find **Temporary access token**
2. Click **Copy** to copy the token
3. **Note**: Temporary tokens expire after 24 hours

#### Option 2: Permanent Token (For Production)
1. Go to **Business Settings** → **Users** → **System Users**
2. Click **Add** to create a new system user
3. Give it a name (e.g., "WhatsApp API User")
4. Click **Create System User**
5. Click **Assign Assets** → Select your WhatsApp app
6. Assign permissions: `whatsapp_business_messaging`
7. Click **Generate New Token**
8. Select your app and the `whatsapp_business_messaging` permission
9. Click **Generate Token**
10. **Copy the token immediately** - you won't be able to see it again!

**Token Format**: Should look like `EAABwzLixnjYBO7ZC...` (long string, usually 200+ characters)

### 1.6 Get API Version
- The default API version is `v24.0`
- You can check available versions in the [Graph API Explorer](https://developers.facebook.com/tools/explorer/)

## Step 2: Configure Supabase

### 2.1 Set Environment Variables

Run these commands in your terminal:

```bash
supabase secrets set WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
supabase secrets set WHATSAPP_ACCESS_TOKEN=your_access_token_here
supabase secrets set WHATSAPP_API_VERSION=v24.0
```

Replace:
- `your_phone_number_id_here` with your Phone Number ID from Step 1.4
- `your_access_token_here` with your Access Token from Step 1.5
- `v24.0` with your desired API version (optional, defaults to v24.0)

### 2.2 Verify Secrets

Check that secrets are set correctly:

```bash
supabase secrets list
```

You should see:
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_API_VERSION` (optional)

### 2.3 Deploy Edge Function

Deploy the updated WhatsApp notification function:

```bash
supabase functions deploy send-whatsapp-notification
```

## Step 3: Test the Integration

### 3.1 Test with cURL

You can test the API directly using cURL:

```bash
curl 'https://graph.facebook.com/v24.0/<PHONE_NUMBER_ID>/messages' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -d '{
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "+255721000000",
    "type": "text",
    "text": {
      "preview_url": false,
      "body": "Hello from SavannaFX!"
    }
  }'
```

Replace:
- `<PHONE_NUMBER_ID>` with your Phone Number ID
- `<ACCESS_TOKEN>` with your Access Token
- `+255721000000` with a test phone number (must be registered in your WhatsApp Business account for testing)

### 3.2 Test via Admin Panel

1. Log in as an admin
2. Go to `/admin/signals`
3. Create a test signal
4. Check if WhatsApp messages are sent to subscribers
5. Check Edge Function logs in Supabase Dashboard

## Step 4: Production Setup

### 4.1 Message Templates (Required for Production)

Facebook requires message templates for production use:

1. Go to **WhatsApp** → **Message Templates**
2. Create a new template for signal notifications
3. Submit for approval (usually takes 24-48 hours)
4. Once approved, update the Edge Function to use templates

### 4.2 Webhook Setup (Optional but Recommended)

Set up webhooks to track message delivery status:

1. In your app dashboard, go to **WhatsApp** → **Configuration**
2. Set up webhook URL: `https://your-project.supabase.co/functions/v1/whatsapp-webhook`
3. Subscribe to `messages` events
4. Verify webhook token

### 4.3 Rate Limits & Performance

Facebook WhatsApp API has rate limits:
- **Tier 1**: 1,000 conversations per 24 hours
- **Tier 2**: 10,000 conversations per 24 hours
- **Tier 3**: 100,000 conversations per 24 hours

**Performance Optimization:**
- Messages are sent in batches of 10 in parallel
- 500ms delay between batches
- Automatic rate limit handling with retries
- For 85 subscribers: ~4-5 seconds total (vs 25-50 seconds sequential)

The Edge Function includes automatic rate limit handling with retries and optimized batch processing for faster delivery.

## API Details

**Endpoint**: `https://graph.facebook.com/v24.0/{PHONE_NUMBER_ID}/messages`

**Request Format**:
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "+255712345678",
  "type": "text",
  "text": {
    "preview_url": false,
    "body": "Your message here"
  }
}
```

**Headers**:
```
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json
```

**Response Format** (Success):
```json
{
  "messaging_product": "whatsapp",
  "contacts": [{
    "input": "+255712345678",
    "wa_id": "255712345678"
  }],
  "messages": [{
    "id": "wamid.xxx"
  }]
}
```

## Troubleshooting

### "WhatsApp API credentials not configured"
- Make sure you've set both `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_ACCESS_TOKEN`
- Verify with: `supabase secrets list`
- Redeploy the function after setting secrets

### "Invalid OAuth access token" or "Cannot parse access token"
- **Common Issue**: You may have set the access token to the same value as the Phone Number ID
- **Solution**: 
  1. Verify your secrets: `supabase secrets list`
  2. Check that `WHATSAPP_ACCESS_TOKEN` is different from `WHATSAPP_PHONE_NUMBER_ID`
  3. The access token should be a long string (200+ characters) starting with `EAAB...` or `EAA...`
  4. If you used a temporary token, it may have expired (tokens expire after 24 hours)
  5. Generate a new token from Meta Business Settings → System Users
  6. Update the secret: `supabase secrets set WHATSAPP_ACCESS_TOKEN=your_actual_token_here`
  7. Redeploy the function: `supabase functions deploy send-whatsapp-notification`

### "Invalid phone number"
- Phone numbers must be in E.164 format: `+[country code][number]`
- Example: `+255712345678` (Tanzania)
- Make sure the number is registered in your WhatsApp Business account

### "Rate limit exceeded"
- You've hit Facebook's rate limits
- The function automatically retries with exponential backoff
- Check your tier limits in Meta Business Settings

### Message not received
- Check Edge Function logs for errors
- Verify the phone number is correct and in E.164 format
- Ensure the recipient has opted in to receive messages
- For production, make sure you're using approved message templates

### Error Code 131047
- This means the recipient's phone number is not registered on WhatsApp
- Verify the phone number is correct
- The user must have WhatsApp installed and active

## Migration from WaSender

If you were previously using WaSender API:

1. Set up Facebook WhatsApp Business API (follow steps above)
2. Set the new environment variables
3. Deploy the updated function
4. Test with a small group first
5. Monitor logs for any issues

The new implementation sends individual messages instead of group messages, which provides better delivery tracking and compliance with WhatsApp policies.

## Cost Estimation

**Facebook WhatsApp Business API Pricing** (as of 2024):
- **Conversation-based pricing**: $0.005 - $0.09 per conversation
- **24-hour conversation window**: Multiple messages to the same user within 24 hours count as one conversation
- **Free tier**: 1,000 conversations per month (for eligible businesses)

**Example**:
- 100 subscribers
- 3 signals per day
- 30 days per month
- = 100 × 3 × 30 = 9,000 conversations/month
- = $45 - $810 per month (depending on conversation type)

## Support

If you encounter issues:
1. Check Supabase Edge Function logs
2. Review Meta Business Settings for API status
3. Check `notification_logs` table for delivery status
4. Verify all environment variables are set correctly

For Facebook support: [Meta Business Help Center](https://www.facebook.com/business/help)
For Supabase support: [Supabase Support](https://supabase.com/support)
