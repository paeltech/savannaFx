-- ============================================
-- WhatsApp Group-Based Messaging System
-- Migration Script - Run in Supabase SQL Editor
-- ============================================
-- 
-- Instructions:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Run this script in order
-- 3. Enable pg_net extension if not already enabled (Database > Extensions)
-- 4. Set up cron job using Supabase Cron Jobs feature
--
-- ============================================

-- Step 1: Create whatsapp_groups table
\i create_whatsapp_groups.sql

-- Step 2: Create whatsapp_group_operations table
\i create_whatsapp_group_operations.sql

-- Step 3: Add group membership columns to signal_subscriptions
\i add_group_membership_to_subscriptions.sql

-- Step 4: Create increment member count function
\i create_increment_group_member_count_function.sql

-- Step 5: Create add to group trigger
\i create_add_to_group_trigger.sql

-- Step 6: Create remove from group trigger
\i create_remove_from_group_trigger.sql

-- Step 7: Create monthly refresh function
\i create_monthly_group_refresh_job.sql

-- Note: The \i commands above won't work in Supabase SQL Editor
-- Instead, copy and paste each migration file's contents in order
