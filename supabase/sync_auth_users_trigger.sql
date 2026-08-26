-- ==============================================================================
-- BITEBLIX POS - AUTOMATIC SYNC FROM SUPABASE AUTH TO ACCESS_CREDENTIALS
-- ==============================================================================

-- 1. Create or replace sync function
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger AS $$
DECLARE
  v_role text;
BEGIN
  -- Determine default role based on email or user metadata
  IF LOWER(new.email) LIKE '%admin%' THEN
    v_role := 'admin';
  ELSIF LOWER(new.email) LIKE '%cashier%' THEN
    v_role := 'cashier';
  ELSIF LOWER(new.email) LIKE '%manager%' THEN
    v_role := 'manager';
  ELSE
    v_role := COALESCE(new.raw_user_meta_data->>'role', 'admin');
  END IF;

  -- Insert into public.access_credentials
  INSERT INTO public.access_credentials (
    name,
    email,
    phone,
    role,
    password_hash,
    is_active,
    is_demo,
    created_at,
    updated_at
  )
  VALUES (
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      INITCAP(split_part(new.email, '@', 1))
    ),
    LOWER(new.email),
    COALESCE(new.phone, new.raw_user_meta_data->>'phone'),
    v_role,
    'supabase_auth_managed',
    1,
    CASE WHEN LOWER(new.email) = 'test@mobileshop.com' THEN 1 ELSE 0 END,
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE 
  SET 
    name = COALESCE(EXCLUDED.name, public.access_credentials.name),
    updated_at = NOW();

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create Trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_auth_user();

-- 3. Backfill / Sync all existing Supabase Auth users right now into access_credentials
INSERT INTO public.access_credentials (
  name,
  email,
  phone,
  role,
  password_hash,
  is_active,
  is_demo,
  created_at,
  updated_at
)
SELECT 
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    INITCAP(split_part(u.email, '@', 1))
  ) AS name,
  LOWER(u.email) AS email,
  COALESCE(u.phone, u.raw_user_meta_data->>'phone') AS phone,
  CASE 
    WHEN LOWER(u.email) LIKE '%admin%' THEN 'admin'
    WHEN LOWER(u.email) LIKE '%cashier%' THEN 'cashier'
    WHEN LOWER(u.email) LIKE '%manager%' THEN 'manager'
    ELSE 'admin'
  END AS role,
  'supabase_auth_managed' AS password_hash,
  1 AS is_active,
  CASE WHEN LOWER(u.email) = 'test@mobileshop.com' THEN 1 ELSE 0 END AS is_demo,
  NOW() AS created_at,
  NOW() AS updated_at
FROM auth.users u
WHERE u.email IS NOT NULL
ON CONFLICT (email) DO UPDATE
SET 
  name = EXCLUDED.name,
  updated_at = NOW();
