-- Add missing fields to products table
-- This migration adds fields that were in the UI but missing from the database schema

-- Add retail_price column (separate from distributor and consumer pricing)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS retail_price NUMERIC CHECK (retail_price >= 0);

-- Add distributor_price as an alias/additional field (in addition to base_distributor_price)
-- This can be used for general distributor pricing while base_distributor_price is for regional calculations
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS distributor_price NUMERIC CHECK (distributor_price >= 0);

-- Add moq (general MOQ) in addition to base_moq
-- base_moq is used for UOM calculations, moq is the simple minimum order quantity
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS moq INTEGER CHECK (moq >= 0);

-- Add unit_per_package for packaging information
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS unit_per_package INTEGER CHECK (unit_per_package > 0);

-- Add allow_negative_stock flag for inventory management
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS allow_negative_stock BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN public.products.retail_price IS 'Suggested retail price for end consumers';
COMMENT ON COLUMN public.products.distributor_price IS 'Standard distributor price (not region-specific)';
COMMENT ON COLUMN public.products.moq IS 'Minimum order quantity in base units';
COMMENT ON COLUMN public.products.unit_per_package IS 'Number of units per package/box';
COMMENT ON COLUMN public.products.allow_negative_stock IS 'Allow orders when stock is negative';

-- Add indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_products_retail_price ON public.products (retail_price);
CREATE INDEX IF NOT EXISTS idx_products_distributor_price ON public.products (distributor_price);
CREATE INDEX IF NOT EXISTS idx_products_allow_negative_stock ON public.products (allow_negative_stock);
