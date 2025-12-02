-- =====================================================
-- APPLY BANKING & OPERATIONAL FIELDS MIGRATION
-- Run this in Supabase SQL Editor
-- =====================================================
-- This script adds all missing fields for the 
-- "Perbankan & Operasional" section in Profile page
-- =====================================================

-- Banking fields
ALTER TABLE public.distributor_profiles 
ADD COLUMN IF NOT EXISTS nama_bank TEXT,
ADD COLUMN IF NOT EXISTS nama_pemilik_akun TEXT,
ADD COLUMN IF NOT EXISTS nomor_rekening TEXT,
ADD COLUMN IF NOT EXISTS jumlah_armada_pengiriman TEXT;

-- PIC (Person In Charge) fields
ALTER TABLE public.distributor_profiles 
ADD COLUMN IF NOT EXISTS nama_pic TEXT,
ADD COLUMN IF NOT EXISTS posisi_pic TEXT,
ADD COLUMN IF NOT EXISTS nomor_kontak_pic TEXT,
ADD COLUMN IF NOT EXISTS email_pic TEXT;

-- Warehouse & Company fields
ALTER TABLE public.distributor_profiles 
ADD COLUMN IF NOT EXISTS alamat_gudang TEXT,
ADD COLUMN IF NOT EXISTS koordinat TEXT,
ADD COLUMN IF NOT EXISTS foto_gudang TEXT,
ADD COLUMN IF NOT EXISTS omzet TEXT,
ADD COLUMN IF NOT EXISTS bentuk_usaha TEXT,
ADD COLUMN IF NOT EXISTS nib TEXT;

-- Document URL fields
ALTER TABLE public.distributor_profiles 
ADD COLUMN IF NOT EXISTS npwp_file_url TEXT,
ADD COLUMN IF NOT EXISTS nib_file_url TEXT,
ADD COLUMN IF NOT EXISTS ktp_file_url TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_distributor_profiles_nama_bank 
ON public.distributor_profiles(nama_bank);

CREATE INDEX IF NOT EXISTS idx_distributor_profiles_nama_pic 
ON public.distributor_profiles(nama_pic);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'distributor_profiles'
  AND column_name IN (
    'nama_bank', 'nama_pemilik_akun', 'nomor_rekening', 'jumlah_armada_pengiriman',
    'nama_pic', 'posisi_pic', 'nomor_kontak_pic', 'email_pic',
    'alamat_gudang', 'koordinat', 'foto_gudang', 'omzet', 'bentuk_usaha', 'nib',
    'npwp_file_url', 'nib_file_url', 'ktp_file_url'
  )
ORDER BY column_name;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '📊 Added 17 new columns to distributor_profiles table';
  RAISE NOTICE '   - Banking: 4 fields';
  RAISE NOTICE '   - PIC: 4 fields';
  RAISE NOTICE '   - Warehouse/Company: 6 fields';
  RAISE NOTICE '   - Documents: 3 fields';
END $$;
