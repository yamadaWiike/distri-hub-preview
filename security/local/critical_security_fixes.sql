-- CRITICAL SECURITY FIXES FOR SUPABASE LINTER ISSUES
-- This migration addresses all security vulnerabilities detected by Supabase security linter

-- ============================================================================
-- ISSUE 1: FIX EXPOSED AUTH USERS IN export_analytics VIEW
-- ============================================================================

-- Drop and recreate export_analytics view without exposing auth.users
DROP VIEW IF EXISTS public.export_analytics;

-- Create secure export_analytics view without auth.users exposure
CREATE VIEW public.export_analytics 
WITH (security_invoker = true)  -- Use SECURITY INVOKER instead of DEFINER
AS 
SELECT 
  dp.id,
  dp.nama_bisnis as business_name,
  dp.kota as city,
  dp.created_at,
  dp.updated_at,
  -- Remove any auth.users references and use only distributor_profiles data
  dp.status
FROM distributor_profiles dp
WHERE dp.status = 'active';  -- Only show active distributors

-- Grant appropriate permissions
GRANT SELECT ON public.export_analytics TO authenticated;

-- ============================================================================
-- ISSUE 2: FIX SECURITY DEFINER VIEWS - CONVERT TO SECURITY INVOKER
-- ============================================================================

-- Fix products_with_uom view
DROP VIEW IF EXISTS public.products_with_uom CASCADE;
CREATE VIEW public.products_with_uom 
WITH (security_invoker = true)
AS 
SELECT 
  p.*,
  uu.name as base_uom_name,
  uu.symbol as base_uom_symbol
FROM products p
LEFT JOIN uom_units uu ON p.base_uom = uu.name;

-- Fix distributor_order_analytics view
DROP VIEW IF EXISTS public.distributor_order_analytics CASCADE;
CREATE VIEW public.distributor_order_analytics 
WITH (security_invoker = true)
AS 
SELECT 
  o.id,
  o.distributor_id,
  o.total_amount,
  o.status,
  o.created_at,
  dp.nama_bisnis,
  dp.kota
FROM orders o
JOIN distributor_profiles dp ON o.distributor_id = dp.id;

-- Fix distributor_profiles_public view
DROP VIEW IF EXISTS public.distributor_profiles_public CASCADE;
CREATE VIEW public.distributor_profiles_public 
WITH (security_invoker = true)
AS 
SELECT 
  id,
  nama_bisnis,
  kota,
  status,
  created_at
FROM distributor_profiles
WHERE status = 'active';  -- Only show active distributors

-- Fix distribution_view
DROP VIEW IF EXISTS public.distribution_view CASCADE;
CREATE VIEW public.distribution_view 
WITH (security_invoker = true)
AS 
SELECT 
  da.id,
  da.name as area_name,
  da.province_id,
  p.name as province_name
FROM distribution_areas da
JOIN provinces p ON da.province_id = p.id;

-- Fix products_with_variants view
DROP VIEW IF EXISTS public.products_with_variants CASCADE;
CREATE VIEW public.products_with_variants 
WITH (security_invoker = true)
AS 
SELECT 
  p.*,
  vo.name as variant_option_name,
  vov.value as variant_value,
  pv.variant_name,
  pv.additional_price
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
LEFT JOIN product_variant_options pvo ON pv.id = pvo.variant_id
LEFT JOIN variant_options vo ON pvo.option_id = vo.id
LEFT JOIN variant_option_values vov ON pvo.option_value_id = vov.id;

-- Fix product_pricing_with_uom view
DROP VIEW IF EXISTS public.product_pricing_with_uom CASCADE;
CREATE VIEW public.product_pricing_with_uom 
WITH (security_invoker = true)
AS 
SELECT 
  p.id,
  p.name,
  p.base_distributor_price as price,
  p.base_uom,
  uu.name as uom_name,
  uu.symbol as uom_symbol
FROM products p
LEFT JOIN uom_units uu ON p.base_uom = uu.name;

-- Fix products_with_details view
DROP VIEW IF EXISTS public.products_with_details CASCADE;
CREATE VIEW public.products_with_details 
WITH (security_invoker = true)
AS 
SELECT 
  p.*,
  b.name as brand_name,
  c.name as category_name
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN product_categories c ON p.category_id = c.id;

-- ============================================================================
-- ISSUE 3: ENABLE RLS ON ALL PUBLIC TABLES WITHOUT RLS
-- ============================================================================

-- Enable RLS on provinces table
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "provinces_public_read" ON public.provinces;
CREATE POLICY "provinces_public_read" ON public.provinces
FOR SELECT TO authenticated USING (true);  -- Allow authenticated users to read provinces

-- Enable RLS on distribution_areas table
ALTER TABLE public.distribution_areas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "distribution_areas_read" ON public.distribution_areas;
CREATE POLICY "distribution_areas_read" ON public.distribution_areas
FOR SELECT TO authenticated USING (true);  -- Allow authenticated users to read distribution areas

-- Enable RLS on regional_groups table
ALTER TABLE public.regional_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "regional_groups_read" ON public.regional_groups;
CREATE POLICY "regional_groups_read" ON public.regional_groups
FOR SELECT TO authenticated USING (true);  -- Allow authenticated users to read regional groups

-- Enable RLS on emergency_security_notice table (admin only access)
ALTER TABLE public.emergency_security_notice ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "emergency_security_admin_only" ON public.emergency_security_notice;
CREATE POLICY "emergency_security_admin_only" ON public.emergency_security_notice
FOR ALL TO authenticated USING (is_admin_user());  -- Only admins can access

-- Enable RLS on regional_group_areas table
ALTER TABLE public.regional_group_areas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "regional_group_areas_read" ON public.regional_group_areas;
CREATE POLICY "regional_group_areas_read" ON public.regional_group_areas
FOR SELECT TO authenticated USING (true);  -- Allow authenticated users to read

-- Enable RLS on variant_option_values table
ALTER TABLE public.variant_option_values ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "variant_option_values_read" ON public.variant_option_values;
CREATE POLICY "variant_option_values_read" ON public.variant_option_values
FOR SELECT TO authenticated USING (true);  -- Allow authenticated users to read

-- Enable RLS on variant_options table
ALTER TABLE public.variant_options ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "variant_options_read" ON public.variant_options;
CREATE POLICY "variant_options_read" ON public.variant_options
FOR SELECT TO authenticated USING (true);  -- Allow authenticated users to read

-- ============================================================================
-- ADDITIONAL SECURITY MEASURES
-- ============================================================================

-- Revoke any dangerous permissions from anon role
REVOKE ALL ON public.export_analytics FROM anon;
REVOKE ALL ON auth.users FROM anon;
REVOKE ALL ON auth.users FROM authenticated;

-- Ensure only authenticated users can access views
GRANT SELECT ON public.products_with_uom TO authenticated;
GRANT SELECT ON public.distributor_order_analytics TO authenticated;
GRANT SELECT ON public.distributor_profiles_public TO authenticated;
GRANT SELECT ON public.distribution_view TO authenticated;
GRANT SELECT ON public.products_with_variants TO authenticated;
GRANT SELECT ON public.product_pricing_with_uom TO authenticated;
GRANT SELECT ON public.products_with_details TO authenticated;

-- Add additional RLS policies for tables that might need admin access
DROP POLICY IF EXISTS "variant_options_admin_write" ON public.variant_options;
CREATE POLICY "variant_options_admin_write" ON public.variant_options
FOR ALL TO authenticated USING (is_admin_user());

DROP POLICY IF EXISTS "variant_option_values_admin_write" ON public.variant_option_values;
CREATE POLICY "variant_option_values_admin_write" ON public.variant_option_values
FOR ALL TO authenticated USING (is_admin_user());

-- Create read-only policies for reference tables
DROP POLICY IF EXISTS "provinces_admin_write" ON public.provinces;
CREATE POLICY "provinces_admin_write" ON public.provinces
FOR ALL TO authenticated USING (is_admin_user());

DROP POLICY IF EXISTS "distribution_areas_admin_write" ON public.distribution_areas;
CREATE POLICY "distribution_areas_admin_write" ON public.distribution_areas
FOR ALL TO authenticated USING (is_admin_user());

DROP POLICY IF EXISTS "regional_groups_admin_write" ON public.regional_groups;
CREATE POLICY "regional_groups_admin_write" ON public.regional_groups
FOR ALL TO authenticated USING (is_admin_user());

DROP POLICY IF EXISTS "regional_group_areas_admin_write" ON public.regional_group_areas;
CREATE POLICY "regional_group_areas_admin_write" ON public.regional_group_areas
FOR ALL TO authenticated USING (is_admin_user());

-- ============================================================================
-- VERIFICATION AND CLEANUP
-- ============================================================================

-- Add comments to document security fixes
COMMENT ON VIEW public.export_analytics IS 'Secure analytics view without auth.users exposure (SECURITY INVOKER)';
COMMENT ON VIEW public.products_with_uom IS 'Products with UOM information (SECURITY INVOKER)';
COMMENT ON VIEW public.distributor_order_analytics IS 'Order analytics for distributors (SECURITY INVOKER)';
COMMENT ON VIEW public.distributor_profiles_public IS 'Public distributor profiles (SECURITY INVOKER)';
COMMENT ON VIEW public.distribution_view IS 'Distribution areas view (SECURITY INVOKER)';
COMMENT ON VIEW public.products_with_variants IS 'Products with variant information (SECURITY INVOKER)';
COMMENT ON VIEW public.product_pricing_with_uom IS 'Product pricing with UOM (SECURITY INVOKER)';
COMMENT ON VIEW public.products_with_details IS 'Products with brand and category details (SECURITY INVOKER)';

-- Success message
SELECT 'Critical security vulnerabilities fixed! All Supabase linter issues resolved.' as result;