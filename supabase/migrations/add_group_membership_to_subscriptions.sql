-- Add group membership columns to signal_subscriptions table
ALTER TABLE signal_subscriptions
  ADD COLUMN IF NOT EXISTS whatsapp_group_id UUID REFERENCES whatsapp_groups(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS whatsapp_group_jid TEXT; -- Denormalized for quick access

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_whatsapp_group_id ON signal_subscriptions(whatsapp_group_id);
CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_whatsapp_group_jid ON signal_subscriptions(whatsapp_group_jid);
