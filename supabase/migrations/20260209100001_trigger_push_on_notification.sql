-- Trigger to send push notification when a row is inserted into notifications.
-- Requires pg_net extension. Uses app.settings.service_role_key (same as other Edge triggers).

CREATE OR REPLACE FUNCTION trigger_send_push_for_notification()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  service_role_key TEXT;
BEGIN
  function_url := current_setting('app.settings.push_edge_function_url', true);
  IF function_url IS NULL THEN
    function_url := 'https://iurstpwtdnlmpvwyhqfn.supabase.co/functions/v1/send-push-for-notification';
  END IF;

  service_role_key := current_setting('app.settings.service_role_key', true);

  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_role_key, '')
    ),
    body := jsonb_build_object('notification_id', NEW.id::text)
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to trigger push for notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_notification_created_send_push ON notifications;

CREATE TRIGGER on_notification_created_send_push
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_send_push_for_notification();

COMMENT ON FUNCTION trigger_send_push_for_notification() IS 'Invokes send-push-for-notification Edge Function via pg_net when a notification is inserted';
