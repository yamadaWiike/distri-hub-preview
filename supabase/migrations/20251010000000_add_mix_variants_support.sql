-- Migration: Add support for mixing variants to reach MOQ
-- Date: 2025-10-10

-- Add single_sku_moq column to products table if it doesn't exist yet
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS single_sku_moq INTEGER DEFAULT 0;

-- Add comment for the single_sku_moq column
COMMENT ON COLUMN public.products.single_sku_moq IS 'Minimum order quantity for the entire SKU (combined across all variants)';

-- Add allow_mix_variants column to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS allow_mix_variants BOOLEAN DEFAULT FALSE;

-- Add comment for the allow_mix_variants column
COMMENT ON COLUMN public.products.allow_mix_variants IS 'Whether different variants of this product can be mixed to reach the minimum order quantity';

-- Add sku_level_moq and allow_mix_variants columns to region_pricing table
ALTER TABLE public.region_pricing
ADD COLUMN IF NOT EXISTS sku_level_moq INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS allow_mix_variants BOOLEAN DEFAULT FALSE;

-- Add comments for the new columns
COMMENT ON COLUMN public.region_pricing.sku_level_moq IS 'Minimum order quantity for the entire SKU (across all variants)';
COMMENT ON COLUMN public.region_pricing.allow_mix_variants IS 'Whether different variants can be mixed to reach the minimum order quantity';

-- Update existing region_pricing entries to copy values from their parent products
-- Use a conditional update to handle cases where data may already exist
DO $$
BEGIN
  -- Only perform the update if both columns exist
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'single_sku_moq'
  ) THEN
    UPDATE public.region_pricing rp
    SET 
      sku_level_moq = COALESCE(p.single_sku_moq, 0),
      allow_mix_variants = COALESCE(p.allow_mix_variants, false)
    FROM 
      public.products p
    WHERE 
      rp.product_id = p.id;
  END IF;
END $$;