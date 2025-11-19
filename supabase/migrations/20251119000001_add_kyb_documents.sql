-- Add KYB document columns to distributor_profiles table
-- KYB (Know Your Business) verification documents

ALTER TABLE public.distributor_profiles 
ADD COLUMN IF NOT EXISTS store_photo_url TEXT,
ADD COLUMN IF NOT EXISTS ktp_url TEXT,
ADD COLUMN IF NOT EXISTS akta_url TEXT,
ADD COLUMN IF NOT EXISTS npwp_url TEXT,
ADD COLUMN IF NOT EXISTS email_perusahaan TEXT,
ADD COLUMN IF NOT EXISTS nomor_telp_perusahaan TEXT,
ADD COLUMN IF NOT EXISTS nama_direktur TEXT,
ADD COLUMN IF NOT EXISTS status_pkp TEXT DEFAULT 'Non-PKP',
ADD COLUMN IF NOT EXISTS npwp_number TEXT,
ADD COLUMN IF NOT EXISTS nib_number TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.distributor_profiles.store_photo_url IS 'URL to store photo (uploaded to S3 or localStorage)';
COMMENT ON COLUMN public.distributor_profiles.ktp_url IS 'URL to owner ID card (KTP) document';
COMMENT ON COLUMN public.distributor_profiles.akta_url IS 'URL to company registration document (Akta Pendirian/NIB)';
COMMENT ON COLUMN public.distributor_profiles.npwp_url IS 'URL to tax identification document (NPWP)';
COMMENT ON COLUMN public.distributor_profiles.email_perusahaan IS 'Company email address';
COMMENT ON COLUMN public.distributor_profiles.nomor_telp_perusahaan IS 'Company phone number';
COMMENT ON COLUMN public.distributor_profiles.nama_direktur IS 'Director full name';
COMMENT ON COLUMN public.distributor_profiles.status_pkp IS 'PKP status: PKP or Non-PKP (taxable entrepreneur status)';
COMMENT ON COLUMN public.distributor_profiles.npwp_number IS 'Tax identification number (NPWP)';
COMMENT ON COLUMN public.distributor_profiles.nib_number IS 'Business identification number (NIB)';

