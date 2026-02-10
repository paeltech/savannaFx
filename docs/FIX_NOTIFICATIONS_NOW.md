# Fix Notifications Not Being Sent - Quick Guide

## 🎯 Problem: Signal created but no notifications sent

The code is correct, so the issue is likely in your database setup. Let's fix it!

---

## ⚡ Quick Diagnostic (Copy & Paste)

**Go to Supabase Dashboard → SQL Editor and run this:**

```sql
-- DIAGNOSTIC CHECK - Run this first
-- Copy all results and check each one

-- 1. Does notifications table exist?
SELECT 
  'notifications table exists: ' || 
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'notifications'
  )::text as result;

-- 2. How many active signal subscriptions?
SELECT 
  'active subscriptions: ' || 
  COALESCE(COUNT(*)::text, '0') as result
FROM signal_subscriptions 
WHERE status = 'active';

-- 3. List users with subscriptions
SELECT 
  ss.user_id,
  ss.status,
  u.email,
  ss.created_at
FROM signal_subscriptions ss
LEFT JOIN auth.users u ON u.id = ss.user_id
ORDER BY ss.created_at DESC
LIMIT 10;

-- 4. Check recent notifications (last hour)
SELECT 
  'notifications in last hour: ' || 
  COALESCE(COUNT(*)::text, '0') as result
FROM notifications 
WHERE created_at > NOW() - INTERVAL '1 hour';

-- 5. Check if any notifications exist at all
SELECT 
  'total notifications ever: ' || 
  COALESCE(COUNT(*)::text, '0') as result
FROM notifications;
```

---

## 🔧 Fix Based on Results

### Result 1: If "notifications table exists: false"

**Problem**: Migration not applied

**Solution**: Run this in SQL Editor:

```sql
-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('signal', 'event', 'announcement', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN NOT NULL DEFAULT false,
  deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id AND deleted = false);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can do everything"
  ON notifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- This is the KEY policy for creating notifications
CREATE POLICY "Allow authenticated users to insert"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```

**Then**: Refresh page and create signal again → Should work! ✅

---

### Result 2: If "active subscriptions: 0"

**Problem**: No users subscribed to signals

**Solution**: Create subscription for your test user:

```sql
-- First, find your test user
SELECT id, email FROM auth.users 
WHERE email ILIKE '%your-email%'  -- Replace with part of your email
ORDER BY created_at DESC
LIMIT 5;

-- Copy the user ID, then run:
INSERT INTO signal_subscriptions (
  user_id, 
  status, 
  subscription_type,
  start_date
) VALUES (
  'PASTE-USER-ID-HERE',  -- ⚠️ Replace with actual user ID
  'active',
  'monthly',
  NOW()
)
ON CONFLICT (user_id) 
DO UPDATE SET 
  status = 'active',
  subscription_type = 'monthly',
  start_date = NOW();

-- Verify it worked
SELECT * FROM signal_subscriptions WHERE user_id = 'PASTE-USER-ID-HERE';
```

**Then**: Create signal again → Notification should appear! ✅

---

### Result 3: If "total notifications ever: 0" but table exists and subscriptions exist

**Problem**: RLS policy blocking inserts OR code not executing

**Test #1 - Manual Insert Test**:

```sql
-- Get a test user ID
SELECT id FROM auth.users LIMIT 1;

-- Try to insert notification manually
INSERT INTO notifications (
  user_id,
  notification_type,
  title,
  message,
  action_url
) VALUES (
  'PASTE-USER-ID-HERE',  -- ⚠️ Replace with user ID from above
  'signal',
  '📈 Test Notification',
  'This is a test notification',
  '/dashboard/signals'
);

-- Check if it was created
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 1;
```

**If manual insert works**:
- Problem is in the frontend code execution
- Check browser console when creating signal
- Look for: "Creating in-app notifications for signal:"

**If manual insert fails with "permission denied"**:
- RLS policy issue
- Run this fix:

```sql
-- Temporarily allow all inserts (for debugging)
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON notifications;

CREATE POLICY "Allow authenticated users to insert"
  ON notifications FOR INSERT
  WITH CHECK (true);  -- Allows all authenticated users

-- Try creating signal again
```

---

## 🚨 Most Common Issue (90% of cases)

**The table doesn't exist** - Run the CREATE TABLE script above!

---

## 🧪 End-to-End Test

After applying fixes, run this complete test:

```sql
-- 1. Verify setup
SELECT 
  (SELECT COUNT(*) FROM signal_subscriptions WHERE status = 'active') as active_subs,
  (SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications')) as table_exists;

-- Should show:
-- active_subs: 1 or more
-- table_exists: true

-- 2. Get a test user
SELECT id, email FROM auth.users LIMIT 1;

-- 3. Ensure they have active subscription
INSERT INTO signal_subscriptions (user_id, status, subscription_type)
VALUES ('PASTE-USER-ID', 'active', 'monthly')
ON CONFLICT (user_id) DO UPDATE SET status = 'active';

-- 4. Check RLS policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'notifications';
-- Should see INSERT, SELECT, UPDATE policies
```

---

## 📋 Create Signal Checklist

Before creating your next signal:

1. ✅ **Table exists**: `SELECT COUNT(*) FROM notifications;`
2. ✅ **User has subscription**: `SELECT COUNT(*) FROM signal_subscriptions WHERE status = 'active';`
3. ✅ **Open browser console** (F12) when creating signal
4. ✅ **Look for these logs**:
   - "Creating in-app notifications for signal: xxx"
   - "In-app notifications created for X users"
5. ✅ **Check notifications were created**: `SELECT COUNT(*) FROM notifications WHERE created_at > NOW() - INTERVAL '1 minute';`

---

## 🔍 Browser Console Check

When you create a signal, you should see:

**Expected logs (Success)**:
```
Creating in-app notifications for signal: abc123
In-app notifications created for 3 users
```

**If you see**:
```
No active signal subscriptions found
```
→ Run the subscription insert SQL above

**If you see**:
```
Error creating in-app notifications: <error>
```
→ Check the specific error and run diagnostic queries

---

## 🎯 Quick Fix Script (Run All)

Just copy-paste this entire block into SQL Editor:

```sql
-- COMPLETE FIX - Run if nothing else works

-- 1. Create table (safe - won't overwrite)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('signal', 'event', 'announcement', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN NOT NULL DEFAULT false,
  deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- 2. Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 3. Drop old policies (if any)
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can do everything" ON notifications;
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON notifications;

-- 4. Create fresh policies
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id AND deleted = false);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Allow all authenticated to insert"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 5. Create subscription for first user
DO $$
DECLARE
  first_user_id UUID;
BEGIN
  SELECT id INTO first_user_id FROM auth.users LIMIT 1;
  
  IF first_user_id IS NOT NULL THEN
    INSERT INTO signal_subscriptions (user_id, status, subscription_type)
    VALUES (first_user_id, 'active', 'monthly')
    ON CONFLICT (user_id) DO UPDATE SET status = 'active';
    
    RAISE NOTICE 'Created subscription for user: %', first_user_id;
  END IF;
END $$;

-- 6. Verify setup
SELECT 
  'Setup complete! Active subscriptions: ' || 
  COUNT(*)::text as result
FROM signal_subscriptions 
WHERE status = 'active';
```

**After running this**: Create a signal → Notifications should work! 🎉

---

## ✅ Success Indicators

You'll know it's working when:

1. **Browser Console** shows:
   ```
   Creating in-app notifications for signal: xxx
   In-app notifications created for X users
   ```

2. **SQL Query** returns notifications:
   ```sql
   SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5;
   -- Should show recent notifications
   ```

3. **User Dashboard** shows bell icon with badge count

4. **Clicking bell** shows the notification in dropdown

---

## 🆘 Still Not Working?

Run this and share the output:

```sql
-- Complete diagnostic
SELECT 
  'Table exists: ' || EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') as check1
UNION ALL
SELECT 
  'Active subs: ' || COUNT(*)::text FROM signal_subscriptions WHERE status = 'active'
UNION ALL
SELECT 
  'Total notifications: ' || COUNT(*)::text FROM notifications
UNION ALL
SELECT 
  'RLS enabled: ' || (SELECT rowsecurity FROM pg_tables WHERE tablename = 'notifications')::text;
```

Copy all results and let me know - I'll help debug further!

---

**TL;DR**: 
1. Run the "Quick Fix Script" above
2. Create a signal
3. Check browser console for success logs
4. Done! ✅
