-- Create events table for storing event information
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  organizer TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Networking', 'Workshop', 'Webinar', 'Conference', 'Seminar', 'Other')),
  type TEXT NOT NULL CHECK (type IN ('Physical', 'Virtual', 'Hybrid')),
  price_type TEXT NOT NULL CHECK (price_type IN ('Free', 'Paid')) DEFAULT 'Free',
  price DECIMAL(10, 2) DEFAULT 0.00,
  location TEXT,
  capacity INTEGER NOT NULL DEFAULT 100,
  cover_image_url TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  registration_start_date TIMESTAMP WITH TIME ZONE,
  registration_end_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create event_registrations table for tracking user registrations
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registration_status TEXT NOT NULL DEFAULT 'pending' CHECK (registration_status IN ('pending', 'confirmed', 'cancelled', 'attended', 'no_show')),
  payment_status TEXT CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_reference TEXT,
  amount_paid DECIMAL(10, 2) DEFAULT 0.00,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(event_id, user_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_is_featured ON events(is_featured);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(registration_status);
CREATE INDEX IF NOT EXISTS idx_event_registrations_registered_at ON event_registrations(registered_at DESC);

-- Create function to update updated_at timestamp for events
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at for events
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();

-- Create function to update updated_at timestamp for event_registrations
CREATE OR REPLACE FUNCTION update_event_registrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at for event_registrations
CREATE TRIGGER update_event_registrations_updated_at
  BEFORE UPDATE ON event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_event_registrations_updated_at();

-- Create function to get registration count for an event
CREATE OR REPLACE FUNCTION get_event_registration_count(event_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM event_registrations
    WHERE event_id = event_uuid
    AND registration_status IN ('pending', 'confirmed')
  );
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Create policies for events
-- Anyone can read published events
CREATE POLICY "Anyone can read published events"
  ON events
  FOR SELECT
  USING (status = 'published');

-- Authenticated users can read their own events (if they created them)
CREATE POLICY "Users can read their own events"
  ON events
  FOR SELECT
  USING (created_by = auth.uid());

-- Admins can read all events
CREATE POLICY "Admins can read all events"
  ON events
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Only admins can insert/update/delete events
CREATE POLICY "Admins can manage events"
  ON events
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Create policies for event_registrations
-- Users can read their own registrations
CREATE POLICY "Users can read their own registrations"
  ON event_registrations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own registrations
CREATE POLICY "Users can insert their own registrations"
  ON event_registrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own registrations
CREATE POLICY "Users can update their own registrations"
  ON event_registrations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all registrations
CREATE POLICY "Admins can read all registrations"
  ON event_registrations
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can manage all registrations
CREATE POLICY "Admins can manage all registrations"
  ON event_registrations
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));
