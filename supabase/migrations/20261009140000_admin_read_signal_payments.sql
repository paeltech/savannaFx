-- Admins need to see every mobile-money attempt, not only their own row.
DROP POLICY IF EXISTS "Admins can read signal payments" ON public.signal_payments;
CREATE POLICY "Admins can read signal payments"
  ON public.signal_payments
  FOR SELECT
  USING (is_admin(auth.uid()));
