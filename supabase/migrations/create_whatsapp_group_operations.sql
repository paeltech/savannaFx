-- Create whatsapp_group_operations table for logging all group operations
CREATE TABLE IF NOT EXISTS whatsapp_group_operations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('create', 'add_member', 'remove_member', 'send_message', 'refresh')),
  group_id UUID REFERENCES whatsapp_groups(id) ON DELETE SET NULL,
  group_jid TEXT, -- Denormalized for quick access
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  phone_number TEXT,
  signal_id UUID REFERENCES signals(id) ON DELETE SET NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  response_data JSONB, -- Store API response for debugging
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_group_operations_type ON whatsapp_group_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_group_operations_group_id ON whatsapp_group_operations(group_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_group_operations_user_id ON whatsapp_group_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_group_operations_success ON whatsapp_group_operations(success);
CREATE INDEX IF NOT EXISTS idx_whatsapp_group_operations_created_at ON whatsapp_group_operations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE whatsapp_group_operations ENABLE ROW LEVEL SECURITY;

-- Create policies for whatsapp_group_operations
-- Admins can read all operations
CREATE POLICY "Admins can read all operations"
  ON whatsapp_group_operations
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Service role can insert operations (for edge functions)
CREATE POLICY "Service role can insert operations"
  ON whatsapp_group_operations
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
