-- Create notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification Details
  notification_type TEXT NOT NULL CHECK (notification_type IN ('signal', 'event', 'announcement', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  read BOOLEAN NOT NULL DEFAULT false,
  deleted BOOLEAN NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_deleted ON notifications(deleted);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read) WHERE deleted = false;
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE read = false AND deleted = false;

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
-- Users can read their own non-deleted notifications
CREATE POLICY "Users can read their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id AND deleted = false);

-- Users can update their own notifications (mark as read/deleted)
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all notifications
CREATE POLICY "Admins can read all notifications"
  ON notifications
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Service role and admins can insert notifications for any user
CREATE POLICY "Service role and admins can insert notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      is_admin(auth.uid()) OR
      auth.jwt()->>'role' = 'service_role'
    )
  );

-- Admins can update any notification
CREATE POLICY "Admins can update all notifications"
  ON notifications
  FOR UPDATE
  USING (is_admin(auth.uid()));

-- Admins can delete notifications
CREATE POLICY "Admins can delete notifications"
  ON notifications
  FOR DELETE
  USING (is_admin(auth.uid()));

-- Create function to automatically update read_at timestamp
CREATE OR REPLACE FUNCTION update_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.read = true AND OLD.read = false THEN
    NEW.read_at = TIMEZONE('utc'::text, NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for read_at timestamp
CREATE TRIGGER set_notification_read_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_read_at();

-- Create function to automatically update deleted_at timestamp
CREATE OR REPLACE FUNCTION update_notification_deleted_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted = true AND OLD.deleted = false THEN
    NEW.deleted_at = TIMEZONE('utc'::text, NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for deleted_at timestamp
CREATE TRIGGER set_notification_deleted_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_deleted_at();

-- Comment on table
COMMENT ON TABLE notifications IS 'In-app notifications for users - signals, events, announcements, and system messages';
