-- Signals stay active for 7 days from the posting time, then become inactive.

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'signals'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%status%'
      AND pg_get_constraintdef(con.oid) NOT ILIKE '%payment_status%'
  LOOP
    EXECUTE format('ALTER TABLE public.signals DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.signals
  ADD CONSTRAINT signals_status_check
  CHECK (status IN ('active', 'closed', 'cancelled', 'inactive'));

CREATE OR REPLACE FUNCTION public.deactivate_signals_after_one_week()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.signals
  SET status = 'inactive'
  WHERE status = 'active'
    AND created_at <= TIMEZONE('utc'::text, NOW()) - INTERVAL '7 days';
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

SELECT public.deactivate_signals_after_one_week();

DO $$
DECLARE
  jid bigint;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE WARNING 'pg_cron not enabled. Schedule SELECT deactivate_signals_after_one_week(); hourly.';
    RETURN;
  END IF;

  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'deactivate-signals-after-one-week' LIMIT 1;
  IF jid IS NOT NULL THEN
    PERFORM cron.unschedule(jid);
  END IF;

  PERFORM cron.schedule(
    'deactivate-signals-after-one-week',
    '20 * * * *',
    'SELECT public.deactivate_signals_after_one_week();'
  );
END $$;
