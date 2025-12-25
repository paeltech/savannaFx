-- Create sentiment_votes table for community sentiment polling
CREATE TABLE IF NOT EXISTS sentiment_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency_pair TEXT NOT NULL CHECK (currency_pair IN ('EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'EUR/GBP', 'XAU/USD')),
  sentiment TEXT NOT NULL CHECK (sentiment IN ('bullish', 'bearish', 'neutral')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, currency_pair)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sentiment_votes_currency_pair ON sentiment_votes(currency_pair);
CREATE INDEX IF NOT EXISTS idx_sentiment_votes_user_id ON sentiment_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_votes_created_at ON sentiment_votes(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_sentiment_votes_updated_at
  BEFORE UPDATE ON sentiment_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE sentiment_votes ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can read all votes
CREATE POLICY "Anyone can read sentiment votes"
  ON sentiment_votes
  FOR SELECT
  USING (true);

-- Users can insert their own votes
CREATE POLICY "Users can insert their own votes"
  ON sentiment_votes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own votes
CREATE POLICY "Users can update their own votes"
  ON sentiment_votes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own votes
CREATE POLICY "Users can delete their own votes"
  ON sentiment_votes
  FOR DELETE
  USING (auth.uid() = user_id);



