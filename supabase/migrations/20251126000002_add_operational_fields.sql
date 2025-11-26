-- Add additional operational fields to distributor_profiles table
-- These fields complete the "Perbankan & Operasional" section

ALTER TABLE public.distributor_profiles 
ADD COLUMN IF NOT EXISTS metode_pembayaran TEXT,
ADD COLUMN IF NOT EXISTS aplikasi_pencatatan TEXT,
ADD COLUMN IF NOT EXISTS area_distribusi TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.distributor_profiles.metode_pembayaran IS 'Payment methods accepted (e.g., Cash, Transfer, Credit terms)';
COMMENT ON COLUMN public.distributor_profiles.aplikasi_pencatatan IS 'Recording/accounting application used (e.g., Excel, SAP, Custom)';
COMMENT ON COLUMN public.distributor_profiles.area_distribusi IS 'Distribution coverage area (e.g., Jakarta, Tangerang, Bekasi)';
