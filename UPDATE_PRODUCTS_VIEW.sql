-- Create or update the products_with_variants view to include UOM fields
-- Run this in your Supabase SQL Editor

-- Drop the existing view if it exists
DROP VIEW IF EXISTS public.products_with_variants;

-- Create the updated view with UOM fields
CREATE OR REPLACE VIEW public.products_with_variants AS
SELECT 
  p.id,
  p.sku,
  p.name,
  p.size,
  p.base_distributor_price as distributor_price,
  p.consumer_price,
  p.base_moq as moq,
  p.description,
  p.image_url as image,
  p.is_active,
  p.stock_quantity,
  p.has_variants,
  -- UOM fields
  p.base_uom,
  p.moq_uom,
  p.pricing_uom,
  p.enable_uom_conversions,
  -- Category and brand info
  COALESCE(pc.name, 'Uncategorized') as category,
  COALESCE(b.name, 'Unknown') as brand,
  -- Count variants
  COALESCE(variant_counts.variant_count, 0) as variant_count
FROM public.products p
LEFT JOIN public.product_categories pc ON p.category_id = pc.id
LEFT JOIN public.brands b ON p.brand_id = b.id
LEFT JOIN (
  SELECT 
    product_id,
    COUNT(*) as variant_count
  FROM public.product_variants
  WHERE is_active = true
  GROUP BY product_id
) variant_counts ON p.id = variant_counts.product_id
WHERE p.is_active = true;