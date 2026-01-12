-- Create notification_logs table for tracking all notifications sent
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  signal_id UUID REFERENCES signals(id) ON DELETE CASCADE,
  
  -- Notification Details
  notification_type TEXT DEFAULT 'whatsapp' CHECK (notification_type IN ('whatsapp', 'email', 'telegram', 'sms')),
  phone_number TEXT,
  email_address TEXT,
  message_content TEXT NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
  error_message TEXT,
  provider_message_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_signal_id ON notification_logs(signal_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_notification_type ON notification_logs(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for notification_logs
-- Users can read their own notification logs
CREATE POLICY "Users can read their own notification logs"
  ON notification_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all notification logs
CREATE POLICY "Admins can read all notification logs"
  ON notification_logs
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Service role can insert notification logs
CREATE POLICY "Service role can insert notification logs"
  ON notification_logs
  FOR INSERT
  WITH CHECK (true);

-- Service role can update notification logs
CREATE POLICY "Service role can update notification logs"
  ON notification_logs
  FOR UPDATE
  USING (true);
