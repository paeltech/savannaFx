-- Add full_name column to user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Create index for faster queries on full_name
CREATE INDEX IF NOT EXISTS idx_user_profiles_full_name ON user_profiles(full_name);

-- Comment on column
COMMENT ON COLUMN user_profiles.full_name IS 'User full name for display purposes';
