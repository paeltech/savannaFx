-- Create app_settings table to store configuration values
-- This avoids needing superuser privileges for ALTER DATABASE

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create function to get setting value
CREATE OR REPLACE FUNCTION get_app_setting(setting_key TEXT)
RETURNS TEXT AS $$
DECLARE
  setting_value TEXT;
BEGIN
  SELECT value INTO setting_value
  FROM app_settings
  WHERE key = setting_key;
  
  RETURN setting_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default settings (can be updated via SQL or admin UI)
INSERT INTO app_settings (key, value, description)
VALUES 
  ('edge_function_url', 'https://iurstpwtdnlmpvwyhqfn.supabase.co/functions/v1/manage-whatsapp-groups', 'Base URL for edge functions'),
  ('service_role_key', '', 'Service role key for edge function authentication')
ON CONFLICT (key) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Admins can read settings
CREATE POLICY "Admins can read settings"
  ON app_settings
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Service role can read settings
CREATE POLICY "Service role can read settings"
  ON app_settings
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Admins can update settings
CREATE POLICY "Admins can update settings"
  ON app_settings
  FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Service role can update settings
CREATE POLICY "Service role can update settings"
  ON app_settings
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
