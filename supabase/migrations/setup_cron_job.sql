-- ============================================
-- Setup Cron Job for Monthly Group Refresh
-- ============================================
-- 
-- IMPORTANT: This script sets up the cron job using Supabase's pg_cron extension
-- 
-- Prerequisites:
-- 1. Enable pg_cron extension in Supabase Dashboard:
--    - Go to Database > Extensions
--    - Search for "pg_cron" and enable it
-- 
-- 2. Enable pg_net extension (required for calling edge functions):
--    - Go to Database > Extensions  
--    - Search for "pg_net" and enable it
--
-- 3. Set database configuration (if not already set):
--    ALTER DATABASE postgres SET app.settings.edge_function_url = 'https://iurstpwtdnlmpvwyhqfn.supabase.co/functions/v1/refresh-whatsapp-groups';
--    ALTER DATABASE postgres SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY';
--
-- ============================================

-- Check if pg_cron is available and schedule the job
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Schedule the job to run on the 1st of each month at 00:00 UTC
    PERFORM cron.schedule(
      'refresh-whatsapp-groups-monthly',
      '0 0 1 * *',
      'SELECT call_refresh_whatsapp_groups();'
    );
    RAISE NOTICE 'Cron job "refresh-whatsapp-groups-monthly" scheduled successfully';
  ELSE
    RAISE WARNING 'pg_cron extension is not enabled. Please enable it in Supabase Dashboard > Database > Extensions';
    RAISE NOTICE 'Alternatively, use Supabase Cron Jobs feature in the dashboard';
  END IF;
END $$;
