-- Auto-subscribe new users to monthly signals
-- This trigger automatically creates a monthly subscription when a new user signs up
-- Only subscribes users who have a phone number in their user profile

-- Create function to automatically subscribe new users to monthly signals
CREATE OR REPLACE FUNCTION auto_subscribe_new_user()
RETURNS TRIGGER AS $$
DECLARE
  monthly_pricing_id UUID;
  user_phone_number TEXT;
BEGIN
  -- Get the monthly pricing ID
  SELECT id INTO monthly_pricing_id
  FROM signal_pricing
  WHERE pricing_type = 'monthly' AND is_active = true
  LIMIT 1;

  -- Only create subscription if monthly pricing exists
  IF monthly_pricing_id IS NOT NULL THEN
    -- Check if user has a phone number in their profile
    SELECT phone_number INTO user_phone_number
    FROM user_profiles
    WHERE id = NEW.id;

    -- Only subscribe if user has a phone number
    IF user_phone_number IS NOT NULL AND TRIM(user_phone_number) != '' THEN
      -- Check if user already has an active subscription (prevent duplicates)
      IF NOT EXISTS (
        SELECT 1 FROM signal_subscriptions 
        WHERE user_id = NEW.id AND status = 'active'
      ) THEN
        -- Create monthly subscription for new user
        INSERT INTO signal_subscriptions (
          user_id,
          pricing_id,
          subscription_type,
          status,
          payment_status,
          amount_paid,
          whatsapp_notifications,
          email_notifications,
          telegram_notifications,
          start_date,
          end_date
        )
        VALUES (
          NEW.id,
          monthly_pricing_id,
          'monthly',
          'active',
          'completed',
          0.00, -- Free subscription for new users
          true, -- Enable WhatsApp notifications
          true, -- Enable email notifications
          false, -- Disable Telegram by default
          TIMEZONE('utc'::text, NOW()),
          TIMEZONE('utc'::text, NOW()) + INTERVAL '1 month' -- Set end date to 1 month from now
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;

-- Create trigger to automatically subscribe new users when they sign up
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_subscribe_new_user();
