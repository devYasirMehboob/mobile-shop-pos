-- ==============================================================================
-- BITEBLIX POS - ADD is_demo COLUMN TO access_credentials
-- ==============================================================================

-- 1. Add is_demo column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'access_credentials' 
          AND column_name = 'is_demo'
    ) THEN
        ALTER TABLE public.access_credentials 
        ADD COLUMN is_demo SMALLINT NOT NULL DEFAULT 0;
    END IF;
END $$;

-- 2. Ensure admin2@mobileshop.com is normal (is_demo = 0) and mark test@mobileshop.com as demo (is_demo = 1)
UPDATE public.access_credentials
SET is_demo = 0
WHERE LOWER(email) = 'admin2@mobileshop.com';

UPDATE public.access_credentials
SET is_demo = 1
WHERE LOWER(email) = 'test@mobileshop.com';
