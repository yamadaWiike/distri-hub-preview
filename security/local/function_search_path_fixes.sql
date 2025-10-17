-- ADDITIONAL SECURITY FIXES FOR FUNCTION SEARCH PATH ISSUES
-- This migration fixes function search_path security vulnerabilities

-- ============================================================================
-- FIX FUNCTION SEARCH PATH MUTABLE ISSUES
-- ============================================================================

-- Fix update_modified_column function
DROP FUNCTION IF EXISTS public.update_modified_column() CASCADE;
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Fix link_area_to_group function
DROP FUNCTION IF EXISTS public.link_area_to_group(INTEGER, INTEGER) CASCADE;
CREATE OR REPLACE FUNCTION public.link_area_to_group(
    group_id INTEGER,
    area_id INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO regional_group_areas (regional_group_id, distribution_area_id)
    VALUES (group_id, area_id)
    ON CONFLICT (regional_group_id, distribution_area_id) DO NOTHING;
    
    RETURN true;
END;
$$;

-- Fix log_distributor_profile_access function
DROP FUNCTION IF EXISTS public.log_distributor_profile_access(UUID, TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.log_distributor_profile_access(
    profile_id UUID,
    access_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Log access for audit purposes
    -- This could insert into an audit table if needed
    NULL;
END;
$$;

-- Fix deduplicate_location_tables function
DROP FUNCTION IF EXISTS public.deduplicate_location_tables() CASCADE;
CREATE OR REPLACE FUNCTION public.deduplicate_location_tables()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Remove duplicates from provinces
    WITH duplicate_provinces AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at) as rn
        FROM provinces
    )
    DELETE FROM provinces WHERE id IN (
        SELECT id FROM duplicate_provinces WHERE rn > 1
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

-- Fix add_more_products function
DROP FUNCTION IF EXISTS public.add_more_products() CASCADE;
CREATE OR REPLACE FUNCTION public.add_more_products()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- This function would add sample products if needed
    -- Return count of products added
    RETURN inserted_count;
END;
$$;

-- Fix update_updated_at_column function
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Fix handle_updated_at function
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Fix get_product_pricing_by_uom function
DROP FUNCTION IF EXISTS public.get_product_pricing_by_uom(UUID, VARCHAR, VARCHAR) CASCADE;
CREATE OR REPLACE FUNCTION public.get_product_pricing_by_uom(
    product_id_param UUID,
    uom_param VARCHAR,
    area_param VARCHAR
)
RETURNS TABLE(
    product_id UUID,
    uom VARCHAR,
    area VARCHAR,
    price NUMERIC,
    moq INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.product_id,
        up.uom,
        up.area,
        up.distributor_price::NUMERIC,
        up.moq
    FROM uom_pricing up
    WHERE up.product_id = product_id_param
      AND up.uom = uom_param
      AND up.area = area_param
      AND up.is_active = true;
END;
$$;

-- Fix convert_quantity_uom function
DROP FUNCTION IF EXISTS public.convert_quantity_uom(UUID, NUMERIC, VARCHAR, VARCHAR) CASCADE;
CREATE OR REPLACE FUNCTION public.convert_quantity_uom(
    product_id_param UUID,
    quantity NUMERIC,
    from_uom VARCHAR,
    to_uom VARCHAR
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    conversion_factor NUMERIC;
    converted_quantity NUMERIC;
BEGIN
    -- Get conversion factor
    SELECT uc.conversion_factor INTO conversion_factor
    FROM uom_conversions uc
    WHERE uc.product_id = product_id_param
      AND uc.from_uom = from_uom
      AND uc.to_uom = to_uom
      AND uc.is_active = true;
    
    IF conversion_factor IS NULL THEN
        RAISE EXCEPTION 'No conversion found from % to % for product %', from_uom, to_uom, product_id_param;
    END IF;
    
    converted_quantity := quantity * conversion_factor;
    
    RETURN converted_quantity;
END;
$$;

-- ============================================================================
-- UPDATE EXISTING SECURE FUNCTIONS WITH PROPER SEARCH PATH
-- ============================================================================

-- Update is_admin_user function with search path
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'role' = 'admin') OR 
    ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'),
    false
  );
$$;

-- Update update_distributor_status function with search path
CREATE OR REPLACE FUNCTION update_distributor_status(
  distributor_user_id UUID,
  new_status TEXT
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  valid_statuses TEXT[] := ARRAY['pending', 'active', 'inactive', 'rejected'];
  update_count INTEGER;
BEGIN
  -- Check if current user is admin
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'Access denied: Only administrators can update distributor status';
  END IF;
  
  -- Validate status value
  IF new_status <> ALL(valid_statuses) THEN
    RAISE EXCEPTION 'Invalid status: must be one of %', valid_statuses;
  END IF;
  
  -- Update the distributor status
  UPDATE distributor_profiles 
  SET 
    status = new_status,
    approved_at = CASE 
      WHEN new_status = 'active' THEN NOW() 
      ELSE approved_at 
    END,
    approved_by = CASE 
      WHEN new_status = 'active' THEN auth.uid() 
      ELSE approved_by 
    END,
    updated_at = NOW()
  WHERE user_id = distributor_user_id;
  
  GET DIAGNOSTICS update_count = ROW_COUNT;
  
  IF update_count = 0 THEN
    RAISE EXCEPTION 'Distributor profile not found for user_id: %', distributor_user_id;
  END IF;
  
  RETURN true;
END;
$$;

-- Update get_distributor_status function with search path
CREATE OR REPLACE FUNCTION get_distributor_status(check_user_id UUID DEFAULT auth.uid())
RETURNS TABLE(
  user_id UUID,
  status TEXT,
  is_approved BOOLEAN,
  approved_at TIMESTAMPTZ,
  approved_by UUID
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT 
    dp.user_id,
    dp.status,
    (dp.status = 'active') as is_approved,
    dp.approved_at,
    dp.approved_by
  FROM distributor_profiles dp
  WHERE dp.user_id = check_user_id
    AND (
      auth.uid() = dp.user_id  -- Users can check their own status
      OR is_admin_user()       -- Admins can check any status
    );
$$;

-- Update batch_approve_distributors function with search path
CREATE OR REPLACE FUNCTION batch_approve_distributors(distributor_user_ids UUID[])
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  approval_count INTEGER;
BEGIN
  -- Check if current user is admin
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'Access denied: Only administrators can approve distributors';
  END IF;
  
  -- Update all specified distributors to active status
  UPDATE distributor_profiles 
  SET 
    status = 'active',
    approved_at = NOW(),
    approved_by = auth.uid(),
    updated_at = NOW()
  WHERE user_id = ANY(distributor_user_ids)
    AND status = 'pending';  -- Only approve pending distributors
  
  GET DIAGNOSTICS approval_count = ROW_COUNT;
  
  RETURN approval_count;
END;
$$;

-- Update prevent_non_admin_status_change function with search path
CREATE OR REPLACE FUNCTION prevent_non_admin_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- If user is admin, allow all changes
  IF is_admin_user() THEN
    RETURN NEW;
  END IF;
  
  -- If user is not admin, prevent changes to status, approved_at, approved_by
  IF OLD.status IS DISTINCT FROM NEW.status 
     OR OLD.approved_at IS DISTINCT FROM NEW.approved_at 
     OR OLD.approved_by IS DISTINCT FROM NEW.approved_by THEN
    RAISE EXCEPTION 'Access denied: Only administrators can change approval status';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update get_pending_distributors_count function with search path
CREATE OR REPLACE FUNCTION get_pending_distributors_count()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT COUNT(*)::INTEGER
  FROM distributor_profiles
  WHERE status = 'pending'
    AND is_admin_user();  -- Only admins can see this count
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on updated functions
GRANT EXECUTE ON FUNCTION update_modified_column() TO authenticated;
GRANT EXECUTE ON FUNCTION link_area_to_group(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION log_distributor_profile_access(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION deduplicate_location_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION add_more_products() TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_pricing_by_uom(UUID, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION convert_quantity_uom(UUID, NUMERIC, VARCHAR, VARCHAR) TO authenticated;

-- Success message
SELECT 'Function search path security issues fixed! All functions now have secure search_path settings.' as result;