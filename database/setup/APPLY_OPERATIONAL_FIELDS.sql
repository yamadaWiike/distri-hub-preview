-- STANDALONE SCRIPT: Add Operational Fields to distributor_profiles
-- Copy and paste this entire script into Supabase SQL Editor
-- This adds the missing operational fields for the "Perbankan & Operasional" section

BEGIN;

-- Add operational fields if they don't exist
ALTER TABLE public.distributor_profiles 
ADD COLUMN IF NOT EXISTS metode_pembayaran TEXT,
ADD COLUMN IF NOT EXISTS aplikasi_pencatatan TEXT,
ADD COLUMN IF NOT EXISTS area_distribusi TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.distributor_profiles.metode_pembayaran IS 'Payment methods accepted (e.g., Cash, Transfer, Credit terms)';
COMMENT ON COLUMN public.distributor_profiles.aplikasi_pencatatan IS 'Recording/accounting application used (e.g., Excel, SAP, Custom)';
COMMENT ON COLUMN public.distributor_profiles.area_distribusi IS 'Distribution coverage area (e.g., Jakarta, Tangerang, Bekasi)';

COMMIT;

-- Verify the columns were added
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'distributor_profiles'
    AND column_name IN ('metode_pembayaran', 'aplikasi_pencatatan', 'area_distribusi')
ORDER BY column_name;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Operational fields added successfully!';
    RAISE NOTICE '   • metode_pembayaran';
    RAISE NOTICE '   • aplikasi_pencatatan';  
    RAISE NOTICE '   • area_distribusi';
END $$;
