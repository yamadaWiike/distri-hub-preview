-- Fix Orders Database Issues
-- Run this SQL in your Supabase SQL Editor to fix the syntax error

-- Step 1: Check if tables exist and show their columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'orders') THEN
        RAISE EXCEPTION 'orders table does not exist';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'order_items') THEN
        RAISE EXCEPTION 'order_items table does not exist';
    END IF;
    
    RAISE NOTICE 'Tables exist: orders and order_items';
END $$;

-- Step 1.5: Show actual table structure
SELECT 'Orders table columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Order items table columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'order_items' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Create or replace the admin function
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY definer
STABLE
AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'email' IN ('rudy@baskit.app', 'admin.commercial@baskit.app'),
    false
  );
$$;

-- Step 3: Test the function
SELECT is_admin_user() as admin_check;

-- Step 4: Enable RLS (if not already enabled)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Step 5: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON order_items TO authenticated;
-- Note: No sequences to grant because tables use gen_random_uuid() for IDs

-- Step 6: Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "admin_full_access_orders" ON orders;
DROP POLICY IF EXISTS "distributors_own_orders" ON orders;
DROP POLICY IF EXISTS "admin_full_access_order_items" ON order_items;
DROP POLICY IF EXISTS "distributors_own_order_items" ON order_items;

-- Step 7: Create simple policies for admin access
CREATE POLICY "admin_full_access_orders" ON orders
FOR ALL
TO authenticated
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "admin_full_access_order_items" ON order_items
FOR ALL
TO authenticated
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- Step 8: Create policies for distributors (for their own orders)
CREATE POLICY "distributors_own_orders" ON orders
FOR ALL
TO authenticated
USING (
  NOT is_admin_user() AND 
  distributor_id IN (
    SELECT id FROM distributor_profiles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  NOT is_admin_user() AND 
  distributor_id IN (
    SELECT id FROM distributor_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "distributors_own_order_items" ON order_items
FOR ALL
TO authenticated
USING (
  NOT is_admin_user() AND 
  order_id IN (
    SELECT o.id FROM orders o
    WHERE o.distributor_id IN (
      SELECT dp.id FROM distributor_profiles dp WHERE dp.user_id = auth.uid()
    )
  )
)
WITH CHECK (
  NOT is_admin_user() AND 
  order_id IN (
    SELECT o.id FROM orders o
    WHERE o.distributor_id IN (
      SELECT dp.id FROM distributor_profiles dp WHERE dp.user_id = auth.uid()
    )
  )
);

-- Step 9: Check if there are any orders in the database
SELECT 
  COUNT(*) as total_orders,
  MIN(created_at) as oldest_order,
  MAX(created_at) as newest_order
FROM orders;

-- Step 10: Verify policies are created
SELECT 
  schemaname,
  tablename,
  policyname, 
  cmd as operation
FROM pg_policies 
WHERE tablename IN ('orders', 'order_items')
ORDER BY tablename, policyname;

-- Step 11: Test a simple query that should work for admins
SELECT 'Admin query test completed' as result;