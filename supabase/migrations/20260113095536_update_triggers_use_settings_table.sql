-- Create app_settings table to store configuration values
-- This avoids needing superuser privileges for ALTER DATABASE

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create function to get setting value
CREATE OR REPLACE FUNCTION get_app_setting(setting_key TEXT)
RETURNS TEXT AS $$
DECLARE
  setting_value TEXT;
BEGIN
  SELECT value INTO setting_value
  FROM app_settings
  WHERE key = setting_key;
  
  RETURN setting_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default settings (can be updated via SQL or admin UI)
INSERT INTO app_settings (key, value, description)
VALUES 
  ('edge_function_url', 'https://iurstpwtdnlmpvwyhqfn.supabase.co/functions/v1/manage-whatsapp-groups', 'Base URL for edge functions'),
  ('service_role_key', '', 'Service role key for edge function authentication')
ON CONFLICT (key) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Admins can read settings
CREATE POLICY "Admins can read settings"
  ON app_settings
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Service role can read settings
CREATE POLICY "Service role can read settings"
  ON app_settings
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Admins can update settings
CREATE POLICY "Admins can update settings"
  ON app_settings
  FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Service role can update settings
CREATE POLICY "Service role can update settings"
  ON app_settings
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
-- Create trigger function to automatically add users to WhatsApp groups when subscription becomes active
CREATE OR REPLACE FUNCTION add_user_to_whatsapp_group()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  service_role_key TEXT;
  user_phone_number TEXT;
  user_whatsapp_enabled BOOLEAN;
  current_month_year TEXT;
  active_group RECORD;
BEGIN
  -- Only proceed if subscription status is 'active' and WhatsApp notifications are enabled
  IF NEW.status = 'active' 
     AND NEW.whatsapp_notifications = true 
     AND (OLD.status IS NULL OR OLD.status != 'active' OR OLD.whatsapp_notifications != true) THEN
    
    -- Get user's phone number and WhatsApp notification preference
    SELECT phone_number, whatsapp_notifications_enabled, phone_verified
    INTO user_phone_number, user_whatsapp_enabled, user_whatsapp_enabled
    FROM user_profiles
    WHERE id = NEW.user_id;
    
    -- Only proceed if user has verified phone number and WhatsApp enabled
    IF user_phone_number IS NOT NULL 
       AND TRIM(user_phone_number) != '' 
       AND user_whatsapp_enabled = true THEN
      
      -- Get current month in YYYY-MM format
      current_month_year := TO_CHAR(NOW(), 'YYYY-MM');
      
      -- Find active group with space available for current month
      SELECT * INTO active_group
      FROM whatsapp_groups
      WHERE is_active = true
        AND month_year = current_month_year
        AND member_count < max_members
      ORDER BY group_number ASC
      LIMIT 1;
      
      -- If no group with space exists, get or create one via edge function
      IF active_group IS NULL THEN
        -- Get function URL and service role key from app_settings table
        SELECT get_app_setting('edge_function_url') INTO function_url;
        SELECT get_app_setting('service_role_key') INTO service_role_key;
        
        -- Default values if not configured
        IF function_url IS NULL OR function_url = '' THEN
          function_url := 'https://iurstpwtdnlmpvwyhqfn.supabase.co/functions/v1/manage-whatsapp-groups';
        END IF;
        
        -- Call edge function to get or create active group
        PERFORM net.http_post(
          url := function_url,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || COALESCE(service_role_key, ''),
            'apikey', COALESCE(service_role_key, '')
          ),
          body := jsonb_build_object(
            'action', 'get_or_create_active_group',
            'monthYear', current_month_year
          )
        );
        
        -- Re-fetch the group after creation
        SELECT * INTO active_group
        FROM whatsapp_groups
        WHERE is_active = true
          AND month_year = current_month_year
          AND member_count < max_members
        ORDER BY group_number ASC
        LIMIT 1;
      END IF;
      
      -- If we have an active group, add user to it
      IF active_group IS NOT NULL THEN
        -- Call edge function to add member
        PERFORM net.http_post(
          url := function_url,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || COALESCE(service_role_key, ''),
            'apikey', COALESCE(service_role_key, '')
          ),
          body := jsonb_build_object(
            'action', 'add_member',
            'groupJid', active_group.group_jid,
            'phoneNumber', user_phone_number,
            'userId', NEW.user_id::text
          )
        );
        
        -- Update subscription with group info
        NEW.whatsapp_group_id := active_group.id;
        NEW.whatsapp_group_jid := active_group.group_jid;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the subscription update
    RAISE WARNING 'Failed to add user to WhatsApp group: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_subscription_active_add_to_group ON signal_subscriptions;

CREATE TRIGGER on_subscription_active_add_to_group
  AFTER INSERT OR UPDATE ON signal_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION add_user_to_whatsapp_group();
-- Create trigger function to automatically remove users from WhatsApp groups when subscription expires
CREATE OR REPLACE FUNCTION remove_user_from_whatsapp_group()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  service_role_key TEXT;
  user_phone_number TEXT;
BEGIN
  -- Only proceed if subscription status changed to 'expired' or 'cancelled'
  -- and user was previously in a group
  IF (NEW.status = 'expired' OR NEW.status = 'cancelled')
     AND (OLD.status = 'active')
     AND OLD.whatsapp_group_jid IS NOT NULL THEN
    
    -- Get user's phone number
    SELECT phone_number INTO user_phone_number
    FROM user_profiles
    WHERE id = NEW.user_id;
    
    -- Only proceed if user has phone number
    IF user_phone_number IS NOT NULL AND TRIM(user_phone_number) != '' THEN
      
      -- Get function URL and service role key from app_settings table
      SELECT get_app_setting('edge_function_url') INTO function_url;
      SELECT get_app_setting('service_role_key') INTO service_role_key;
      
      -- Default values if not configured
      IF function_url IS NULL OR function_url = '' THEN
        function_url := 'https://iurstpwtdnlmpvwyhqfn.supabase.co/functions/v1/manage-whatsapp-groups';
      END IF;
      
      -- Only call edge function if service role key is available
      IF service_role_key IS NOT NULL AND service_role_key != '' THEN
        -- Call edge function to remove member
        PERFORM net.http_post(
          url := function_url,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || service_role_key,
            'apikey', service_role_key
          ),
          body := jsonb_build_object(
            'action', 'remove_member',
            'groupJid', OLD.whatsapp_group_jid,
            'phoneNumber', user_phone_number,
            'userId', NEW.user_id::text
          )
        );
      END IF;
      
      -- Clear group info from subscription
      NEW.whatsapp_group_id := NULL;
      NEW.whatsapp_group_jid := NULL;
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the subscription update
    RAISE WARNING 'Failed to remove user from WhatsApp group: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_subscription_expired_remove_from_group ON signal_subscriptions;

CREATE TRIGGER on_subscription_expired_remove_from_group
  AFTER UPDATE ON signal_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION remove_user_from_whatsapp_group();
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
