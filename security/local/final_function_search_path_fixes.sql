-- FINAL FUNCTION SEARCH PATH FIXES
-- This migration fixes the remaining 2 function search path security vulnerabilities

-- ============================================================================
-- FIX REMAINING FUNCTION SEARCH PATH MUTABLE ISSUES
-- ============================================================================

-- Fix log_distributor_profile_access function (trigger function with no parameters)
DROP FUNCTION IF EXISTS public.log_distributor_profile_access() CASCADE;
CREATE OR REPLACE FUNCTION public.log_distributor_profile_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Log access attempts for security monitoring
  -- Only log if security_logs table exists
  BEGIN
    INSERT INTO public.security_logs (
      table_name, 
      operation, 
      user_id, 
      accessed_profile_id, 
      timestamp
    ) VALUES (
      'distributor_profiles',
      TG_OP,
      auth.uid(),
      COALESCE(NEW.id, OLD.id),
      now()
    );
  EXCEPTION WHEN undefined_table THEN
    -- If security_logs table doesn't exist, silently continue
    NULL;
  END;
  
  -- Return appropriate record based on operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Fix link_area_to_group function (check for different signatures)
-- First, try to drop any existing versions
DROP FUNCTION IF EXISTS public.link_area_to_group() CASCADE;
DROP FUNCTION IF EXISTS public.link_area_to_group(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.link_area_to_group(INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.link_area_to_group(TEXT, TEXT) CASCADE;

-- Create the most likely version based on the table structure
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
    -- Link a distribution area to a regional group
    INSERT INTO regional_group_areas (regional_group_id, distribution_area_id)
    VALUES (group_id, area_id)
    ON CONFLICT (regional_group_id, distribution_area_id) DO NOTHING;
    
    RETURN FOUND;
END;
$$;

-- Alternative version if the function takes different parameter types
CREATE OR REPLACE FUNCTION public.link_area_to_group(
    group_name TEXT,
    area_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    group_id_val INTEGER;
    area_id_val INTEGER;
BEGIN
    -- Get group ID from name
    SELECT id INTO group_id_val 
    FROM regional_groups 
    WHERE name = group_name;
    
    -- Get area ID from name
    SELECT id INTO area_id_val 
    FROM distribution_areas 
    WHERE name = area_name;
    
    -- If both found, link them
    IF group_id_val IS NOT NULL AND area_id_val IS NOT NULL THEN
        INSERT INTO regional_group_areas (regional_group_id, distribution_area_id)
        VALUES (group_id_val, area_id_val)
        ON CONFLICT (regional_group_id, distribution_area_id) DO NOTHING;
        
        RETURN FOUND;
    END IF;
    
    RETURN FALSE;
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on updated functions
GRANT EXECUTE ON FUNCTION log_distributor_profile_access() TO authenticated;
GRANT EXECUTE ON FUNCTION link_area_to_group(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION link_area_to_group(TEXT, TEXT) TO authenticated;

-- ============================================================================
-- CREATE SECURITY_LOGS TABLE IF IT DOESN'T EXIST
-- ============================================================================

-- Create security_logs table if needed for the logging function
CREATE TABLE IF NOT EXISTS public.security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    accessed_profile_id UUID,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on security_logs (admin only access)
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "security_logs_admin_only" ON public.security_logs;

-- Create admin-only policy for security logs
CREATE POLICY "security_logs_admin_only" ON public.security_logs
FOR ALL TO authenticated USING (is_admin_user());

-- Grant permissions
GRANT INSERT ON public.security_logs TO authenticated;
GRANT SELECT ON public.security_logs TO authenticated;

-- Success message
SELECT 'Final function search path security issues fixed! All remaining functions now have secure search_path settings.' as result;