-- Enquiries table for Help & Support (timestamped so `supabase db push` applies it reliably)
CREATE TABLE IF NOT EXISTS enquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  enquiry_type TEXT NOT NULL CHECK (enquiry_type IN ('general', 'trading', 'signals', 'course', 'mentorship', 'technical', 'billing', 'partnership', 'other')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_enquiries_user_id ON enquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_enquiry_type ON enquiries(enquiry_type);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON enquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiries_email ON enquiries(email);

CREATE OR REPLACE FUNCTION update_enquiries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_enquiries_updated_at ON enquiries;
CREATE TRIGGER update_enquiries_updated_at
  BEFORE UPDATE ON enquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_enquiries_updated_at();

ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own enquiries" ON enquiries;
CREATE POLICY "Users can read their own enquiries"
  ON enquiries
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Anyone can insert enquiries" ON enquiries;
CREATE POLICY "Anyone can insert enquiries"
  ON enquiries
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own enquiries" ON enquiries;
CREATE POLICY "Users can update their own enquiries"
  ON enquiries
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own enquiries" ON enquiries;
CREATE POLICY "Users can delete their own enquiries"
  ON enquiries
  FOR DELETE
  USING (auth.uid() = user_id);
