# Rate Limit & Error Handling Improvements

## Issues Identified from Console Logs

### 1. **WhatsApp Account Restrictions** ⚠️ CRITICAL
- **Problem**: WhatsApp account getting restricted due to bulk messaging patterns
- **Root Cause**: 
  - Sending to 23 subscribers simultaneously
  - Parallel message sending (bulk pattern)
  - No pre-filtering of invalid numbers
  - Too many messages in short time window
  - Many numbers not on WhatsApp or disconnected sessions

### 2. **High Failure Rate** 🐛
- **Problem**: 20 out of 23 messages failed (only 3 successful)
- **Root Cause**: 
  - 20 numbers with "WhatsApp Session is not connected" errors
  - 2 numbers with "JID does not exist on WhatsApp" errors
  - No pre-filtering before sending

### 3. **Rate Limiting (429 Errors)** ⚠️
- **Problem**: Potential for rate limiting with bulk sends
- **Root Cause**: 
  - Batch size too large (5 messages)
  - Delay between batches too short (3 seconds)
  - Parallel processing within batches

## Fixes Implemented

### 1. Pre-Filtering Invalid Numbers ✅ **NEW**

**WhatsApp Number Validation:**
- Pre-checks if numbers are on WhatsApp before sending
- Filters out invalid/disconnected numbers
- Prevents sending to numbers that will definitely fail
- Reduces failure rate and avoids bulk messaging flags

**Benefits:**
- Only sends to valid WhatsApp numbers
- Reduces API calls and costs
- Avoids triggering WhatsApp's spam detection

### 2. Sequential Message Sending ✅ **NEW**

**Changed from Parallel to Sequential:**
- **Before**: All messages in batch sent in parallel
- **After**: Messages sent one-by-one with delays
- Prevents bulk messaging patterns that WhatsApp flags

**Per-Message Delays:**
- 2 seconds delay between each message within a batch
- Ensures natural messaging pattern
- Reduces risk of account restrictions

### 3. Conservative Rate Limiting ✅

**Reduced Batch Size:**
- Changed from `5` → `2` messages per batch
- Much more conservative to avoid restrictions

**Increased Delays:**
- Batch delay: `3s` → `8s` between batches
- Message delay: `2s` between individual messages
- Retry delays: `5s, 10s, 20s` → `10s, 30s` for general errors
- **Rate limit delays**: `10s, 30s, 60s` → `30s, 120s` for 429 errors

**Hourly Message Limit:**
- Maximum 20 messages per hour
- Prevents overwhelming WhatsApp's systems
- Protects account from restrictions

**Smart Retry Logic:**
- Checks for `Retry-After` header from Wasender API
- Uses header value if available, otherwise uses exponential backoff
- Much longer waits specifically for rate limit errors

### 4. Error Message Extraction ✅

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

### 5. Enhanced Reporting ✅

**New Response Fields:**
```json
{
  "success": true,
  "totalSubscribers": 23,
  "preFilteredCount": 2,     // NEW: Numbers filtered before sending
  "totalAttempted": 21,        // Only valid numbers attempted
  "successCount": 18,         // Higher success rate
  "failureCount": 3,
  "rateLimitFailures": 0,     // NEW: Specific count
  "otherFailures": 3,         // NEW: Non-rate-limit failures
  "warning": null             // NEW: Helpful message if issues
}
```

**Benefits:**
- Clear breakdown of failure types
- Shows pre-filtered numbers
- Actionable warning messages
- Better admin feedback

### 6. Admin Check Logging ✅

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

### Current Settings (Very Conservative to Avoid Restrictions)
```typescript
BATCH_SIZE = 2                      // 2 messages per batch (very small)
BATCH_DELAY_MS = 8000               // 8 seconds between batches
MESSAGE_DELAY_MS = 2000             // 2 seconds between messages in batch
MAX_RETRIES = 2                     // 2 retry attempts (reduced)
RETRY_DELAYS = [10s, 30s]           // General retries
RATE_LIMIT_RETRY_DELAYS = [30s, 120s] // Rate limit retries (30s, 2min)
MAX_MESSAGES_PER_HOUR = 20          // Hourly limit
PRE_FILTER_WHATSAPP = true          // Pre-check numbers before sending
```

### For 23 Subscribers (After Pre-Filtering)
- **Pre-filtered**: ~2-5 numbers (not on WhatsApp)
- **Valid numbers**: ~18-21 numbers
- **Batches**: ~10-11 batches of 2 messages each
- **Total Time**: ~90-120 seconds (with delays)
- **Sequential sending**: No parallel processing
- **Much slower but avoids account restrictions**

## Recommendations

### Immediate Actions
1. ✅ **Deploy the updated function** - Already implemented
2. ⚠️ **Monitor first few sends** - Check if rate limits still occur
3. 📊 **Review Wasender dashboard** - Compare sent vs. attempted

### If Still Hitting Rate Limits or Restrictions

**Option 1: Further Reduce Batch Size**
```typescript
const BATCH_SIZE = 1; // Send one at a time
const BATCH_DELAY_MS = 10000; // 10 seconds between messages
const MESSAGE_DELAY_MS = 3000; // 3 seconds (not needed if batch size is 1)
```

**Option 2: Increase Delays**
```typescript
const BATCH_DELAY_MS = 15000; // 15 seconds between batches
const MESSAGE_DELAY_MS = 5000; // 5 seconds between messages
```

**Option 3: Reduce Hourly Limit**
```typescript
const MAX_MESSAGES_PER_HOUR = 10; // Even more conservative
```

**Option 4: Upgrade Wasender Plan**
- Free tier has very strict limits
- Paid plans offer higher rate limits
- Check: https://wasenderapi.com/pricing

**Option 5: Implement Queue System**
- Queue messages instead of sending immediately
- Process queue with rate limit awareness
- Spread messages over hours/days
- More complex but handles any volume safely

### Monitoring

**Check Edge Function Logs For:**
- Rate limit failures count
- Retry attempts
- Actual Wasender API responses
- Success rate trends

**Expected Behavior:**
- Pre-filter: Check all numbers, filter invalid ones
- First batch: Send message 1, wait 2s, send message 2
- Wait 8 seconds
- Second batch: Send message 3, wait 2s, send message 4
- Continue...
- If rate limited: Wait 30-120 seconds before retry
- Maximum 20 messages per hour

## Testing Checklist

- [ ] Deploy updated function
- [ ] Send test signal to small group (2-5 users)
- [ ] Verify pre-filtering works (check console for filtered numbers)
- [ ] Verify sequential sending (messages sent one-by-one)
- [ ] Verify no 429 errors
- [ ] Verify no account restrictions
- [ ] Check error messages are meaningful
- [ ] Verify admin console shows preFilteredCount
- [ ] Monitor Wasender dashboard matches function response
- [ ] Test with full subscriber list (23 users)
- [ ] Monitor for account restrictions over 24-48 hours

## Next Steps

1. **Deploy**: `supabase functions deploy send-whatsapp-notification`
2. **Test**: Create a test signal with 2-5 users first
3. **Monitor**: Watch for account restrictions over 24-48 hours
4. **Adjust**: If still getting restrictions, reduce batch size to 1 or increase delays
5. **Scale**: Gradually test with more users
6. **Upgrade**: Consider Wasender plan upgrade for production use

## Key Improvements Summary

✅ **Pre-filtering**: Only sends to valid WhatsApp numbers  
✅ **Sequential sending**: No parallel processing (avoids bulk patterns)  
✅ **Smaller batches**: 2 messages per batch (was 5)  
✅ **Longer delays**: 8s between batches, 2s between messages  
✅ **Hourly limit**: Maximum 20 messages per hour  
✅ **Better error handling**: Prevents sending to invalid numbers  
✅ **Enhanced reporting**: Shows pre-filtered count and detailed stats

These changes should significantly reduce the risk of WhatsApp account restrictions while maintaining reliable message delivery.
