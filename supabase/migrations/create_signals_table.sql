-- Create signals table for storing trading signals
CREATE TABLE IF NOT EXISTS signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Signal Details
  trading_pair TEXT NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('buy', 'sell')),
  entry_price DECIMAL(10, 5) NOT NULL,
  stop_loss DECIMAL(10, 5) NOT NULL,
  take_profit_1 DECIMAL(10, 5),
  take_profit_2 DECIMAL(10, 5),
  take_profit_3 DECIMAL(10, 5),
  
  -- Analysis
  title TEXT NOT NULL,
  analysis TEXT,
  risk_reward_ratio DECIMAL(5, 2),
  confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high')),
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
  result TEXT DEFAULT 'pending' CHECK (result IN ('win', 'loss', 'breakeven', 'pending')),
  
  -- Metadata
  chart_image_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_signals_trading_pair ON signals(trading_pair);
CREATE INDEX IF NOT EXISTS idx_signals_status ON signals(status);
CREATE INDEX IF NOT EXISTS idx_signals_signal_type ON signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_signals_created_at ON signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_created_by ON signals(created_by);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_signals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_signals_updated_at
  BEFORE UPDATE ON signals
  FOR EACH ROW
  EXECUTE FUNCTION update_signals_updated_at();

-- Enable Row Level Security
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;

-- Create policies for signals
-- Anyone can read active signals
CREATE POLICY "Anyone can read active signals"
  ON signals
  FOR SELECT
  USING (status = 'active');

-- Users can read all signals (including closed ones)
CREATE POLICY "Authenticated users can read all signals"
  ON signals
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can manage signals
CREATE POLICY "Admins can manage signals"
  ON signals
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));
