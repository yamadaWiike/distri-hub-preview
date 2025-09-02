-- Add new columns to distributor_profiles table
ALTER TABLE public.distributor_profiles ADD COLUMN IF NOT EXISTS email_pemilik TEXT;
ALTER TABLE public.distributor_profiles ADD COLUMN IF NOT EXISTS website_perusahaan TEXT;
ALTER TABLE public.distributor_profiles ADD COLUMN IF NOT EXISTS jumlah_karyawan INTEGER;
ALTER TABLE public.distributor_profiles ADD COLUMN IF NOT EXISTS npwp TEXT;

-- Update the email_pemilik with email from auth.users for existing profiles
UPDATE public.distributor_profiles
SET email_pemilik = auth.users.email
FROM auth.users
WHERE distributor_profiles.user_id = auth.users.id
  AND distributor_profiles.email_pemilik IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.distributor_profiles.email_pemilik IS 'Email address of the business owner';
COMMENT ON COLUMN public.distributor_profiles.website_perusahaan IS 'Company website URL';
COMMENT ON COLUMN public.distributor_profiles.jumlah_karyawan IS 'Number of employees';
COMMENT ON COLUMN public.distributor_profiles.npwp IS 'Tax identification number';
