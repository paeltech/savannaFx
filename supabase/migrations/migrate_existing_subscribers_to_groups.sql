-- Migration script to add existing active subscribers to initial WhatsApp groups
-- This should be run after creating the groups table and edge functions
-- It will create groups for the current month and add all active subscribers

-- Note: This migration calls the edge function, so it requires:
-- 1. Edge functions to be deployed
-- 2. pg_net extension to be enabled
-- 3. app.settings.edge_function_url and app.settings.service_role_key to be configured

DO $$
DECLARE
  function_url TEXT;
  service_role_key TEXT;
  response_status INT;
  current_month_year TEXT;
BEGIN
  -- Get current month in YYYY-MM format
  current_month_year := TO_CHAR(NOW(), 'YYYY-MM');
  
  -- Get function URL and service role key
  function_url := current_setting('app.settings.edge_function_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);
  
  -- Default values if not configured
  IF function_url IS NULL THEN
    function_url := 'https://iurstpwtdnlmpvwyhqfn.supabase.co/functions/v1/refresh-whatsapp-groups';
  END IF;
  
  -- Check if groups already exist for current month
  IF EXISTS (
    SELECT 1 FROM whatsapp_groups 
    WHERE is_active = true 
    AND month_year = current_month_year
  ) THEN
    RAISE NOTICE 'Groups already exist for %. Skipping migration.', current_month_year;
    RETURN;
  END IF;
  
  -- Call the refresh edge function to create groups and migrate subscribers
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
  
  IF response_status = 200 THEN
    RAISE NOTICE 'Successfully migrated existing subscribers to WhatsApp groups for %.', current_month_year;
  ELSE
    RAISE WARNING 'Migration returned status: %. Check edge function logs.', response_status;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to migrate existing subscribers: %. You may need to run the refresh function manually.', SQLERRM;
END $$;
