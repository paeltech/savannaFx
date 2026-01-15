-- =============================================================================
-- MOBILE APP DATABASE SETUP
-- Run this file in Supabase SQL Editor to set up all required tables
-- for the mobile app profile, notifications, and preferences features
-- =============================================================================

-- 1. Add full_name column to user_profiles table (if not exists)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
CREATE INDEX IF NOT EXISTS idx_user_profiles_full_name ON user_profiles(full_name);
COMMENT ON COLUMN user_profiles.full_name IS 'User full name for display purposes';

-- 2. Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Email Notification Preferences
  email_signals BOOLEAN DEFAULT true,
  email_analyses BOOLEAN DEFAULT true,
  email_events BOOLEAN DEFAULT true,
  email_courses BOOLEAN DEFAULT true,
  
  -- Push Notification Preferences
  push_signals BOOLEAN DEFAULT true,
  push_analyses BOOLEAN DEFAULT true,
  push_events BOOLEAN DEFAULT true,
  push_courses BOOLEAN DEFAULT true,
  
  -- Marketing Preferences
  marketing_emails BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can insert their own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can update their own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Admins can read all notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Admins can manage all notification preferences" ON notification_preferences;

-- Create policies
CREATE POLICY "Users can read their own notification preferences"
  ON notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
  ON notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
  ON notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all notification preferences"
  ON notification_preferences
  FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all notification preferences"
  ON notification_preferences
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Create function to auto-create preferences on signup
CREATE OR REPLACE FUNCTION create_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Error in create_notification_preferences for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created_notification_prefs ON auth.users;
CREATE TRIGGER on_auth_user_created_notification_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_preferences();

-- Add comment
COMMENT ON TABLE notification_preferences IS 'User notification preferences for email and push notifications';

-- =============================================================================
-- Create default preferences for existing users
-- =============================================================================
INSERT INTO notification_preferences (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- =============================================================================
-- VERIFICATION QUERIES
-- Run these to verify the setup was successful
-- =============================================================================

-- Verify notification_preferences table exists
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'notification_preferences' 
ORDER BY ordinal_position;

-- Verify user_profiles has full_name column
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND column_name = 'full_name';

-- Count notification preferences records
SELECT COUNT(*) as total_preferences FROM notification_preferences;

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE '✓ Mobile app database setup completed successfully!';
  RAISE NOTICE '✓ notification_preferences table created';
  RAISE NOTICE '✓ user_profiles.full_name column added';
  RAISE NOTICE '✓ Default preferences created for existing users';
  RAISE NOTICE '✓ All policies and triggers configured';
END $$;
