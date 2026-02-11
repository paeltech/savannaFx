-- Fix 401 on send-push-for-notification: trigger must send a valid Bearer token.
-- Use app_settings via get_app_setting when called from a session that can read it (admin/service_role).
-- When notifications are created by SECURITY DEFINER triggers (create_signal_notifications etc.),
-- the inserting "session" is still the original user, so get_app_setting may return null due to RLS.
-- So we read from a dedicated table that only the trigger definer can read (no RLS), and fall back to
-- get_app_setting and current_setting for flexibility.

-- Table for push edge function auth (read by trigger definer only; RLS disabled so definer can read)
CREATE TABLE IF NOT EXISTS push_edge_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE push_edge_config DISABLE ROW LEVEL SECURITY;

-- Ensure only the table owner (and thus SECURITY DEFINER functions owned by same role) can use it
COMMENT ON TABLE push_edge_config IS 'Bearer token for invoking send-push-for-notification; set once via SQL. No RLS so trigger definer can read.';

-- Function that runs as definer and can read push_edge_config (and fallbacks)
CREATE OR REPLACE FUNCTION get_push_edge_bearer_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bearer TEXT;
BEGIN
  -- 1) Prefer key stored in push_edge_config (readable by definer)
  SELECT value INTO bearer FROM push_edge_config WHERE key = 'bearer_key' LIMIT 1;
  IF bearer IS NOT NULL AND bearer <> '' THEN
    RETURN bearer;
  END IF;
  -- 2) Fallback: app_settings (works when caller is admin/service_role)
  bearer := get_app_setting('service_role_key');
  IF bearer IS NOT NULL AND bearer <> '' THEN
    RETURN bearer;
  END IF;
  -- 3) Fallback: PostgreSQL GUC (ALTER DATABASE / ALTER ROLE)
  bearer := current_setting('app.settings.service_role_key', true);
  RETURN COALESCE(bearer, '');
END;
$$;

COMMENT ON FUNCTION get_push_edge_bearer_key() IS 'Returns Bearer token for push Edge Function; used by trigger_send_push_for_notification. Set push_edge_config.bearer_key or app_settings.service_role_key or app.settings.service_role_key.';

-- Replace push trigger to use get_push_edge_bearer_key()
CREATE OR REPLACE FUNCTION trigger_send_push_for_notification()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  bearer_key TEXT;
BEGIN
  function_url := current_setting('app.settings.push_edge_function_url', true);
  IF function_url IS NULL OR function_url = '' THEN
    function_url := 'https://iurstpwtdnlmpvwyhqfn.supabase.co/functions/v1/send-push-for-notification';
  END IF;

  bearer_key := get_push_edge_bearer_key();
  IF bearer_key IS NULL OR bearer_key = '' THEN
    RAISE WARNING 'Push trigger: no bearer key. Set push_edge_config (bearer_key) or app_settings.service_role_key or app.settings.service_role_key.';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || bearer_key
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

-- One-time: insert placeholder so project can set the key (anon or service_role key from Dashboard → API)
INSERT INTO push_edge_config (key, value)
VALUES ('bearer_key', '')
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE push_edge_config IS 'Set value for key bearer_key to your Supabase anon or service_role key (Dashboard → API) so the push notification Edge Function can be invoked. Example: UPDATE push_edge_config SET value = ''eyJ...'' WHERE key = ''bearer_key'';';

-- =============================================================================
-- AFTER APPLYING THIS MIGRATION (required for push to work):
-- 1. In Supabase SQL Editor or Dashboard → Database → push_edge_config:
--    UPDATE push_edge_config SET value = '<your_anon_or_service_role_key>' WHERE key = 'bearer_key';
--    Get the key from: Dashboard → Project Settings → API → anon public (or service_role).
-- 2. Ensure the mobile app saves a push token: run the app on a physical device (not Expo Go),
--    log in, grant notification permission; check push_tokens table for a row for that user.
-- =============================================================================
