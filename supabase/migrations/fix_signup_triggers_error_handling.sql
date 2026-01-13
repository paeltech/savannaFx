-- Fix signup triggers with proper error handling
-- This migration ensures triggers don't fail user creation if there are issues
-- IMPORTANT: Run this migration to fix the "Database error saving new user" issue

-- Update create_user_profile function with error handling
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Wrap in exception handler to prevent errors from blocking user creation
  BEGIN
    INSERT INTO public.user_profiles (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail user creation
      RAISE WARNING 'Error in create_user_profile for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update assign_default_user_role function with error handling
CREATE OR REPLACE FUNCTION assign_default_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Wrap in exception handler to prevent errors from blocking user creation
  BEGIN
    -- Insert default 'user' role for new user
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail user creation
      RAISE WARNING 'Error in assign_default_user_role for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update auto_subscribe_new_user function with error handling
-- Note: This function is disabled during signup because phone number isn't available yet
-- The phone_update trigger will handle subscription when phone is added via update_user_profile_on_signup
-- This function is kept for backward compatibility but won't execute during normal signup flow
CREATE OR REPLACE FUNCTION auto_subscribe_new_user()
RETURNS TRIGGER AS $$
DECLARE
  monthly_pricing_id UUID;
  user_phone_number TEXT;
  has_notification_columns BOOLEAN;
BEGIN
  -- Wrap in exception handler to prevent errors from blocking user creation
  BEGIN
    -- Check if notification columns exist (they might not if migration hasn't run)
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'signal_subscriptions' 
      AND column_name = 'whatsapp_notifications'
    ) INTO has_notification_columns;

    -- Get the monthly pricing ID
    SELECT id INTO monthly_pricing_id
    FROM signal_pricing
    WHERE pricing_type = 'monthly' AND is_active = true
    LIMIT 1;

    -- Only create subscription if monthly pricing exists
    IF monthly_pricing_id IS NOT NULL THEN
      -- Check if user has a phone number in their profile
      -- Note: Profile might not exist yet or phone might not be set
      -- This is OK - the phone_update trigger will handle subscription
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
          -- Handle both cases: with and without notification columns
          IF has_notification_columns THEN
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
          ELSE
            -- Fallback if notification columns don't exist yet
            INSERT INTO signal_subscriptions (
              user_id,
              pricing_id,
              subscription_type,
              status,
              payment_status,
              amount_paid,
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
              TIMEZONE('utc'::text, NOW()),
              TIMEZONE('utc'::text, NOW()) + INTERVAL '1 month' -- Set end date to 1 month from now
            );
          END IF;
        END IF;
      END IF;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail user creation
      -- The phone_update trigger will handle subscription when phone is added
      RAISE WARNING 'Error in auto_subscribe_new_user for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
