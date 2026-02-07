-- Sync auth.users and user_profiles: backfill missing profiles and match data
-- 1. Ensure every auth.users row has a corresponding user_profiles row
-- 2. Backfill user_profiles.full_name and phone_number from auth.users.raw_user_meta_data where missing

-- Ensure full_name column exists (idempotent; add_full_name_to_user_profiles may have run)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Backfill: insert user_profiles for any auth.users that don't have one
INSERT INTO public.user_profiles (id, full_name, phone_number, created_at, updated_at)
SELECT
  u.id,
  TRIM(COALESCE(
    u.raw_user_meta_data->>'full_name',
    (COALESCE(u.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(u.raw_user_meta_data->>'last_name', ''))
  ))::TEXT,
  NULLIF(TRIM(u.raw_user_meta_data->>'phone'::TEXT), ''),
  u.created_at,
  u.updated_at
FROM auth.users u
LEFT JOIN public.user_profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Sync from auth to profile where profile fields are null (don't overwrite existing)
UPDATE public.user_profiles p
SET
  full_name = COALESCE(
    p.full_name,
    NULLIF(TRIM(
      COALESCE(u.raw_user_meta_data->>'full_name',
        (COALESCE(u.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(u.raw_user_meta_data->>'last_name', ''))
      )
    ), '')
  ),
  phone_number = COALESCE(NULLIF(TRIM(p.phone_number), ''), NULLIF(TRIM(u.raw_user_meta_data->>'phone'), '')),
  updated_at = TIMEZONE('utc'::text, NOW())
FROM auth.users u
WHERE u.id = p.id
  AND (
    (p.full_name IS NULL OR TRIM(p.full_name) = '')
    OR (p.phone_number IS NULL OR TRIM(p.phone_number) = '')
  );

-- 3. create_user_profile: on new signup, sync full_name and phone from auth.users.raw_user_meta_data
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  meta_full_name TEXT;
  meta_phone TEXT;
BEGIN
  meta_full_name := NULLIF(TRIM(COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    (COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(NEW.raw_user_meta_data->>'last_name', ''))
  )), '');
  meta_phone := NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), '');

  BEGIN
    INSERT INTO public.user_profiles (id, full_name, phone_number)
    VALUES (NEW.id, meta_full_name, meta_phone)
    ON CONFLICT (id) DO UPDATE SET
      full_name = COALESCE(user_profiles.full_name, EXCLUDED.full_name),
      phone_number = COALESCE(NULLIF(TRIM(user_profiles.phone_number), ''), EXCLUDED.phone_number),
      updated_at = TIMEZONE('utc'::text, NOW());
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Error in create_user_profile for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Extend update_user_profile_on_signup to accept optional full_name (keeps auth and profile in sync)
-- Drop old 5-param version so the 6-param (full_name_param DEFAULT NULL) is the single definition
DROP FUNCTION IF EXISTS update_user_profile_on_signup(UUID, TEXT, BOOLEAN, BOOLEAN, BOOLEAN);

CREATE OR REPLACE FUNCTION update_user_profile_on_signup(
  user_id UUID,
  phone_number_param TEXT,
  phone_verified_param BOOLEAN DEFAULT true,
  whatsapp_notifications_param BOOLEAN DEFAULT true,
  email_notifications_param BOOLEAN DEFAULT true,
  full_name_param TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_profiles (id)
  VALUES (user_id)
  ON CONFLICT (id) DO NOTHING;

  UPDATE public.user_profiles
  SET
    phone_number = COALESCE(NULLIF(TRIM(phone_number_param), ''), phone_number),
    phone_verified = phone_verified_param,
    whatsapp_notifications_enabled = whatsapp_notifications_param,
    email_notifications_enabled = email_notifications_param,
    full_name = COALESCE(NULLIF(TRIM(full_name_param), ''), full_name),
    updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_user_profile_on_signup(UUID, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_profile_on_signup(UUID, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, TEXT) TO anon;
