-- =============================================================================
-- SIGNAL UPDATES: Store changes separately from initial signal data
-- On UPDATE to signals: store initial snapshot (first time only), then store
-- change diff. Create in-app notifications for each update.
-- =============================================================================

-- Table: signal_updates (history of changes per signal)
CREATE TABLE IF NOT EXISTS signal_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id UUID NOT NULL REFERENCES signals(id) ON DELETE CASCADE,

  -- revision_type: 'initial' = snapshot when first update occurred; 'update' = one change set
  revision_type TEXT NOT NULL CHECK (revision_type IN ('initial', 'update')),

  -- For 'initial': snapshot of all tracked fields at creation (JSONB).
  -- For 'update': changes as { "field_name": { "old": value, "new": value }, ... }
  snapshot JSONB,
  changes JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_signal_updates_signal_id ON signal_updates(signal_id);
CREATE INDEX IF NOT EXISTS idx_signal_updates_created_at ON signal_updates(signal_id, created_at DESC);

ALTER TABLE signal_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read signal updates for readable signals" ON signal_updates;
CREATE POLICY "Users can read signal updates for readable signals"
  ON signal_updates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM signals s
      WHERE s.id = signal_updates.signal_id
      AND (s.status = 'active' OR auth.uid() IS NOT NULL)
    )
  );

DROP POLICY IF EXISTS "Admins can read all signal updates" ON signal_updates;
CREATE POLICY "Admins can read all signal updates"
  ON signal_updates
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Allow trigger (SECURITY DEFINER) or admins to insert
DROP POLICY IF EXISTS "Allow insert signal updates" ON signal_updates;
CREATE POLICY "Allow insert signal updates"
  ON signal_updates
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()) OR current_setting('role', true) = 'service_role');

COMMENT ON TABLE signal_updates IS 'History of changes to signals; initial snapshot plus each update diff.';

-- Build changes JSONB from OLD and NEW for tracked columns
CREATE OR REPLACE FUNCTION build_signal_changes(OLD signals, NEW signals)
RETURNS JSONB AS $$
DECLARE
  ch JSONB := '{}'::jsonb;
BEGIN
  IF OLD.entry_price IS DISTINCT FROM NEW.entry_price THEN
    ch := ch || jsonb_build_object('entry_price', jsonb_build_object('old', OLD.entry_price, 'new', NEW.entry_price));
  END IF;
  IF OLD.stop_loss IS DISTINCT FROM NEW.stop_loss THEN
    ch := ch || jsonb_build_object('stop_loss', jsonb_build_object('old', OLD.stop_loss, 'new', NEW.stop_loss));
  END IF;
  IF (OLD.take_profit_1 IS DISTINCT FROM NEW.take_profit_1) OR (OLD.take_profit_1 IS NULL AND NEW.take_profit_1 IS NOT NULL) OR (OLD.take_profit_1 IS NOT NULL AND NEW.take_profit_1 IS NULL) THEN
    ch := ch || jsonb_build_object('take_profit_1', jsonb_build_object('old', OLD.take_profit_1, 'new', NEW.take_profit_1));
  END IF;
  IF (OLD.take_profit_2 IS DISTINCT FROM NEW.take_profit_2) OR (OLD.take_profit_2 IS NULL AND NEW.take_profit_2 IS NOT NULL) OR (OLD.take_profit_2 IS NOT NULL AND NEW.take_profit_2 IS NULL) THEN
    ch := ch || jsonb_build_object('take_profit_2', jsonb_build_object('old', OLD.take_profit_2, 'new', NEW.take_profit_2));
  END IF;
  IF (OLD.take_profit_3 IS DISTINCT FROM NEW.take_profit_3) OR (OLD.take_profit_3 IS NULL AND NEW.take_profit_3 IS NOT NULL) OR (OLD.take_profit_3 IS NOT NULL AND NEW.take_profit_3 IS NULL) THEN
    ch := ch || jsonb_build_object('take_profit_3', jsonb_build_object('old', OLD.take_profit_3, 'new', NEW.take_profit_3));
  END IF;
  IF OLD.title IS DISTINCT FROM NEW.title THEN
    ch := ch || jsonb_build_object('title', jsonb_build_object('old', OLD.title, 'new', NEW.title));
  END IF;
  IF (OLD.analysis IS DISTINCT FROM NEW.analysis) OR (OLD.analysis IS NULL AND NEW.analysis IS NOT NULL) OR (OLD.analysis IS NOT NULL AND NEW.analysis IS NULL) THEN
    ch := ch || jsonb_build_object('analysis', jsonb_build_object('old', OLD.analysis, 'new', NEW.analysis));
  END IF;
  IF (OLD.confidence_level IS DISTINCT FROM NEW.confidence_level) OR (OLD.confidence_level IS NULL AND NEW.confidence_level IS NOT NULL) OR (OLD.confidence_level IS NOT NULL AND NEW.confidence_level IS NULL) THEN
    ch := ch || jsonb_build_object('confidence_level', jsonb_build_object('old', OLD.confidence_level, 'new', NEW.confidence_level));
  END IF;
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    ch := ch || jsonb_build_object('status', jsonb_build_object('old', OLD.status, 'new', NEW.status));
  END IF;
  IF OLD.trading_pair IS DISTINCT FROM NEW.trading_pair THEN
    ch := ch || jsonb_build_object('trading_pair', jsonb_build_object('old', OLD.trading_pair, 'new', NEW.trading_pair));
  END IF;
  IF OLD.signal_type IS DISTINCT FROM NEW.signal_type THEN
    ch := ch || jsonb_build_object('signal_type', jsonb_build_object('old', OLD.signal_type, 'new', NEW.signal_type));
  END IF;
  RETURN ch;
END;
$$ LANGUAGE plpgsql;

-- Snapshot of signal row as JSONB (for initial state)
CREATE OR REPLACE FUNCTION signal_row_to_snapshot(r signals)
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'trading_pair', r.trading_pair,
    'signal_type', r.signal_type,
    'entry_price', r.entry_price,
    'stop_loss', r.stop_loss,
    'take_profit_1', r.take_profit_1,
    'take_profit_2', r.take_profit_2,
    'take_profit_3', r.take_profit_3,
    'title', r.title,
    'analysis', r.analysis,
    'confidence_level', r.confidence_level,
    'status', r.status,
    'created_at', r.created_at
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger: on UPDATE to signals, store initial snapshot (if first update) and store change diff; create notifications
CREATE OR REPLACE FUNCTION on_signal_updated_store_and_notify()
RETURNS TRIGGER AS $$
DECLARE
  ch JSONB;
  is_first BOOLEAN;
  msg_text TEXT;
  title_text TEXT;
BEGIN
  ch := build_signal_changes(OLD, NEW);
  IF ch = '{}'::jsonb THEN
    RETURN NEW; -- no tracked changes
  END IF;

  -- Check if this is the first update for this signal
  SELECT NOT EXISTS (SELECT 1 FROM signal_updates WHERE signal_id = OLD.id LIMIT 1) INTO is_first;

  IF is_first THEN
    INSERT INTO signal_updates (signal_id, revision_type, snapshot, created_at)
    VALUES (OLD.id, 'initial', signal_row_to_snapshot(OLD), OLD.updated_at);
  END IF;

  INSERT INTO signal_updates (signal_id, revision_type, changes, created_at)
  VALUES (NEW.id, 'update', ch, TIMEZONE('utc'::text, NOW()));

  -- In-app notifications for users with push_signals
  title_text := '📝 Signal updated: ' || NEW.trading_pair;
  msg_text := 'SL/TP or details updated. Tap to view changes.';
  IF ch ? 'stop_loss' OR ch ? 'take_profit_1' OR ch ? 'take_profit_2' OR ch ? 'take_profit_3' THEN
    msg_text := 'Stop loss or take profit levels updated. Tap to view.';
  ELSIF ch ? 'entry_price' THEN
    msg_text := 'Entry price updated. Tap to view.';
  ELSIF ch ? 'status' THEN
    msg_text := 'Status: ' || (ch->'status'->>'old') || ' → ' || (ch->'status'->>'new');
  END IF;

  INSERT INTO notifications (user_id, notification_type, title, message, metadata)
  SELECT
    np.user_id,
    'signal',
    title_text,
    msg_text,
    jsonb_build_object(
      'signal_id', NEW.id,
      'trading_pair', NEW.trading_pair,
      'signal_type', NEW.signal_type,
      'updated', true,
      'changes', ch
    )
  FROM notification_preferences np
  WHERE np.push_signals = true;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'signal_updates trigger failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_signal_updated_store_updates ON signals;
CREATE TRIGGER on_signal_updated_store_updates
  AFTER UPDATE ON signals
  FOR EACH ROW
  EXECUTE FUNCTION on_signal_updated_store_and_notify();

COMMENT ON FUNCTION on_signal_updated_store_and_notify() IS 'Stores signal change history in signal_updates and creates in-app notifications';
