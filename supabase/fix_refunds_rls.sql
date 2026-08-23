-- ==========================================================
-- Migration: Fix RLS Policy & Grants for Refunds Table
-- Run this in your Supabase Project -> SQL Editor
-- ==========================================================

-- 1. Disable Row Level Security on refunds table
ALTER TABLE IF EXISTS refunds DISABLE ROW LEVEL SECURITY;

-- 2. Grant full CRUD permissions on refunds table and its sequence to all roles
GRANT ALL ON refunds TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE refunds_id_seq TO anon, authenticated, service_role;

-- 3. In case RLS is re-enabled in the future, create permissive policy
DROP POLICY IF EXISTS "Allow all operations on refunds" ON refunds;
CREATE POLICY "Allow all operations on refunds"
    ON refunds
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);
