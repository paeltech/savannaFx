-- Export emails to CSV
-- Run this in Supabase SQL Editor and copy the results
-- Or use the COPY command to export directly

-- Option 1: Simple query (copy results manually)
SELECT 
  u.id as "User ID",
  u.email as "Email",
  u.email_confirmed_at as "Email Confirmed At",
  up.full_name as "Full Name",
  up.phone_number as "Phone Number",
  up.phone_verified as "Phone Verified",
  up.email_notifications_enabled as "Email Notifications Enabled",
  up.whatsapp_notifications_enabled as "WhatsApp Notifications Enabled",
  u.created_at as "User Created At",
  up.created_at as "Profile Created At",
  up.updated_at as "Profile Updated At"
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
WHERE u.email IS NOT NULL
  AND TRIM(u.email) != ''
ORDER BY u.created_at DESC;

-- Option 2: Export to CSV using COPY (requires superuser privileges)
-- Uncomment and run if you have superuser access:
/*
COPY (
  SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    up.full_name,
    up.phone_number,
    up.phone_verified,
    up.email_notifications_enabled,
    up.whatsapp_notifications_enabled,
    u.created_at,
    up.created_at as profile_created_at,
    up.updated_at as profile_updated_at
  FROM auth.users u
  LEFT JOIN user_profiles up ON u.id = up.id
  WHERE u.email IS NOT NULL
    AND TRIM(u.email) != ''
  ORDER BY u.created_at DESC
) TO '/tmp/emails-export.csv' WITH CSV HEADER;
*/

-- Option 3: Get summary statistics
SELECT 
  COUNT(*) as "Total Emails",
  COUNT(*) FILTER (WHERE u.email_confirmed_at IS NOT NULL) as "Email Confirmed",
  COUNT(*) FILTER (WHERE up.phone_verified = true) as "Phone Verified",
  COUNT(*) FILTER (WHERE up.email_notifications_enabled = true) as "Email Notifications Enabled",
  COUNT(*) FILTER (WHERE up.whatsapp_notifications_enabled = true) as "WhatsApp Notifications Enabled"
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
WHERE u.email IS NOT NULL
  AND TRIM(u.email) != '';
