-- Add notification preference columns to signal_subscriptions table
ALTER TABLE signal_subscriptions
ADD COLUMN IF NOT EXISTS whatsapp_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS telegram_notifications BOOLEAN DEFAULT false;

-- Create index for active subscriptions with WhatsApp enabled
CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_whatsapp_active 
  ON signal_subscriptions(status, whatsapp_notifications) 
  WHERE status = 'active' AND whatsapp_notifications = true;

-- Create index for active subscriptions with email enabled
CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_email_active 
  ON signal_subscriptions(status, email_notifications) 
  WHERE status = 'active' AND email_notifications = true;

-- Create index for active subscriptions with telegram enabled
CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_telegram_active 
  ON signal_subscriptions(status, telegram_notifications) 
  WHERE status = 'active' AND telegram_notifications = true;
