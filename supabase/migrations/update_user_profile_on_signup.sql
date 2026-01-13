-- Create function to update user profile on signup
-- This function bypasses RLS using SECURITY DEFINER, allowing profile updates
-- even when the user doesn't have an active session (e.g., before email confirmation)
CREATE OR REPLACE FUNCTION update_user_profile_on_signup(
  user_id UUID,
  phone_number_param TEXT,
  phone_verified_param BOOLEAN DEFAULT true,
  whatsapp_notifications_param BOOLEAN DEFAULT true,
  email_notifications_param BOOLEAN DEFAULT true
)
RETURNS void AS $$
BEGIN
  -- Ensure the profile exists (trigger should have created it, but just in case)
  INSERT INTO public.user_profiles (id)
  VALUES (user_id)
  ON CONFLICT (id) DO NOTHING;

  -- Update the profile with the provided information
  UPDATE public.user_profiles
  SET
    phone_number = phone_number_param,
    phone_verified = phone_verified_param,
    whatsapp_notifications_enabled = whatsapp_notifications_param,
    email_notifications_enabled = email_notifications_param,
    updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated and anon users
-- This allows the function to be called from the signup form
GRANT EXECUTE ON FUNCTION update_user_profile_on_signup(UUID, TEXT, BOOLEAN, BOOLEAN, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_profile_on_signup(UUID, TEXT, BOOLEAN, BOOLEAN, BOOLEAN) TO anon;
