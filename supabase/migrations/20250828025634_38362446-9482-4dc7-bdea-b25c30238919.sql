-- Create profiles table for distributor registration
CREATE TABLE public.distributor_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  nama_bisnis TEXT NOT NULL,
  alamat_lengkap TEXT NOT NULL,
  kota_kabupaten TEXT NOT NULL,
  nama_pemilik TEXT NOT NULL,
  kontak_pemilik TEXT NOT NULL,
  email_pemilik TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.distributor_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for distributor profiles
CREATE POLICY "Users can view their own profile" 
ON public.distributor_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.distributor_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.distributor_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_distributor_profiles_updated_at
  BEFORE UPDATE ON public.distributor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();