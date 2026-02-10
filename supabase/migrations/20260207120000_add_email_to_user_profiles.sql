-- Add email to user_profiles and sync from auth.users so admin/list views can show email
-- without relying on get_all_users_with_roles RPC (which reads auth.users).

-- 1. Add column
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Backfill from auth.users
UPDATE public.user_profiles p
SET
  email = u.email,
  updated_at = TIMEZONE('utc'::text, NOW())
FROM auth.users u
WHERE u.id = p.id AND (p.email IS NULL OR p.email <> u.email);

-- 3. create_user_profile: set email on new signup
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
    INSERT INTO public.user_profiles (id, full_name, phone_number, email)
    VALUES (NEW.id, meta_full_name, meta_phone, NEW.email)
    ON CONFLICT (id) DO UPDATE SET
      full_name = COALESCE(user_profiles.full_name, EXCLUDED.full_name),
      phone_number = COALESCE(NULLIF(TRIM(user_profiles.phone_number), ''), EXCLUDED.phone_number),
      email = COALESCE(NULLIF(TRIM(user_profiles.email), ''), NEW.email),
      updated_at = TIMEZONE('utc'::text, NOW());
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Error in create_user_profile for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Keep user_profiles.email in sync when auth.users.email changes (optional; may not be allowed on hosted Supabase)
CREATE OR REPLACE FUNCTION sync_user_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    UPDATE public.user_profiles
    SET email = NEW.email, updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS sync_user_profile_email_trigger ON auth.users;
  CREATE TRIGGER sync_user_profile_email_trigger
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_profile_email();
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Trigger on auth.users not created (may be restricted): %', SQLERRM;
END;
$$;

COMMENT ON COLUMN user_profiles.email IS 'Synced from auth.users for admin/list views; set on signup and backfill.';
