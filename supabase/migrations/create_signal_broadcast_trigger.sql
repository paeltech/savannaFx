-- Create database trigger to automatically send WhatsApp notifications when a signal is created
-- This function will be called after a new signal is inserted

CREATE OR REPLACE FUNCTION trigger_signal_broadcast()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Only trigger for new active signals
  IF NEW.status = 'active' THEN
    -- Get the function URL from environment (you'll need to replace this with your actual project URL)
    function_url := current_setting('app.settings.edge_function_url', true);
    service_role_key := current_setting('app.settings.service_role_key', true);
    
    -- If settings are not configured, use default (replace with your actual values)
    IF function_url IS NULL THEN
      function_url := 'https://iurstpwtdnlmpvwyhqfn.supabase.co/functions/v1/send-whatsapp-notification';
    END IF;
    
    -- Call the Edge Function asynchronously using pg_net
    -- Note: This requires the pg_net extension to be enabled in Supabase
    PERFORM net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object('signalId', NEW.id::text)
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the signal insertion
    RAISE WARNING 'Failed to trigger signal broadcast: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_signal_created ON signals;

CREATE TRIGGER on_signal_created
  AFTER INSERT ON signals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_signal_broadcast();

-- Note: To use this trigger, you need to:
-- 1. Enable the pg_net extension in Supabase dashboard
-- 2. Set the configuration parameters:
--    ALTER DATABASE postgres SET app.settings.edge_function_url = 'https://YOUR_PROJECT.supabase.co/functions/v1/send-whatsapp-notification';
--    ALTER DATABASE postgres SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY';
