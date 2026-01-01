-- Create trade_analyses table for storing daily trading pair analyses
CREATE TABLE IF NOT EXISTS trade_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trading_pair TEXT NOT NULL,
  analysis_date DATE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  technical_analysis JSONB,
  fundamental_analysis JSONB,
  entry_levels JSONB,
  exit_levels JSONB,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(trading_pair, analysis_date)
);

-- Create trade_analysis_purchases table for tracking user purchases
CREATE TABLE IF NOT EXISTS trade_analysis_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trade_analysis_id UUID NOT NULL REFERENCES trade_analyses(id) ON DELETE CASCADE,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  payment_reference TEXT,
  amount_paid DECIMAL(10, 2) NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, trade_analysis_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_trade_analyses_trading_pair ON trade_analyses(trading_pair);
CREATE INDEX IF NOT EXISTS idx_trade_analyses_analysis_date ON trade_analyses(analysis_date DESC);
CREATE INDEX IF NOT EXISTS idx_trade_analyses_created_at ON trade_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_analysis_purchases_user_id ON trade_analysis_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_analysis_purchases_trade_analysis_id ON trade_analysis_purchases(trade_analysis_id);
CREATE INDEX IF NOT EXISTS idx_trade_analysis_purchases_payment_status ON trade_analysis_purchases(payment_status);
CREATE INDEX IF NOT EXISTS idx_trade_analysis_purchases_purchased_at ON trade_analysis_purchases(purchased_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_trade_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_trade_analyses_updated_at
  BEFORE UPDATE ON trade_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_trade_analyses_updated_at();

-- Enable Row Level Security
ALTER TABLE trade_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_analysis_purchases ENABLE ROW LEVEL SECURITY;

-- Create policies for trade_analyses
-- Anyone can read available analyses (to see what's available for purchase)
CREATE POLICY "Anyone can read trade analyses"
  ON trade_analyses
  FOR SELECT
  USING (true);

-- Only authenticated users with admin role can insert/update/delete analyses
-- For now, we'll allow service role to manage this, or you can add a user_roles table later
CREATE POLICY "Service role can manage trade analyses"
  ON trade_analyses
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create policies for trade_analysis_purchases
-- Users can read their own purchases
CREATE POLICY "Users can read their own purchases"
  ON trade_analysis_purchases
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own purchases
CREATE POLICY "Users can insert their own purchases"
  ON trade_analysis_purchases
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own purchases (for payment status updates)
CREATE POLICY "Users can update their own purchases"
  ON trade_analysis_purchases
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
