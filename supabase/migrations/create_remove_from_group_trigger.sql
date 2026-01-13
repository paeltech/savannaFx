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
