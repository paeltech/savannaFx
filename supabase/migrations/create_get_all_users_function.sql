-- Create a function to get all users with their roles
-- This function can be called by admins to view all users

CREATE OR REPLACE FUNCTION get_all_users_with_roles()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  role TEXT,
  role_created_at TIMESTAMP WITH TIME ZONE
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.email,
    u.created_at,
    COALESCE(ur.role, 'user') as role,
    COALESCE(ur.created_at, u.created_at) as role_created_at
  FROM auth.users u
  LEFT JOIN user_roles ur ON u.id = ur.user_id
  ORDER BY u.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users (admin check is inside the function)
GRANT EXECUTE ON FUNCTION get_all_users_with_roles() TO authenticated;
