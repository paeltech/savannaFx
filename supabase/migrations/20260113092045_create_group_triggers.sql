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
        -- Get function URL and service role key
        function_url := current_setting('app.settings.edge_function_url', true);
        service_role_key := current_setting('app.settings.service_role_key', true);
        
        -- Default values if not configured
        IF function_url IS NULL THEN
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
      
      -- Get function URL and service role key
      function_url := current_setting('app.settings.edge_function_url', true);
      service_role_key := current_setting('app.settings.service_role_key', true);
      
      -- Default values if not configured
      IF function_url IS NULL THEN
        function_url := 'https://iurstpwtdnlmpvwyhqfn.supabase.co/functions/v1/manage-whatsapp-groups';
      END IF;
      
      -- Call edge function to remove member
      PERFORM net.http_post(
        url := function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || COALESCE(service_role_key, ''),
          'apikey', COALESCE(service_role_key, '')
        ),
        body := jsonb_build_object(
          'action', 'remove_member',
          'groupJid', OLD.whatsapp_group_jid,
          'phoneNumber', user_phone_number,
          'userId', NEW.user_id::text
        )
      );
      
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
