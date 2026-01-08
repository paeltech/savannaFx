-- Create signal_pricing table for configurable pricing options
CREATE TABLE IF NOT EXISTS signal_pricing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pricing_type TEXT NOT NULL CHECK (pricing_type IN ('monthly', 'per_pip')),
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(pricing_type)
);

-- Create signal_subscriptions table for tracking user subscriptions
CREATE TABLE IF NOT EXISTS signal_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pricing_id UUID NOT NULL REFERENCES signal_pricing(id) ON DELETE RESTRICT,
  subscription_type TEXT NOT NULL CHECK (subscription_type IN ('monthly', 'per_pip')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  payment_reference TEXT,
  amount_paid DECIMAL(10, 2) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  pips_purchased INTEGER DEFAULT 0,
  pips_used INTEGER DEFAULT 0,
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_signal_pricing_type ON signal_pricing(pricing_type);
CREATE INDEX IF NOT EXISTS idx_signal_pricing_active ON signal_pricing(is_active);
CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_user_id ON signal_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_pricing_id ON signal_subscriptions(pricing_id);
CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_status ON signal_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_type ON signal_subscriptions(subscription_type);
CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_created_at ON signal_subscriptions(created_at DESC);

-- Create function to update updated_at timestamp for signal_pricing
CREATE OR REPLACE FUNCTION update_signal_pricing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at for signal_pricing
CREATE TRIGGER update_signal_pricing_updated_at
  BEFORE UPDATE ON signal_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_signal_pricing_updated_at();

-- Create function to update updated_at timestamp for signal_subscriptions
CREATE OR REPLACE FUNCTION update_signal_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at for signal_subscriptions
CREATE TRIGGER update_signal_subscriptions_updated_at
  BEFORE UPDATE ON signal_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_signal_subscriptions_updated_at();

-- Enable Row Level Security
ALTER TABLE signal_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for signal_pricing
-- Anyone can read active pricing
CREATE POLICY "Anyone can read active pricing"
  ON signal_pricing
  FOR SELECT
  USING (is_active = true);

-- Admins can read all pricing
CREATE POLICY "Admins can read all pricing"
  ON signal_pricing
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Only admins can manage pricing
CREATE POLICY "Admins can manage pricing"
  ON signal_pricing
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Create policies for signal_subscriptions
-- Users can read their own subscriptions
CREATE POLICY "Users can read their own subscriptions"
  ON signal_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert their own subscriptions"
  ON signal_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions
CREATE POLICY "Users can update their own subscriptions"
  ON signal_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all subscriptions
CREATE POLICY "Admins can read all subscriptions"
  ON signal_subscriptions
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can manage all subscriptions
CREATE POLICY "Admins can manage all subscriptions"
  ON signal_subscriptions
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Insert default pricing options
INSERT INTO signal_pricing (pricing_type, price, currency, description, features, is_active)
VALUES 
  (
    'monthly',
    50.00,
    'USD',
    'Unlimited signals for one month',
    '["Daily verified signals", "Institutional-level risk guidance", "Weekly market outlook", "Signals vault access", "Private Telegram access", "Mobile-first delivery"]'::jsonb,
    true
  ),
  (
    'per_pip',
    0.50,
    'USD',
    'Pay per pip gained from signals',
    '["Pay only for profitable pips", "All signal features included", "No monthly commitment", "Flexible usage"]'::jsonb,
    true
  )
ON CONFLICT (pricing_type) DO NOTHING;
