-- Trading tips/quotes for mobile + daily push notifications
-- Requires: notification_preferences table, notifications table (existing)

-- ---------------------------------------------------------------------------
-- trading_tips: curated content; clients read active rows only
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trading_tips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  content_kind TEXT NOT NULL DEFAULT 'tip' CHECK (content_kind IN ('tip', 'quote')),
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trading_tips_active_sort ON trading_tips (active, sort_order, id);

ALTER TABLE trading_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read active trading tips"
  ON trading_tips FOR SELECT
  TO authenticated
  USING (active = true);

COMMENT ON TABLE trading_tips IS 'Daily rotatable trading tips and quotes; distributed via distribute-daily-tip Edge Function';

-- ---------------------------------------------------------------------------
-- Idempotency: one dispatch record per UTC calendar day
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trading_tip_daily_dispatch (
  dispatch_date DATE PRIMARY KEY,
  tip_id UUID NOT NULL REFERENCES trading_tips (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE trading_tip_daily_dispatch ENABLE ROW LEVEL SECURITY;

-- No client access; service role / postgres only
COMMENT ON TABLE trading_tip_daily_dispatch IS 'Records UTC dates when daily tip notifications were sent';

-- ---------------------------------------------------------------------------
-- notifications: allow notification_type tip
-- ---------------------------------------------------------------------------
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_notification_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_notification_type_check
  CHECK (notification_type IN ('signal', 'event', 'announcement', 'system', 'tip'));

COMMENT ON TABLE notifications IS 'In-app notifications including signals, events, announcements, system, and daily tips';

-- ---------------------------------------------------------------------------
-- notification_preferences: push_tips (default on)
-- ---------------------------------------------------------------------------
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS push_tips BOOLEAN DEFAULT true;

UPDATE notification_preferences SET push_tips = true WHERE push_tips IS NULL;

-- ---------------------------------------------------------------------------
-- RPC: user IDs eligible for daily tip (opt-out via push_tips = false)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_user_ids_opted_in_daily_tips()
RETURNS TABLE (user_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id AS user_id
  FROM auth.users u
  LEFT JOIN notification_preferences np ON np.user_id = u.id
  WHERE COALESCE(np.push_tips, true) = true;
$$;

REVOKE ALL ON FUNCTION public.list_user_ids_opted_in_daily_tips() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_user_ids_opted_in_daily_tips() TO service_role;

COMMENT ON FUNCTION public.list_user_ids_opted_in_daily_tips() IS 'Users who should receive daily trading tip notifications';

-- ---------------------------------------------------------------------------
-- Seed tips and quotes (deterministic sort_order); idempotent if table empty
-- ---------------------------------------------------------------------------
INSERT INTO trading_tips (title, body, content_kind, sort_order, active)
SELECT v.title, v.body, v.ck::text, v.so, v.act
FROM (VALUES
  ('Risk per trade', 'Never risk more than 1–2% of your account on a single trade. Survival matters more than one winning setup.', 'tip', 1, true),
  ('Plan the trade', 'Define entry, stop, and targets before you click buy or sell. If you cannot explain the trade in one sentence, skip it.', 'tip', 2, true),
  ('Cut losses', 'Small losses are tuition. Large losses are career-ending. Honor your stop loss every time.', 'tip', 3, true),
  ('Journal everything', 'Track setups, emotions, and outcomes. Your journal is the only coach that never lies.', 'tip', 4, true),
  ('Correlations', 'EUR/USD and GBP/USD often move together. Size down when you are effectively doubling exposure.', 'tip', 5, true),
  ('News spikes', 'Major news can gap through stops. Reduce size or stand aside 15 minutes before high-impact releases.', 'tip', 6, true),
  ('Trend vs range', 'In a trend, buy pullbacks; in a range, fade extremes. Mixing the two is expensive.', 'tip', 7, true),
  ('Patience', 'The market pays you to wait for A+ setups. B and C setups look tempting because you are bored.', 'tip', 8, true),
  ('Leverage', 'High leverage does not create edge; it accelerates mistakes. Use the minimum that still lets you trade your plan.', 'tip', 9, true),
  ('Revenge trading', 'After a loss, step away. Revenge trades are where discipline dies.', 'tip', 10, true),
  ('Expectancy', 'A 40% win rate can be profitable with good reward-to-risk. Track expectancy, not win rate alone.', 'tip', 11, true),
  ('Position sizing', 'Size so that a normal stop loss feels boring, not scary. If it is scary, you are too large.', 'tip', 12, true),
  ('Mark Douglas', '“The best traders have developed a mindset that allows them to remain confident, yet still stay objective.”', 'quote', 13, true),
  ('Paul Tudor Jones', '“Don’t focus on making money; focus on protecting what you have.”', 'quote', 14, true),
  ('Jesse Livermore', '“The money is made by sitting, not trading.”', 'quote', 15, true),
  ('Van Tharp', '“Position sizing is the most important part of any trading system.”', 'quote', 16, true),
  ('Alexander Elder', '“The goal of a successful trader is to make the best trades. Money is secondary.”', 'quote', 17, true),
  ('Ed Seykota', '“Win or lose, everybody gets what they want out of the market.”', 'quote', 18, true),
  ('Ray Dalio', '“Pain + reflection = progress.”', 'quote', 19, true),
  ('Warren Buffett', '“Risk comes from not knowing what you are doing.”', 'quote', 20, true),
  ('Session overlap', 'London–New York overlap often has the cleanest liquidity. Know when you are trading quiet vs active hours.', 'tip', 21, true),
  ('Stop hunting', 'Retail clusters stops at obvious highs and lows. Expect liquidity grabs before real moves.', 'tip', 22, true),
  ('Higher time frame', 'Your entry may be on M15, but the bias should usually agree with H4 or D1. Fight the higher TF at your peril.', 'tip', 23, true),
  ('Consistency', 'One good month does not make a system. Aim for repeatable process, not one lucky streak.', 'tip', 24, true)
) AS v(title, body, ck, so, act)
WHERE NOT EXISTS (SELECT 1 FROM trading_tips LIMIT 1);
