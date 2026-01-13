-- Add default 'user' role to all existing users who don't have a role
-- This ensures all users have a role entry in the user_roles table

-- Insert 'user' role for all auth.users who don't have a role yet
INSERT INTO user_roles (user_id, role)
SELECT 
  u.id as user_id,
  'user' as role
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Create function to automatically assign default 'user' role to new users
-- This function is designed to be safe and not fail user creation
CREATE OR REPLACE FUNCTION assign_default_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Wrap in exception handler to prevent errors from blocking user creation
  BEGIN
    -- Insert default 'user' role for new user
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail user creation
      -- In production, you might want to log this to a table
      RAISE WARNING 'Error in assign_default_user_role for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;

-- Create trigger to automatically assign 'user' role when user signs up
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION assign_default_user_role();
