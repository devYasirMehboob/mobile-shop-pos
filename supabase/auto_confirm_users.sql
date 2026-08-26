-- ==============================================================================
-- BITEBLIX POS - AUTO CONFIRM ALL SUPABASE AUTH USERS (NO EMAIL VERIFICATION)
-- ==============================================================================

-- 1. Instantly confirm all existing unconfirmed users
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- 2. Create trigger to auto-confirm any newly inserted auth user automatically
CREATE OR REPLACE FUNCTION public.auto_confirm_auth_user()
RETURNS trigger AS $$
BEGIN
  new.email_confirmed_at := COALESCE(new.email_confirmed_at, NOW());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_before_insert ON auth.users;

CREATE TRIGGER on_auth_user_before_insert
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.auto_confirm_auth_user();
