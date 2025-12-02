-- Add banking and operational fields to distributor_profiles table
-- These fields are used in the "Perbankan & Operasional" section of the profile

ALTER TABLE public.distributor_profiles 
ADD COLUMN IF NOT EXISTS nama_bank TEXT,
ADD COLUMN IF NOT EXISTS nama_pemilik_akun TEXT,
ADD COLUMN IF NOT EXISTS nomor_rekening TEXT,
ADD COLUMN IF NOT EXISTS jumlah_armada_pengiriman TEXT;

-- Add PIC (Person In Charge) fields for warehouse management
ALTER TABLE public.distributor_profiles 
ADD COLUMN IF NOT EXISTS nama_pic TEXT,
ADD COLUMN IF NOT EXISTS posisi_pic TEXT,
ADD COLUMN IF NOT EXISTS nomor_kontak_pic TEXT,
ADD COLUMN IF NOT EXISTS email_pic TEXT;

-- Add additional warehouse/company fields
ALTER TABLE public.distributor_profiles 
ADD COLUMN IF NOT EXISTS alamat_gudang TEXT,
ADD COLUMN IF NOT EXISTS koordinat TEXT,
ADD COLUMN IF NOT EXISTS foto_gudang TEXT,
ADD COLUMN IF NOT EXISTS omzet TEXT,
ADD COLUMN IF NOT EXISTS bentuk_usaha TEXT,
ADD COLUMN IF NOT EXISTS nib TEXT;

-- Add document URL fields (if not already exist from previous migration)
ALTER TABLE public.distributor_profiles 
ADD COLUMN IF NOT EXISTS npwp_file_url TEXT,
ADD COLUMN IF NOT EXISTS nib_file_url TEXT,
ADD COLUMN IF NOT EXISTS ktp_file_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.distributor_profiles.nama_bank IS 'Bank name for distributor account';
COMMENT ON COLUMN public.distributor_profiles.nama_pemilik_akun IS 'Bank account owner name';
COMMENT ON COLUMN public.distributor_profiles.nomor_rekening IS 'Bank account number';
COMMENT ON COLUMN public.distributor_profiles.jumlah_armada_pengiriman IS 'Number of delivery vehicles/fleet';

COMMENT ON COLUMN public.distributor_profiles.nama_pic IS 'Person In Charge (PIC) name for warehouse';
COMMENT ON COLUMN public.distributor_profiles.posisi_pic IS 'PIC position/role';
COMMENT ON COLUMN public.distributor_profiles.nomor_kontak_pic IS 'PIC contact number';
COMMENT ON COLUMN public.distributor_profiles.email_pic IS 'PIC email address';

COMMENT ON COLUMN public.distributor_profiles.alamat_gudang IS 'Warehouse address';
COMMENT ON COLUMN public.distributor_profiles.koordinat IS 'Warehouse GPS coordinates (latitude, longitude)';
COMMENT ON COLUMN public.distributor_profiles.foto_gudang IS 'Warehouse photo URL';
COMMENT ON COLUMN public.distributor_profiles.omzet IS 'Business turnover/revenue';
COMMENT ON COLUMN public.distributor_profiles.bentuk_usaha IS 'Business entity type (PT, CV, UD, etc)';
COMMENT ON COLUMN public.distributor_profiles.nib IS 'Business Identification Number (NIB)';

COMMENT ON COLUMN public.distributor_profiles.npwp_file_url IS 'NPWP document file URL';
COMMENT ON COLUMN public.distributor_profiles.nib_file_url IS 'NIB document file URL';
COMMENT ON COLUMN public.distributor_profiles.ktp_file_url IS 'KTP (ID Card) document file URL';
