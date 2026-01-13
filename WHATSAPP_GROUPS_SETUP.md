# WhatsApp Groups Setup Guide

## ✅ Migrations Applied Successfully

All database migrations have been applied:
- ✅ `whatsapp_groups` table created
- ✅ `whatsapp_group_operations` table created
- ✅ Group membership columns added to `signal_subscriptions`
- ✅ Triggers for automatic add/remove from groups created
- ✅ Monthly refresh function created

## 📋 Next Steps

### 1. Enable Required Extensions

Go to **Supabase Dashboard > Database > Extensions** and enable:
- **pg_net** - Required for calling edge functions from triggers
- **pg_cron** (optional) - If you want to use database-level cron jobs

### 2. Deploy Edge Functions

Deploy the new edge functions:

```bash
supabase functions deploy manage-whatsapp-groups
supabase functions deploy refresh-whatsapp-groups
```

### 3. Set Service Role Key (Required)

Set the service role key in the `app_settings` table:

```sql
UPDATE app_settings 
SET value = 'YOUR_SERVICE_ROLE_KEY',
    updated_at = NOW()
WHERE key = 'service_role_key';
```

**To get your service role key:**
1. Go to Supabase Dashboard > Settings > API
2. Copy the "service_role" key (keep it secret!)
3. Replace `YOUR_SERVICE_ROLE_KEY` in the SQL above with your actual key
4. Run the SQL in Supabase SQL Editor

**Note:** The `edge_function_url` is already set to the default value. You can update it if needed:
```sql
UPDATE app_settings 
SET value = 'https://iurstpwtdnlmpvwyhqfn.supabase.co/functions/v1/manage-whatsapp-groups',
    updated_at = NOW()
WHERE key = 'edge_function_url';
```

### 4. Set Up Monthly Cron Job

You have two options:

#### Option A: Supabase Cron Jobs (Recommended)

1. Go to **Supabase Dashboard > Database > Cron Jobs**
2. Click **"New Cron Job"**
3. Configure:
   - **Name**: `refresh-whatsapp-groups-monthly`
   - **Schedule**: `0 0 1 * *` (runs on 1st of each month at 00:00 UTC)
   - **SQL**:
     ```sql
     SELECT call_refresh_whatsapp_groups();
     ```
4. Click **"Create"**

#### Option B: pg_cron Extension

If you enabled pg_cron, run this SQL:

```sql
SELECT cron.schedule(
  'refresh-whatsapp-groups-monthly',
  '0 0 1 * *',
  'SELECT call_refresh_whatsapp_groups();'
);
```

### 5. Create Initial Groups

You can create initial groups in two ways:

#### Option A: Use Admin UI (Easiest)

1. Go to Admin Dashboard > Signals > WhatsApp Groups tab
2. Click **"Refresh Groups"** button
3. This will create groups for the current month and migrate existing subscribers

#### Option B: Call Edge Function Directly

```bash
curl -X POST 'https://iurstpwtdnlmpvwyhqfn.supabase.co/functions/v1/refresh-whatsapp-groups' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

### 6. Test the System

1. **Create a test signal** - Should send to groups instead of individuals
2. **Add a new subscriber** - Should automatically be added to a group
3. **Expire a subscription** - Should automatically be removed from group
4. **Check group operations log** - View in `whatsapp_group_operations` table

## 🔍 Verification Queries

Check if everything is set up correctly:

```sql
-- Check if groups table exists
SELECT COUNT(*) FROM whatsapp_groups;

-- Check if triggers exist
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'signal_subscriptions'
AND trigger_name LIKE '%group%';

-- Check if refresh function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'call_refresh_whatsapp_groups';

-- Check active groups for current month
SELECT * FROM whatsapp_groups 
WHERE is_active = true 
AND month_year = TO_CHAR(NOW(), 'YYYY-MM');
```

## 📊 Monitoring

- **Group Operations**: Check `whatsapp_group_operations` table for all operations
- **Group Status**: View active groups in Admin Dashboard > WhatsApp Groups tab
- **Edge Function Logs**: Check Supabase Dashboard > Edge Functions > Logs

## 🐛 Troubleshooting

### Triggers Not Working

1. Check if `pg_net` extension is enabled
2. Verify database settings are configured:
   ```sql
   SHOW app.settings.edge_function_url;
   SHOW app.settings.service_role_key;
   ```
3. Check trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname LIKE '%group%';
   ```

### Edge Functions Not Deployed

1. Verify functions are deployed:
   ```bash
   supabase functions list
   ```
2. Check function logs for errors
3. Verify environment variables are set:
   ```bash
   supabase secrets list
   ```

### Cron Job Not Running

1. Verify cron job exists:
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'refresh-whatsapp-groups-monthly';
   ```
2. Check cron job history:
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'refresh-whatsapp-groups-monthly')
   ORDER BY start_time DESC LIMIT 10;
   ```

## 🎯 Success Indicators

- ✅ Groups table has entries for current month
- ✅ Subscribers are automatically added when subscription becomes active
- ✅ Subscribers are automatically removed when subscription expires
- ✅ Signal notifications send to groups (check logs)
- ✅ Monthly refresh runs automatically on 1st of each month
