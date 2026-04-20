-- Schedule daily trading tip distribution (07:00 UTC) via pg_net.
-- Prerequisites: enable pg_cron and pg_net in Supabase Dashboard → Database → Extensions.
-- Uses same bearer resolution as push trigger (push_edge_config / app_settings / GUC).

CREATE OR REPLACE FUNCTION trigger_distribute_daily_tip_http()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  function_url TEXT;
  bearer_key TEXT;
BEGIN
  function_url := current_setting('app.settings.distribute_daily_tip_edge_function_url', true);
  IF function_url IS NULL OR function_url = '' THEN
    function_url := 'https://iurstpwtdnlmpvwyhqfn.supabase.co/functions/v1/distribute-daily-tip';
  END IF;

  bearer_key := get_push_edge_bearer_key();
  IF bearer_key IS NULL OR bearer_key = '' THEN
    RAISE WARNING 'distribute-daily-tip cron: no bearer key. Configure push_edge_config or app_settings.service_role_key.';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || bearer_key
    ),
    body := '{}'::jsonb
  );
END;
$$;

COMMENT ON FUNCTION trigger_distribute_daily_tip_http() IS 'POSTs to distribute-daily-tip Edge Function with service role bearer; scheduled 07:00 UTC';

DO $$
DECLARE
  jid bigint;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE WARNING 'pg_cron not enabled. Enable pg_cron or use Dashboard / external cron to POST .../functions/v1/distribute-daily-tip with Authorization: Bearer <service_role_key>';
    RETURN;
  END IF;

  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'distribute-daily-tip-utc' LIMIT 1;
  IF jid IS NOT NULL THEN
    PERFORM cron.unschedule(jid);
  END IF;

  PERFORM cron.schedule(
    'distribute-daily-tip-utc',
    '0 7 * * *',
    'SELECT trigger_distribute_daily_tip_http();'
  );
  RAISE NOTICE 'Cron job distribute-daily-tip-utc scheduled (07:00 UTC)';
END $$;
