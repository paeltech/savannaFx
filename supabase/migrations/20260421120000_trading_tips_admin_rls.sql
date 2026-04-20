-- Allow admins to manage trading_tips (full CRUD + read inactive rows).
-- Non-admin authenticated users keep read access to active rows only (existing policy).

CREATE POLICY "Admins can read all trading tips"
  ON trading_tips FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert trading tips"
  ON trading_tips FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update trading tips"
  ON trading_tips FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete trading tips"
  ON trading_tips FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

COMMENT ON POLICY "Admins can read all trading tips" ON trading_tips IS 'Admin dashboard: list inactive and active tips';
