-- Populate UOM data for testing
-- Run this in your Supabase SQL Editor

-- 1. Insert default UOM units if they don't exist
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
  ('bottle', 'Bottle', 'btl', 'Package')
ON CONFLICT (name) DO NOTHING;

-- 2. Update the "Test SKU" product to use carton as MOQ UOM for testing
UPDATE public.products 
SET 
  moq_uom = 'carton',
  base_uom = 'pcs',
  pricing_uom = 'carton',
  enable_uom_conversions = true
WHERE name = 'Test SKU' OR sku LIKE '%test%' OR sku LIKE '%Test%';

-- 3. Update region pricing for Test SKU to use carton UOM
UPDATE public.region_pricing 
SET 
  moq_uom = 'carton',
  price_uom = 'carton'
WHERE product_id IN (
  SELECT id FROM public.products 
  WHERE name = 'Test SKU' OR sku LIKE '%test%' OR sku LIKE '%Test%'
);

-- 4. If you want to add a UOM conversion for Test SKU (1 carton = 24 pcs)
INSERT INTO public.uom_conversions (product_id, from_uom, to_uom, conversion_factor)
SELECT 
  id,
  'carton',
  'pcs',
  24.0
FROM public.products 
WHERE name = 'Test SKU' OR sku LIKE '%test%' OR sku LIKE '%Test%'
ON CONFLICT DO NOTHING;

-- 5. Verify the changes
SELECT 
  p.name,
  p.sku,
  p.base_uom,
  p.moq_uom,
  p.pricing_uom,
  p.enable_uom_conversions,
  rp.area,
  rp.moq_uom as region_moq_uom,
  rp.price_uom as region_price_uom
FROM public.products p
LEFT JOIN public.region_pricing rp ON p.id = rp.product_id
WHERE p.name = 'Test SKU' OR p.sku LIKE '%test%' OR p.sku LIKE '%Test%'
ORDER BY p.name, rp.area;

-- 6. Check if UOM units were inserted
SELECT * FROM public.uom_units ORDER BY name;