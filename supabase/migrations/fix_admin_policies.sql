-- Fix script to resolve infinite recursion in admin policies
-- Run this in Supabase SQL Editor if you're getting recursion errors

-- First, ensure the is_admin function exists and is correct
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_uuid AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate user_roles policies to use the function
DROP POLICY IF EXISTS "Admins can read all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;

-- Recreate with function to avoid recursion
CREATE POLICY "Admins can read all roles"
  ON user_roles
  FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage roles"
  ON user_roles
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Fix policies for other tables
DO $$
BEGIN
  -- Fix enquiries policies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enquiries') THEN
    DROP POLICY IF EXISTS "Admins can manage all enquiries" ON enquiries;
    CREATE POLICY "Admins can manage all enquiries"
      ON enquiries
      FOR ALL
      USING (is_admin(auth.uid()))
      WITH CHECK (is_admin(auth.uid()));
  END IF;

  -- Fix collaborations policies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collaborations') THEN
    DROP POLICY IF EXISTS "Admins can manage all collaborations" ON collaborations;
    CREATE POLICY "Admins can manage all collaborations"
      ON collaborations
      FOR ALL
      USING (is_admin(auth.uid()))
      WITH CHECK (is_admin(auth.uid()));
  END IF;

  -- Fix trade_analyses policies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trade_analyses') THEN
    DROP POLICY IF EXISTS "Admins can manage trade analyses" ON trade_analyses;
    CREATE POLICY "Admins can manage trade analyses"
      ON trade_analyses
      FOR ALL
      USING (is_admin(auth.uid()))
      WITH CHECK (is_admin(auth.uid()));
  END IF;

  -- Fix trade_analysis_purchases policies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trade_analysis_purchases') THEN
    DROP POLICY IF EXISTS "Admins can read all purchases" ON trade_analysis_purchases;
    CREATE POLICY "Admins can read all purchases"
      ON trade_analysis_purchases
      FOR SELECT
      USING (is_admin(auth.uid()));
  END IF;

  -- Fix sentiment_votes policies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sentiment_votes') THEN
    DROP POLICY IF EXISTS "Admins can read all sentiment votes" ON sentiment_votes;
    CREATE POLICY "Admins can read all sentiment votes"
      ON sentiment_votes
      FOR SELECT
      USING (is_admin(auth.uid()));
  END IF;
END $$;
