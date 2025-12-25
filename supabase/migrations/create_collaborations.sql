-- Create collaborations table for partnership and collaboration enquiries
CREATE TABLE IF NOT EXISTS collaborations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT NOT NULL,
  collaboration_type TEXT NOT NULL CHECK (collaboration_type IN ('content', 'affiliate', 'education', 'technology', 'events', 'media', 'influencer', 'strategic', 'other')),
  website TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_collaborations_user_id ON collaborations(user_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_status ON collaborations(status);
CREATE INDEX IF NOT EXISTS idx_collaborations_collaboration_type ON collaborations(collaboration_type);
CREATE INDEX IF NOT EXISTS idx_collaborations_created_at ON collaborations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collaborations_email ON collaborations(email);
CREATE INDEX IF NOT EXISTS idx_collaborations_company ON collaborations(company);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_collaborations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_collaborations_updated_at
  BEFORE UPDATE ON collaborations
  FOR EACH ROW
  EXECUTE FUNCTION update_collaborations_updated_at();

-- Enable Row Level Security
ALTER TABLE collaborations ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can read their own collaborations
CREATE POLICY "Users can read their own collaborations"
  ON collaborations
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Anyone can insert collaborations (for non-authenticated users too)
CREATE POLICY "Anyone can insert collaborations"
  ON collaborations
  FOR INSERT
  WITH CHECK (true);

-- Users can update their own collaborations
CREATE POLICY "Users can update their own collaborations"
  ON collaborations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own collaborations
CREATE POLICY "Users can delete their own collaborations"
  ON collaborations
  FOR DELETE
  USING (auth.uid() = user_id);

