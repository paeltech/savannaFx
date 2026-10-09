-- Signal access is paid through Snippe (TZS): daily, weekly, monthly.
-- Complimentary subscriptions are expired so the paywall applies to existing users.

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
      AND rel.relname = 'signal_pricing'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%pricing_type%'
  LOOP
    EXECUTE format('ALTER TABLE public.signal_pricing DROP CONSTRAINT %I', r.conname);
  END LOOP;

  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'signal_subscriptions'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%subscription_type%'
  LOOP
    EXECUTE format('ALTER TABLE public.signal_subscriptions DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.signal_pricing
  ADD CONSTRAINT signal_pricing_pricing_type_check
  CHECK (pricing_type IN ('daily', 'weekly', 'monthly', 'per_pip'));

ALTER TABLE public.signal_subscriptions
  ADD CONSTRAINT signal_subscriptions_subscription_type_check
  CHECK (subscription_type IN ('daily', 'weekly', 'monthly', 'per_pip'));

UPDATE public.signal_pricing
SET is_active = false
WHERE pricing_type = 'per_pip';

INSERT INTO public.signal_pricing (pricing_type, price, currency, description, features, is_active)
VALUES
  (
    'daily',
    10000,
    'TZS',
    'Unlimited signals for 1 day',
    '["Signals for 24 hours", "USSD mobile money payment"]'::jsonb,
    true
  ),
  (
    'weekly',
    40000,
    'TZS',
    'Unlimited signals for 7 days',
    '["Signals for 7 days", "USSD mobile money payment"]'::jsonb,
    true
  )
ON CONFLICT (pricing_type) DO UPDATE SET
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  is_active = true;

UPDATE public.signal_pricing
SET
  price = 120000,
  currency = 'TZS',
  description = 'Unlimited signals for 30 days',
  is_active = true
WHERE pricing_type = 'monthly';

CREATE TABLE IF NOT EXISTS public.signal_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pricing_id UUID NOT NULL REFERENCES public.signal_pricing(id) ON DELETE RESTRICT,
  subscription_id UUID REFERENCES public.signal_subscriptions(id) ON DELETE SET NULL,
  subscription_type TEXT NOT NULL CHECK (subscription_type IN ('daily', 'weekly', 'monthly')),
  amount INTEGER NOT NULL CHECK (amount >= 500),
  currency TEXT NOT NULL DEFAULT 'TZS',
  phone_number TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('mpesa', 'airtel', 'mixx', 'halotel')),
  snippe_reference TEXT UNIQUE,
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'expired', 'voided')),
  snippe_event_id TEXT UNIQUE,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE UNIQUE INDEX IF NOT EXISTS signal_payments_one_pending_per_user
  ON public.signal_payments (user_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_signal_payments_user_id ON public.signal_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_signal_payments_status ON public.signal_payments(status);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.signal_subscriptions
    WHERE payment_reference IS NOT NULL
    GROUP BY payment_reference
    HAVING COUNT(*) > 1
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS signal_subscriptions_payment_reference_unique
      ON public.signal_subscriptions (payment_reference)
      WHERE payment_reference IS NOT NULL;
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_signal_payments_updated_at ON public.signal_payments;
CREATE TRIGGER update_signal_payments_updated_at
  BEFORE UPDATE ON public.signal_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_signal_subscriptions_updated_at();

ALTER TABLE public.signal_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own signal payments" ON public.signal_payments;
CREATE POLICY "Users can read their own signal payments"
  ON public.signal_payments
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read signal payments" ON public.signal_payments;
CREATE POLICY "Admins can read signal payments"
  ON public.signal_payments
  FOR SELECT
  USING (is_admin(auth.uid()));

GRANT SELECT ON public.signal_payments TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'signal_payments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.signal_payments;
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    RAISE WARNING 'supabase_realtime publication is missing; payment status will rely on polling';
END $$;

-- Paid access: completed payment, positive amount, and an end date still in the future.
CREATE OR REPLACE FUNCTION public.has_paid_signal_access(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.signal_subscriptions
    WHERE user_id = user_uuid
      AND status = 'active'
      AND payment_status = 'completed'
      AND amount_paid > 0
      AND end_date IS NOT NULL
      AND end_date > TIMEZONE('utc'::text, NOW())
  );
$$;

REVOKE ALL ON FUNCTION public.has_paid_signal_access(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_paid_signal_access(UUID) TO authenticated, service_role;

DROP POLICY IF EXISTS "Anyone can read active signals" ON public.signals;
DROP POLICY IF EXISTS "Authenticated users can read all signals" ON public.signals;
DROP POLICY IF EXISTS "Paid members and admins can read signals" ON public.signals;
CREATE POLICY "Paid members and admins can read signals"
  ON public.signals
  FOR SELECT
  USING (is_admin(auth.uid()) OR public.has_paid_signal_access(auth.uid()));

DROP POLICY IF EXISTS "Users can read signal updates for readable signals" ON public.signal_updates;
DROP POLICY IF EXISTS "Admins can read all signal updates" ON public.signal_updates;
DROP POLICY IF EXISTS "Paid members and admins can read signal updates" ON public.signal_updates;
CREATE POLICY "Paid members and admins can read signal updates"
  ON public.signal_updates
  FOR SELECT
  USING (is_admin(auth.uid()) OR public.has_paid_signal_access(auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.signal_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.signal_subscriptions;

-- Stop complimentary auto-subscribe. Triggers stay so signup does not fail.
CREATE OR REPLACE FUNCTION public.auto_subscribe_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_subscribe_on_phone_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_profile_phone_update ON public.user_profiles;

UPDATE public.signal_subscriptions
SET status = 'expired'
WHERE status = 'active'
  AND amount_paid = 0
  AND payment_reference IS NULL;

CREATE OR REPLACE FUNCTION public.expire_signal_subscriptions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.signal_subscriptions
  SET status = 'expired'
  WHERE status = 'active'
    AND end_date IS NOT NULL
    AND end_date <= TIMEZONE('utc'::text, NOW());
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

DO $$
DECLARE
  jid bigint;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE WARNING 'pg_cron not enabled. Schedule SELECT expire_signal_subscriptions(); hourly.';
    RETURN;
  END IF;

  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'expire-signal-subscriptions' LIMIT 1;
  IF jid IS NOT NULL THEN
    PERFORM cron.unschedule(jid);
  END IF;

  PERFORM cron.schedule(
    'expire-signal-subscriptions',
    '15 * * * *',
    'SELECT public.expire_signal_subscriptions();'
  );
END $$;
