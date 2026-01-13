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
  -- Get function URL and service role key
  function_url := current_setting('app.settings.edge_function_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);
  
  -- Default values if not configured
  IF function_url IS NULL THEN
    function_url := 'https://iurstpwtdnlmpvwyhqfn.supabase.co/functions/v1/refresh-whatsapp-groups';
  END IF;
  
  -- Call the refresh edge function
  SELECT status INTO response_status
  FROM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_role_key, ''),
      'apikey', COALESCE(service_role_key, '')
    ),
    body := jsonb_build_object()
  );
  
  -- Log the result
  IF response_status != 200 THEN
    RAISE WARNING 'Refresh WhatsApp groups returned status: %', response_status;
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
