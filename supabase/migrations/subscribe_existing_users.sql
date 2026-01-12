-- Subscribe existing users who are not subscribed to monthly signals
-- This migration ensures all existing users with phone numbers have a monthly subscription

-- Insert monthly subscription for all users who:
-- 1. Don't have an active subscription
-- 2. Have a phone number in their user profile
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
SELECT 
  u.id as user_id,
  sp.id as pricing_id,
  'monthly' as subscription_type,
  'active' as status,
  'completed' as payment_status,
  0.00 as amount_paid, -- Free subscription for existing users
  true as whatsapp_notifications,
  true as email_notifications,
  false as telegram_notifications,
  TIMEZONE('utc'::text, NOW()) as start_date,
  TIMEZONE('utc'::text, NOW()) + INTERVAL '1 month' as end_date
FROM auth.users u
INNER JOIN user_profiles up ON u.id = up.id
CROSS JOIN signal_pricing sp
WHERE sp.pricing_type = 'monthly' AND sp.is_active = true
  -- Only subscribe users who have a phone number
  AND up.phone_number IS NOT NULL
  AND TRIM(up.phone_number) != ''
  -- Only subscribe users who don't have an active subscription
  AND NOT EXISTS (
    SELECT 1 
    FROM signal_subscriptions ss 
    WHERE ss.user_id = u.id 
      AND ss.status = 'active'
  )
ON CONFLICT DO NOTHING; -- Prevent duplicate subscriptions if migration is run multiple times

-- Log the number of users subscribed and how many were skipped
DO $$
DECLARE
  subscribed_count INTEGER;
  users_with_phone INTEGER;
  users_without_phone INTEGER;
BEGIN
  -- Count users with active subscriptions
  SELECT COUNT(*) INTO subscribed_count
  FROM signal_subscriptions
  WHERE status = 'active' AND subscription_type = 'monthly';
  
  -- Count users with phone numbers
  SELECT COUNT(*) INTO users_with_phone
  FROM auth.users u
  INNER JOIN user_profiles up ON u.id = up.id
  WHERE up.phone_number IS NOT NULL AND TRIM(up.phone_number) != '';
  
  -- Count users without phone numbers
  SELECT COUNT(*) INTO users_without_phone
  FROM auth.users u
  LEFT JOIN user_profiles up ON u.id = up.id
  WHERE up.phone_number IS NULL OR TRIM(up.phone_number) = '';
  
  RAISE NOTICE 'Migration completed:';
  RAISE NOTICE '  - % users now have active monthly subscriptions', subscribed_count;
  RAISE NOTICE '  - % users with phone numbers (eligible for subscription)', users_with_phone;
  RAISE NOTICE '  - % users without phone numbers (skipped)', users_without_phone;
END $$;
