-- Migration: Add new address fields to distributor_profiles table
-- Date: 2025-12-02
-- Description: Refactor address system from province+city to province+regency+district

-- Add new address columns
ALTER TABLE distributor_profiles
ADD COLUMN IF NOT EXISTS province_name TEXT,
ADD COLUMN IF NOT EXISTS regency_id TEXT,
ADD COLUMN IF NOT EXISTS regency_name TEXT,
ADD COLUMN IF NOT EXISTS district_id TEXT,
ADD COLUMN IF NOT EXISTS district_name TEXT;

-- Add comments for documentation
COMMENT ON COLUMN distributor_profiles.province_id IS 'Province ID from reg_provinces table';
COMMENT ON COLUMN distributor_profiles.province_name IS 'Province name (Provinsi)';
COMMENT ON COLUMN distributor_profiles.regency_id IS 'Regency ID from reg_regencies table (Kota/Kabupaten)';
COMMENT ON COLUMN distributor_profiles.regency_name IS 'Regency name (Kota/Kabupaten)';
COMMENT ON COLUMN distributor_profiles.district_id IS 'District ID from reg_districts table (Kecamatan)';
COMMENT ON COLUMN distributor_profiles.district_name IS 'District name (Kecamatan)';

-- Note: We keep the 'kota' column for backward compatibility
-- It will be populated with regency_name for new registrations
COMMENT ON COLUMN distributor_profiles.kota IS 'Legacy city field - kept for backward compatibility, now populated with regency_name';
