-- ============================================
-- Set Service Role Key for WhatsApp Groups
-- ============================================
-- 
-- IMPORTANT: Replace YOUR_SERVICE_ROLE_KEY with your actual service role key
-- 
-- To get your service role key:
-- 1. Go to Supabase Dashboard > Settings > API
-- 2. Copy the "service_role" key
-- 3. Replace YOUR_SERVICE_ROLE_KEY below
-- 4. Run this SQL in Supabase SQL Editor
--
-- ============================================

UPDATE app_settings 
SET value = 'YOUR_SERVICE_ROLE_KEY',
    updated_at = NOW()
WHERE key = 'service_role_key';

-- Verify the update
SELECT key, 
       CASE 
         WHEN key = 'service_role_key' THEN '***HIDDEN***'
         ELSE value 
       END as value,
       description,
       updated_at
FROM app_settings
ORDER BY key;
