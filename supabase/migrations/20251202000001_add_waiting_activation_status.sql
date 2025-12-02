-- Add waiting_activation status to distributor approval system
-- This migration adds the new status for the 3-step registration workflow

-- Step 1: Update the status constraint to include waiting_activation
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
  
  -- Add updated status constraint with waiting_activation
  ALTER TABLE distributor_profiles 
  ADD CONSTRAINT distributor_profiles_status_check 
  CHECK (status IN ('pending', 'waiting_activation', 'active', 'inactive', 'rejected'));
END $$;

-- Step 2: Update the secure update function to accept waiting_activation status
CREATE OR REPLACE FUNCTION update_distributor_status(
  distributor_user_id UUID,
  new_status TEXT
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  valid_statuses TEXT[] := ARRAY['pending', 'waiting_activation', 'active', 'inactive', 'rejected'];
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

-- Step 3: Add helpful comment
COMMENT ON CONSTRAINT distributor_profiles_status_check ON distributor_profiles IS 
'Valid statuses: pending (new registration), waiting_activation (KYB completed), active (admin approved), inactive (deactivated), rejected (denied)';

-- Success message
SELECT 'waiting_activation status successfully added to distributor approval system!' as result;