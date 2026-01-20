-- Export phone numbers to CSV
-- Run this in Supabase SQL Editor and copy the results
-- Or use the COPY command to export directly

-- Option 1: Simple query (copy results manually)
SELECT 
  up.id as "User ID",
  u.email as "Email",
  up.phone_number as "Phone Number",
  up.phone_verified as "Phone Verified",
  up.whatsapp_notifications_enabled as "WhatsApp Enabled",
  up.email_notifications_enabled as "Email Enabled",
  up.created_at as "Created At",
  up.updated_at as "Updated At"
FROM user_profiles up
LEFT JOIN auth.users u ON up.id = u.id
WHERE up.phone_number IS NOT NULL
  AND TRIM(up.phone_number) != ''
ORDER BY up.created_at DESC;

-- Option 2: Export to CSV using COPY (requires superuser privileges)
-- Uncomment and run if you have superuser access:
/*
COPY (
  SELECT 
    up.id,
    u.email,
    up.phone_number,
    up.phone_verified,
    up.whatsapp_notifications_enabled,
    up.email_notifications_enabled,
    up.created_at,
    up.updated_at
  FROM user_profiles up
  LEFT JOIN auth.users u ON up.id = u.id
  WHERE up.phone_number IS NOT NULL
    AND TRIM(up.phone_number) != ''
  ORDER BY up.created_at DESC
) TO '/tmp/phone-numbers-export.csv' WITH CSV HEADER;
*/

-- Option 3: Get summary statistics
SELECT 
  COUNT(*) as "Total Phone Numbers",
  COUNT(*) FILTER (WHERE phone_verified = true) as "Verified",
  COUNT(*) FILTER (WHERE whatsapp_notifications_enabled = true) as "WhatsApp Enabled",
  COUNT(*) FILTER (WHERE email_notifications_enabled = true) as "Email Enabled"
FROM user_profiles
WHERE phone_number IS NOT NULL
  AND TRIM(phone_number) != '';
