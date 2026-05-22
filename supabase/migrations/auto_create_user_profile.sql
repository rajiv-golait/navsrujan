-- Migration: Auto-create user_profiles record on signup
-- Created: 2026-05-22
-- Description: Automatically creates user_profiles record when a new user signs up

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Also create default settings for existing users who don't have profiles
INSERT INTO public.user_profiles (id, created_at, updated_at)
SELECT id, created_at, NOW()
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.user_profiles)
ON CONFLICT (id) DO NOTHING;

-- Ensure all existing profiles have notification and privacy settings
INSERT INTO notification_preferences (user_id)
SELECT id FROM public.user_profiles
WHERE id NOT IN (SELECT user_id FROM notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO privacy_settings (user_id)
SELECT id FROM public.user_profiles
WHERE id NOT IN (SELECT user_id FROM privacy_settings)
ON CONFLICT (user_id) DO NOTHING;

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user_profiles record when a new user signs up via Supabase Auth';
