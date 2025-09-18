-- Fix User Management Permissions
-- Run this SQL in your Supabase SQL Editor to resolve permission issues

-- First, let's check current policies and constraints for all relevant tables
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('distributor_profiles', 'products', 'categories', 'brands', 'product_variants');

-- Check current status constraint (modern PostgreSQL approach)
SELECT 
  conname, 
  contype,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'distributor_profiles'::regclass 
AND contype = 'c';

-- Drop any problematic RLS policies that might cause infinite recursion
-- DISTRIBUTOR_PROFILES table (always exists)
DROP POLICY IF EXISTS "admin_can_manage_distributor_profiles" ON distributor_profiles;
DROP POLICY IF EXISTS "admin_full_access" ON distributor_profiles;
DROP POLICY IF EXISTS "Admins can manage all distributor profiles" ON distributor_profiles;
DROP POLICY IF EXISTS "admin_email_access" ON distributor_profiles;
DROP POLICY IF EXISTS "admin_and_owner_access" ON distributor_profiles;

-- Drop policies for other tables only if they exist
DO $$ 
BEGIN
  -- PRODUCTS table policies
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    EXECUTE 'DROP POLICY IF EXISTS "admin_can_manage_products" ON products';
    EXECUTE 'DROP POLICY IF EXISTS "admin_full_access" ON products';
    EXECUTE 'DROP POLICY IF EXISTS "admin_and_owner_access" ON products';
    EXECUTE 'DROP POLICY IF EXISTS "admin_access_products" ON products';
  END IF;
  
  -- CATEGORIES table policies
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
    EXECUTE 'DROP POLICY IF EXISTS "admin_can_manage_categories" ON categories';
    EXECUTE 'DROP POLICY IF EXISTS "admin_full_access" ON categories';
    EXECUTE 'DROP POLICY IF EXISTS "admin_and_owner_access" ON categories';
    EXECUTE 'DROP POLICY IF EXISTS "admin_access_categories" ON categories';
  END IF;
  
  -- BRANDS table policies
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'brands') THEN
    EXECUTE 'DROP POLICY IF EXISTS "admin_can_manage_brands" ON brands';
    EXECUTE 'DROP POLICY IF EXISTS "admin_full_access" ON brands';
    EXECUTE 'DROP POLICY IF EXISTS "admin_and_owner_access" ON brands';
    EXECUTE 'DROP POLICY IF EXISTS "admin_access_brands" ON brands';
  END IF;
END $$;

-- Fix status constraint to allow common status values
ALTER TABLE distributor_profiles DROP CONSTRAINT IF EXISTS distributor_profiles_status_check;
ALTER TABLE distributor_profiles ADD CONSTRAINT distributor_profiles_status_check 
CHECK (status IN ('active', 'pending', 'rejected', 'suspended', 'approved', 'draft', 'inactive'));

-- Create a simple, non-recursive admin policy
CREATE POLICY "admin_email_access" ON distributor_profiles
FOR ALL
TO authenticated
USING (
  -- Direct email check without subqueries to avoid recursion
  auth.jwt() ->> 'email' IN ('rudy@baskit.app', 'admin.commercial@baskit.app')
  OR
  -- Allow users to manage their own profiles
  auth.uid() = user_id
);

-- Ensure all relevant tables have RLS enabled
ALTER TABLE distributor_profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS for other tables if they exist (will ignore if table doesn't exist)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    ALTER TABLE products ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
    ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'brands') THEN
    ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Grant necessary permissions to authenticated users for all tables
GRANT SELECT, UPDATE, INSERT, DELETE ON distributor_profiles TO authenticated;

-- Grant permissions for other tables if they exist
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    GRANT SELECT, UPDATE, INSERT, DELETE ON products TO authenticated;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
    GRANT SELECT, UPDATE, INSERT, DELETE ON categories TO authenticated;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'brands') THEN
    GRANT SELECT, UPDATE, INSERT, DELETE ON brands TO authenticated;
  END IF;
END $$;

-- Create an index on user_id for better performance
CREATE INDEX IF NOT EXISTS idx_distributor_profiles_user_id ON distributor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_distributor_profiles_email ON distributor_profiles(email_pemilik);

-- Test the policy by selecting data (should work for admin emails)
-- SELECT count(*) FROM distributor_profiles;

-- Optional: Create a function to safely check admin status
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY definer
AS $$
  SELECT auth.jwt() ->> 'email' IN ('rudy@baskit.app', 'admin.commercial@baskit.app');
$$;

-- Alternative policy using the function (more explicit)
-- Note: admin_email_access and admin_and_owner_access already dropped above

-- Create policies for distributor_profiles
CREATE POLICY "admin_and_owner_access" ON distributor_profiles
FOR ALL
TO authenticated
USING (
  is_admin_user() OR auth.uid() = user_id
);

-- Create simple admin policies for other tables (if they exist)
DO $$ 
BEGIN
  -- Products table policy
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    EXECUTE 'CREATE POLICY "admin_access_products" ON products FOR ALL TO authenticated USING (is_admin_user())';
  END IF;
  
  -- Categories table policy  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
    EXECUTE 'CREATE POLICY "admin_access_categories" ON categories FOR ALL TO authenticated USING (is_admin_user())';
  END IF;
  
  -- Brands table policy
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'brands') THEN
    EXECUTE 'CREATE POLICY "admin_access_brands" ON brands FOR ALL TO authenticated USING (is_admin_user())';
  END IF;
END $$;

-- Verify policies are working for all tables
SELECT 
  schemaname,
  tablename,
  policyname, 
  cmd, 
  permissive,
  qual
FROM pg_policies 
WHERE tablename IN ('distributor_profiles', 'products', 'categories', 'brands', 'product_variants')
ORDER BY tablename, policyname;

-- Final verification: Check if tables exist and have RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('distributor_profiles', 'products', 'categories', 'brands', 'product_variants')
ORDER BY tablename;