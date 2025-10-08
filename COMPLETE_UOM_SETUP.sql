-- Complete UOM Setup Script for Testing
-- Run this in your Supabase SQL Editor to set up UOM functionality

-- =====================================================
-- 1. Insert default UOM units
-- =====================================================
INSERT INTO public.uom_units (name, description, symbol, category) VALUES
  ('pcs', 'Pieces', 'pcs', 'Count'),
  ('box', 'Box', 'box', 'Package'),
  ('carton', 'Carton', 'ctn', 'Package'),
  ('kg', 'Kilogram', 'kg', 'Weight'),
  ('gram', 'Gram', 'g', 'Weight'),
  ('liter', 'Liter', 'L', 'Volume'),
  ('ml', 'Milliliter', 'mL', 'Volume'),
  ('dozen', 'Dozen', 'dz', 'Count'),
  ('pack', 'Pack', 'pk', 'Package'),
  ('bottle', 'Bottle', 'btl', 'Package'),
  ('can', 'Can', 'can', 'Package'),
  ('bag', 'Bag', 'bag', 'Package'),
  ('roll', 'Roll', 'roll', 'Package'),
  ('sheet', 'Sheet', 'sht', 'Count'),
  ('meter', 'Meter', 'm', 'Length')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 2. Update/Create products_with_variants view with UOM fields
-- =====================================================
DROP VIEW IF EXISTS public.products_with_variants;

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

-- =====================================================
-- 3. Update Test SKU product to use carton UOM
-- =====================================================
UPDATE public.products 
SET 
  moq_uom = 'carton',
  base_uom = 'pcs',
  pricing_uom = 'carton',
  enable_uom_conversions = true
WHERE name ILIKE '%test%' OR sku ILIKE '%test%';

-- =====================================================
-- 4. Update region pricing for Test SKU
-- =====================================================
UPDATE public.region_pricing 
SET 
  moq_uom = 'carton',
  price_uom = 'carton'
WHERE product_id IN (
  SELECT id FROM public.products 
  WHERE name ILIKE '%test%' OR sku ILIKE '%test%'
);

-- =====================================================
-- 5. Add UOM conversion for Test SKU (1 carton = 24 pcs)
-- =====================================================
INSERT INTO public.uom_conversions (product_id, from_uom, to_uom, conversion_factor)
SELECT 
  id,
  'carton',
  'pcs',
  24.0
FROM public.products 
WHERE name ILIKE '%test%' OR sku ILIKE '%test%'
ON CONFLICT DO NOTHING;

-- Also add reverse conversion
INSERT INTO public.uom_conversions (product_id, from_uom, to_uom, conversion_factor)
SELECT 
  id,
  'pcs',
  'carton',
  1.0/24.0
FROM public.products 
WHERE name ILIKE '%test%' OR sku ILIKE '%test%'
ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. Verification queries
-- =====================================================

-- Check UOM units
SELECT 'UOM Units:' as info, name, description, symbol, category 
FROM public.uom_units 
ORDER BY category, name;

-- Check updated products
SELECT 'Updated Products:' as info, name, sku, base_uom, moq_uom, pricing_uom, enable_uom_conversions
FROM public.products 
WHERE name ILIKE '%test%' OR sku ILIKE '%test%';

-- Check region pricing with UOM
SELECT 'Region Pricing UOM:' as info, p.name, rp.area, rp.moq, rp.moq_uom, rp.distributor_price, rp.price_uom
FROM public.products p
JOIN public.region_pricing rp ON p.id = rp.product_id
WHERE p.name ILIKE '%test%' OR p.sku ILIKE '%test%';

-- Check UOM conversions
SELECT 'UOM Conversions:' as info, p.name, uc.from_uom, uc.to_uom, uc.conversion_factor
FROM public.products p
JOIN public.uom_conversions uc ON p.id = uc.product_id
WHERE p.name ILIKE '%test%' OR p.sku ILIKE '%test%';

-- Test the updated view
SELECT 'Products View Test:' as info, name, sku, moq, moq_uom, pricing_uom, category, brand, variant_count
FROM public.products_with_variants 
WHERE name ILIKE '%test%' OR sku ILIKE '%test%';

-- =====================================================
-- Success message
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ UOM setup completed successfully!';
  RAISE NOTICE 'Updated products_with_variants view to include UOM fields';
  RAISE NOTICE 'Inserted % UOM units', (SELECT COUNT(*) FROM public.uom_units);
  RAISE NOTICE 'Updated % test products with carton UOM', (SELECT COUNT(*) FROM public.products WHERE name ILIKE '%test%' OR sku ILIKE '%test%');
  RAISE NOTICE 'Now refresh your application to see MOQ displayed as "carton" for test products';
END $$;