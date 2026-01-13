# Migration Summary - WhatsApp Groups System

## ✅ Completed Actions

### 1. Database Migrations Applied ✅

All migrations have been successfully applied to the remote database:

- ✅ **20260113092044_create_whatsapp_groups_system.sql**
  - Created `whatsapp_groups` table
  - Created `whatsapp_group_operations` table  
  - Added group membership columns to `signal_subscriptions`
  - Created `increment_group_member_count` function

- ✅ **20260113092045_create_group_triggers.sql**
  - Created `add_user_to_whatsapp_group()` trigger function
  - Created `remove_user_from_whatsapp_group()` trigger function
  - Set up automatic triggers on `signal_subscriptions` table

- ✅ **20260113092055_create_monthly_group_refresh_job.sql**
  - Created `call_refresh_whatsapp_groups()` function

- ✅ **20260113092114_setup_cron_job.sql**
  - Attempted to set up cron job (pg_cron not enabled - use dashboard instead)

### 2. Edge Functions Deployed ✅

All edge functions have been deployed:

- ✅ **manage-whatsapp-groups** - Group management operations
- ✅ **refresh-whatsapp-groups** - Monthly group refresh
- ✅ **send-whatsapp-notification** - Updated to send to groups

## 📋 Remaining Setup Steps

### Step 1: Enable Extensions (Required)

Go to **Supabase Dashboard > Database > Extensions** and enable:

1. **pg_net** - Required for triggers to call edge functions
   - Search for "pg_net"
   - Click "Enable"

### Step 2: Set Service Role Key (Required)

Run this SQL in Supabase SQL Editor (replace YOUR_SERVICE_ROLE_KEY):

```sql
UPDATE app_settings 
SET value = 'YOUR_SERVICE_ROLE_KEY',
    updated_at = NOW()
WHERE key = 'service_role_key';
```

**To get your service role key:**
- Go to Supabase Dashboard > Settings > API
- Copy the "service_role" key (keep it secret!)

### Step 3: Set Up Monthly Cron Job (Required)

**Option A: Supabase Dashboard Cron Jobs (Recommended)**

1. Go to **Supabase Dashboard > Database > Cron Jobs**
2. Click **"New Cron Job"**
3. Configure:
   - **Name**: `refresh-whatsapp-groups-monthly`
   - **Schedule**: `0 0 1 * *` (1st of each month at 00:00 UTC)
   - **SQL**: 
     ```sql
     SELECT call_refresh_whatsapp_groups();
     ```
4. Click **"Create"**

**Option B: Enable pg_cron Extension**

1. Go to **Supabase Dashboard > Database > Extensions**
2. Enable **pg_cron**
3. Run this SQL:
   ```sql
   SELECT cron.schedule(
     'refresh-whatsapp-groups-monthly',
     '0 0 1 * *',
     'SELECT call_refresh_whatsapp_groups();'
   );
   ```

### Step 4: Create Initial Groups

**Option A: Use Admin UI (Easiest)**

1. Log into admin dashboard
2. Go to **Signals > WhatsApp Groups** tab
3. Click **"Refresh Groups"** button
4. This creates groups for current month and migrates existing subscribers

**Option B: Call Edge Function**

```bash
curl -X POST 'https://iurstpwtdnlmpvwyhqfn.supabase.co/functions/v1/refresh-whatsapp-groups' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

## ✅ Verification Checklist

Run these queries to verify setup:

```sql
-- 1. Check tables exist
SELECT COUNT(*) FROM whatsapp_groups;
SELECT COUNT(*) FROM whatsapp_group_operations;

-- 2. Check triggers exist
SELECT trigger_name, event_manipulation 
FROM information_schema.triggers
WHERE event_object_table = 'signal_subscriptions'
AND trigger_name LIKE '%group%';

-- 3. Check functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('call_refresh_whatsapp_groups', 'increment_group_member_count');

-- 4. Check extensions
SELECT * FROM pg_extension WHERE extname IN ('pg_net', 'pg_cron');

-- 5. Check app settings
SELECT * FROM app_settings;
```

## 🎯 Next Steps

1. ✅ Migrations applied
2. ✅ Edge functions deployed
3. ⏳ Enable pg_net extension
4. ⏳ Set database configuration
5. ⏳ Set up cron job
6. ⏳ Create initial groups (via admin UI or edge function)

## 📚 Documentation

- **Setup Guide**: `WHATSAPP_GROUPS_SETUP.md`
- **Cron Job SQL**: `CRON_JOB_SETUP.sql`
