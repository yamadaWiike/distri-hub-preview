-- Distributor Approval System Migration
-- This migration adds secure functions and policies for distributor approval workflow

-- Step 1: Create function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'role' = 'admin') OR 
    ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'),
    false
  );
$$;

-- Step 2: Create function to safely update distributor status (admin only)
CREATE OR REPLACE FUNCTION update_distributor_status(
  distributor_user_id UUID,
  new_status TEXT
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Step 3: Create function to get distributor approval status
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

-- Step 4: Create function to approve multiple distributors (batch approval)
CREATE OR REPLACE FUNCTION batch_approve_distributors(distributor_user_ids UUID[])
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Step 5: Create function to get pending distributors count (admin only)
CREATE OR REPLACE FUNCTION get_pending_distributors_count()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM distributor_profiles
  WHERE status = 'pending'
    AND is_admin_user();  -- Only admins can see this count
$$;

-- Step 6: Update distributor_profiles table constraints
DO $$
BEGIN
  -- Drop existing status constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'distributor_profiles_status_check' 
    AND table_name = 'distributor_profiles'
  ) THEN
    ALTER TABLE distributor_profiles DROP CONSTRAINT distributor_profiles_status_check;
  END IF;
  
  -- Add updated status constraint
  ALTER TABLE distributor_profiles 
  ADD CONSTRAINT distributor_profiles_status_check 
  CHECK (status IN ('pending', 'active', 'inactive', 'rejected'));
END $$;

-- Step 7: Add approved_at and approved_by columns if they don't exist
DO $$
BEGIN
  -- Add approved_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'distributor_profiles' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE distributor_profiles ADD COLUMN approved_at TIMESTAMPTZ;
  END IF;
  
  -- Add approved_by column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'distributor_profiles' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE distributor_profiles ADD COLUMN approved_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Step 8: Create RLS policies for distributor approval system

-- Create trigger function to prevent non-admin status changes
CREATE OR REPLACE FUNCTION prevent_non_admin_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger to enforce status change restrictions
DROP TRIGGER IF EXISTS trigger_prevent_non_admin_status_change ON distributor_profiles;
CREATE TRIGGER trigger_prevent_non_admin_status_change
  BEFORE UPDATE ON distributor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_non_admin_status_change();

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "admin_and_owner_access" ON distributor_profiles;
DROP POLICY IF EXISTS "admin_email_access" ON distributor_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON distributor_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON distributor_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON distributor_profiles;
DROP POLICY IF EXISTS "distributor_profile_select" ON distributor_profiles;
DROP POLICY IF EXISTS "distributor_profile_insert" ON distributor_profiles;
DROP POLICY IF EXISTS "distributor_profile_update" ON distributor_profiles;
DROP POLICY IF EXISTS "distributor_profile_delete" ON distributor_profiles;

-- Create comprehensive RLS policies

-- Allow users to view their own profile + admins to view all
CREATE POLICY "distributor_profile_select" ON distributor_profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id  -- Users can see their own profile
  OR is_admin_user()    -- Admins can see all profiles
);

-- Allow users to insert their own profile during registration
CREATE POLICY "distributor_profile_insert" ON distributor_profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id  -- Users can only create profile for themselves
  AND status = 'pending'  -- New registrations must start as pending
);

-- Allow users to update their own profile (except status) + admins to update everything
CREATE POLICY "distributor_profile_update" ON distributor_profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id  -- Users can update their own profile
  OR is_admin_user()    -- Admins can update any profile
);

-- Only admins can delete distributor profiles
CREATE POLICY "distributor_profile_delete" ON distributor_profiles
FOR DELETE
TO authenticated
USING (is_admin_user());

-- Step 9: Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION is_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION update_distributor_status(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_distributor_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION batch_approve_distributors(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_distributors_count() TO authenticated;
GRANT EXECUTE ON FUNCTION prevent_non_admin_status_change() TO authenticated;

-- Step 10: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_distributor_profiles_status ON distributor_profiles(status);
CREATE INDEX IF NOT EXISTS idx_distributor_profiles_approved_at ON distributor_profiles(approved_at);
CREATE INDEX IF NOT EXISTS idx_distributor_profiles_user_id_status ON distributor_profiles(user_id, status);

-- Step 11: Update existing pending profiles to ensure consistency
UPDATE distributor_profiles 
SET status = 'pending' 
WHERE status IS NULL OR status = '';

-- Step 12: Add helpful comments
COMMENT ON FUNCTION is_admin_user() IS 'Returns true if current user is an administrator';
COMMENT ON FUNCTION update_distributor_status(UUID, TEXT) IS 'Securely updates distributor status (admin only)';
COMMENT ON FUNCTION get_distributor_status(UUID) IS 'Gets distributor approval status for user';
COMMENT ON FUNCTION batch_approve_distributors(UUID[]) IS 'Batch approve multiple distributors (admin only)';
COMMENT ON FUNCTION get_pending_distributors_count() IS 'Returns count of pending distributor applications (admin only)';

-- Success message
SELECT 'Distributor approval system successfully implemented!' as result;