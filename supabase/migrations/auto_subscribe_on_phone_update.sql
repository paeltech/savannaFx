-- Auto-subscribe users when they add a phone number to their profile
-- This trigger subscribes users to monthly signals when they update their profile with a phone number
-- This handles cases where users sign up without a phone number initially

-- Create function to subscribe user when phone number is added
CREATE OR REPLACE FUNCTION auto_subscribe_on_phone_update()
RETURNS TRIGGER AS $$
DECLARE
  monthly_pricing_id UUID;
BEGIN
  -- Only proceed if phone number was just added (was NULL/empty, now has value)
  IF (OLD.phone_number IS NULL OR TRIM(OLD.phone_number) = '') 
     AND NEW.phone_number IS NOT NULL 
     AND TRIM(NEW.phone_number) != '' THEN
    
    -- Get the monthly pricing ID
    SELECT id INTO monthly_pricing_id
    FROM signal_pricing
    WHERE pricing_type = 'monthly' AND is_active = true
    LIMIT 1;

    -- Only create subscription if monthly pricing exists
    IF monthly_pricing_id IS NOT NULL THEN
      -- Check if user already has an active subscription (prevent duplicates)
      IF NOT EXISTS (
        SELECT 1 FROM signal_subscriptions 
        WHERE user_id = NEW.id AND status = 'active'
      ) THEN
        -- Create monthly subscription for user
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
          0.00, -- Free subscription
          true, -- Enable WhatsApp notifications
          true, -- Enable email notifications
          false, -- Disable Telegram by default
          TIMEZONE('utc'::text, NOW()),
          TIMEZONE('utc'::text, NOW()) + INTERVAL '1 month'
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_user_profile_phone_update ON user_profiles;

-- Create trigger to subscribe users when they add a phone number
CREATE TRIGGER on_user_profile_phone_update
  AFTER UPDATE ON user_profiles
  FOR EACH ROW
  WHEN (OLD.phone_number IS DISTINCT FROM NEW.phone_number)
  EXECUTE FUNCTION auto_subscribe_on_phone_update();
