-- Create scheduled job to run monthly group refresh
-- This uses pg_cron extension which needs to be enabled in Supabase

-- Note: pg_cron must be enabled in Supabase dashboard first
-- To enable: Go to Database > Extensions > Enable pg_cron

-- Create function to call the refresh edge function
CREATE OR REPLACE FUNCTION call_refresh_whatsapp_groups()
RETURNS void AS $$
DECLARE
  function_url TEXT;
  service_role_key TEXT;
  response_status INT;
BEGIN
  -- Get function URL and service role key from app_settings table
  SELECT get_app_setting('edge_function_url') INTO function_url;
  SELECT get_app_setting('service_role_key') INTO service_role_key;
  
  -- Default values if not configured
  IF function_url IS NULL OR function_url = '' THEN
    function_url := 'https://iurstpwtdnlmpvwyhqfn.supabase.co/functions/v1/refresh-whatsapp-groups';
  END IF;
  
  -- Replace manage-whatsapp-groups with refresh-whatsapp-groups in URL if needed
  function_url := REPLACE(function_url, 'manage-whatsapp-groups', 'refresh-whatsapp-groups');
  
  -- Only call if service role key is available
  IF service_role_key IS NOT NULL AND service_role_key != '' THEN
    -- Call the refresh edge function
    SELECT status INTO response_status
    FROM net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key,
        'apikey', service_role_key
      ),
      body := jsonb_build_object()
    );
    
    -- Log the result
    IF response_status != 200 THEN
      RAISE WARNING 'Refresh WhatsApp groups returned status: %', response_status;
    END IF;
  ELSE
    RAISE WARNING 'Service role key not configured. Please set it in app_settings table.';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to call refresh WhatsApp groups: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the job to run on the 1st of each month at 00:00 UTC
-- Note: This requires pg_cron extension to be enabled
-- If pg_cron is not available, you can use Supabase's cron jobs feature instead

-- Uncomment the following line if pg_cron is enabled:
-- SELECT cron.schedule(
--   'refresh-whatsapp-groups-monthly',
--   '0 0 1 * *', -- Run at 00:00 UTC on the 1st of every month
--   $$SELECT call_refresh_whatsapp_groups();$$
-- );

-- Alternative: Use Supabase's built-in cron jobs
-- Go to Database > Cron Jobs in Supabase dashboard and create:
-- Schedule: 0 0 1 * * (cron expression for 1st of month at 00:00 UTC)
-- SQL: SELECT call_refresh_whatsapp_groups();
