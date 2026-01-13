# Rate Limit & Error Handling Improvements

## Issues Identified from Console Logs

### 1. **Rate Limiting (429 Errors)** ⚠️ CRITICAL
- **Problem**: 19 out of 23 messages failed with HTTP 429 (Too Many Requests)
- **Root Cause**: 
  - Batch size too large (15 messages)
  - Delay between batches too short (1.5 seconds)
  - Retry delays too short for rate limits (1s, 2s, 4s)
  - Wasender free tier has very strict rate limits

### 2. **Empty Error Objects** 🐛
- **Problem**: Some failures showed `{"success":false,"error":{}}`
- **Root Cause**: Not extracting error messages from Wasender API responses

### 3. **Admin Check Spam** 📊
- **Problem**: Admin check logged 14+ times in console
- **Root Cause**: Console.log in production code

## Fixes Implemented

### 1. Rate Limiting Improvements ✅

**Reduced Batch Size:**
- Changed from `15` → `5` messages per batch
- Prevents overwhelming Wasender API

**Increased Delays:**
- Batch delay: `1.5s` → `3s` between batches
- Retry delays: `1s, 2s, 4s` → `5s, 10s, 20s` for general errors
- **NEW**: Special rate limit delays: `10s, 30s, 60s` for 429 errors

**Smart Retry Logic:**
- Checks for `Retry-After` header from Wasender API
- Uses header value if available, otherwise uses exponential backoff
- Longer waits specifically for rate limit errors

### 2. Error Message Extraction ✅

**Before:**
```typescript
error: result.error_message || result.error || result.error_code
// Often returned empty object {}
```

**After:**
```typescript
// Extracts error from multiple possible fields
const errorMessage = data.error || data.error_message || data.message || 
    (data.error_code ? `Error code: ${data.error_code}` : null) ||
    (response.status === 429 ? 'Rate limit exceeded' : null) ||
    (response.status >= 400 ? `HTTP ${response.status}` : null);
```

**Benefits:**
- Always provides meaningful error messages
- Identifies rate limit errors clearly
- Helps with debugging

### 3. Enhanced Reporting ✅

**New Response Fields:**
```json
{
  "success": true,
  "totalSubscribers": 23,
  "totalAttempted": 23,
  "successCount": 4,
  "failureCount": 19,
  "rateLimitFailures": 19,  // NEW: Specific count
  "otherFailures": 0,        // NEW: Non-rate-limit failures
  "warning": "19 messages failed due to rate limiting..." // NEW: Helpful message
}
```

**Benefits:**
- Clear breakdown of failure types
- Actionable warning messages
- Better admin feedback

### 4. Admin Check Logging ✅

**Before:**
```typescript
console.log("Admin check result:", {...}); // Always logs
```

**After:**
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log("Admin check result:", {...}); // Only in dev
}
```

**Benefits:**
- Reduces console spam in production
- Still available for debugging

## Configuration Summary

### Current Settings (Conservative for Free Tier)
```typescript
BATCH_SIZE = 5              // 5 messages per batch
BATCH_DELAY_MS = 3000       // 3 seconds between batches
MAX_RETRIES = 3             // 3 retry attempts
RETRY_DELAYS = [5s, 10s, 20s]           // General retries
RATE_LIMIT_RETRY_DELAYS = [10s, 30s, 60s] // Rate limit retries
```

### For 23 Subscribers
- **Batches**: 5 batches (5, 5, 5, 5, 3)
- **Total Time**: ~12-15 seconds (with delays)
- **Much slower but avoids rate limits**

## Recommendations

### Immediate Actions
1. ✅ **Deploy the updated function** - Already implemented
2. ⚠️ **Monitor first few sends** - Check if rate limits still occur
3. 📊 **Review Wasender dashboard** - Compare sent vs. attempted

### If Still Hitting Rate Limits

**Option 1: Further Reduce Batch Size**
```typescript
const BATCH_SIZE = 3; // Even more conservative
const BATCH_DELAY_MS = 5000; // 5 seconds between batches
```

**Option 2: Upgrade Wasender Plan**
- Free tier has very strict limits
- Paid plans offer higher rate limits
- Check: https://wasenderapi.com/pricing

**Option 3: Implement Queue System**
- Queue messages instead of sending immediately
- Process queue with rate limit awareness
- More complex but handles any volume

### Monitoring

**Check Edge Function Logs For:**
- Rate limit failures count
- Retry attempts
- Actual Wasender API responses
- Success rate trends

**Expected Behavior:**
- First batch: 5 messages sent successfully
- Wait 3 seconds
- Second batch: 5 messages sent successfully
- Continue...
- If rate limited: Wait 10-60 seconds before retry

## Testing Checklist

- [ ] Deploy updated function
- [ ] Send test signal to small group (5-10 users)
- [ ] Verify no 429 errors
- [ ] Check error messages are meaningful
- [ ] Verify admin console is cleaner
- [ ] Monitor Wasender dashboard matches function response
- [ ] Test with full subscriber list (23 users)

## Next Steps

1. **Deploy**: `supabase functions deploy send-whatsapp-notification`
2. **Test**: Create a test signal and monitor
3. **Adjust**: If still hitting limits, reduce batch size further
4. **Upgrade**: Consider Wasender plan upgrade for production use
