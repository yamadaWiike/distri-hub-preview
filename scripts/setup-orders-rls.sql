-- Setup RLS policies for orders and order_items tables
-- Run this SQL in your Supabase SQL Editor

-- Enable RLS on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Enable RLS on order_items table  
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Grant basic permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON order_items TO authenticated;

-- Create admin access function (reuse if already exists)
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY definer
AS $$
  SELECT auth.jwt() ->> 'email' IN ('rudy@baskit.app', 'admin.commercial@baskit.app');
$$;

-- Drop existing policies if any
DROP POLICY IF EXISTS "admin_full_access_orders" ON orders;
DROP POLICY IF EXISTS "distributors_own_orders" ON orders;
DROP POLICY IF EXISTS "admin_full_access_order_items" ON order_items;
DROP POLICY IF EXISTS "distributors_own_order_items" ON order_items;

-- Create policies for orders table
-- Admin can see and manage all orders
CREATE POLICY "admin_full_access_orders" ON orders
FOR ALL
TO authenticated
USING (is_admin_user());

-- Distributors can only see their own orders
CREATE POLICY "distributors_own_orders" ON orders
FOR ALL
TO authenticated
USING (
  NOT is_admin_user() AND 
  distributor_id IN (
    SELECT id FROM distributor_profiles WHERE user_id = auth.uid()
  )
);

-- Create policies for order_items table
-- Admin can see and manage all order items
CREATE POLICY "admin_full_access_order_items" ON order_items
FOR ALL
TO authenticated
USING (is_admin_user());

-- Distributors can only see order items for their own orders
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
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_distributor_id ON orders(distributor_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Verify policies are created
SELECT 
  schemaname,
  tablename,
  policyname, 
  cmd, 
  permissive,
  qual
FROM pg_policies 
WHERE tablename IN ('orders', 'order_items')
ORDER BY tablename, policyname;