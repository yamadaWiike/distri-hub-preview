-- UOM System Migration - Run this directly in your Supabase SQL Editor
-- This script creates the complete UOM functionality integrated with your existing schema

-- Enable the uuid-ossp extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create UOM Units table
CREATE TABLE IF NOT EXISTS public.uom_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  symbol VARCHAR(10),
  category VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add columns if they don't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'uom_units' AND column_name = 'symbol') THEN
    ALTER TABLE public.uom_units ADD COLUMN symbol VARCHAR(10);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'uom_units' AND column_name = 'category') THEN
    ALTER TABLE public.uom_units ADD COLUMN category VARCHAR(50);
  END IF;
END $$;

-- 2. Create UOM Conversions table  
CREATE TABLE IF NOT EXISTS public.uom_conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  from_uom VARCHAR(50) NOT NULL,
  to_uom VARCHAR(50) NOT NULL,
  conversion_factor DECIMAL(10,4) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, from_uom, to_uom)
);

-- 3. Create UOM Pricing table
CREATE TABLE IF NOT EXISTS public.uom_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  uom VARCHAR(50) NOT NULL,
  area VARCHAR NOT NULL,
  distributor_price DECIMAL(10,2) NOT NULL,
  moq INTEGER NOT NULL,
  moq_uom VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, uom, area)
);

-- 4. Add UOM columns to existing products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS base_uom VARCHAR(50) DEFAULT 'pcs',
ADD COLUMN IF NOT EXISTS moq_uom VARCHAR(50) DEFAULT 'pcs', 
ADD COLUMN IF NOT EXISTS pricing_uom VARCHAR(50) DEFAULT 'pcs',
ADD COLUMN IF NOT EXISTS enable_uom_conversions BOOLEAN DEFAULT false;

-- 5. Add UOM columns to existing region_pricing table
ALTER TABLE public.region_pricing
ADD COLUMN IF NOT EXISTS price_uom VARCHAR(50) DEFAULT 'pcs',
ADD COLUMN IF NOT EXISTS moq_uom VARCHAR(50) DEFAULT 'pcs';

-- 6. Add UOM columns to existing order_items table  
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS uom VARCHAR(50) DEFAULT 'pcs',
ADD COLUMN IF NOT EXISTS unit_uom VARCHAR(50) DEFAULT 'pcs';

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS uom_conversions_product_id_idx ON public.uom_conversions (product_id);
CREATE INDEX IF NOT EXISTS uom_conversions_from_uom_idx ON public.uom_conversions (from_uom);
CREATE INDEX IF NOT EXISTS uom_conversions_to_uom_idx ON public.uom_conversions (to_uom);
CREATE INDEX IF NOT EXISTS uom_pricing_product_id_idx ON public.uom_pricing (product_id);
CREATE INDEX IF NOT EXISTS uom_pricing_uom_idx ON public.uom_pricing (uom);
CREATE INDEX IF NOT EXISTS uom_pricing_area_idx ON public.uom_pricing (area);

-- 8. Insert default UOM units
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

-- 9. Enable Row Level Security
ALTER TABLE public.uom_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uom_conversions ENABLE ROW LEVEL SECURITY; 
ALTER TABLE public.uom_pricing ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies (adjust based on your auth requirements)

-- UOM Units - allow everyone to read, restrict writes
DROP POLICY IF EXISTS "Allow public read access" ON public.uom_units;
CREATE POLICY "Allow public read access" ON public.uom_units
  FOR SELECT USING (true);

-- UOM Conversions - allow everyone to read, restrict writes  
DROP POLICY IF EXISTS "Allow public read access" ON public.uom_conversions;
CREATE POLICY "Allow public read access" ON public.uom_conversions
  FOR SELECT USING (true);

-- UOM Pricing - allow everyone to read, restrict writes
DROP POLICY IF EXISTS "Allow public read access" ON public.uom_pricing;  
CREATE POLICY "Allow public read access" ON public.uom_pricing
  FOR SELECT USING (true);

-- 11. Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 12. Create triggers for updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON public.uom_units;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.uom_units
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.uom_conversions;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.uom_conversions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.uom_pricing;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.uom_pricing
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 13. Create database views for easier querying
CREATE OR REPLACE VIEW public.products_with_uom AS
SELECT 
  p.*,
  base_u.description as base_uom_description,
  base_u.symbol as base_uom_symbol,
  moq_u.description as moq_uom_description, 
  moq_u.symbol as moq_uom_symbol,
  pricing_u.description as pricing_uom_description,
  pricing_u.symbol as pricing_uom_symbol
FROM public.products p
LEFT JOIN public.uom_units base_u ON p.base_uom = base_u.name
LEFT JOIN public.uom_units moq_u ON p.moq_uom = moq_u.name
LEFT JOIN public.uom_units pricing_u ON p.pricing_uom = pricing_u.name;

-- 14. Create comprehensive pricing view
CREATE OR REPLACE VIEW public.product_pricing_with_uom AS
SELECT 
  p.id,
  p.sku,
  p.name,
  p.base_uom,
  p.pricing_uom,
  p.enable_uom_conversions,
  rp.area as region_area,
  rp.distributor_price as region_price,
  rp.moq as region_moq,
  rp.price_uom as region_price_uom,
  rp.moq_uom as region_moq_uom,
  up.uom as uom_name,
  up.area as uom_area,
  up.distributor_price as uom_price,
  up.moq as uom_moq,
  up.moq_uom as uom_moq_unit,
  u.description as uom_description,
  u.symbol as uom_symbol,
  u.category as uom_category
FROM public.products p
LEFT JOIN public.region_pricing rp ON p.id = rp.product_id
LEFT JOIN public.uom_pricing up ON p.id = up.product_id AND up.is_active = true
LEFT JOIN public.uom_units u ON up.uom = u.name;

-- 15. Create PostgreSQL functions for UOM operations

-- Function to get product pricing by UOM
CREATE OR REPLACE FUNCTION public.get_product_pricing_by_uom(
  p_product_id UUID,
  p_uom VARCHAR(50),
  p_area VARCHAR
)
RETURNS TABLE (
  product_id UUID,
  uom VARCHAR(50),
  area VARCHAR,
  distributor_price DECIMAL(10,2),
  moq INTEGER,
  moq_uom VARCHAR(50)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.product_id,
    up.uom,
    up.area,
    up.distributor_price,
    up.moq,
    up.moq_uom
  FROM public.uom_pricing up
  WHERE up.product_id = p_product_id 
    AND up.uom = p_uom 
    AND up.area = p_area
    AND up.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to convert quantities between UOMs
CREATE OR REPLACE FUNCTION public.convert_quantity_uom(
  p_product_id UUID,
  p_quantity DECIMAL(10,4),
  p_from_uom VARCHAR(50),
  p_to_uom VARCHAR(50)
)
RETURNS DECIMAL(10,4) AS $$
DECLARE
  conversion_factor DECIMAL(10,4);
BEGIN
  -- If converting to same UOM, return original quantity
  IF p_from_uom = p_to_uom THEN
    RETURN p_quantity;
  END IF;
  
  -- Get conversion factor
  SELECT uc.conversion_factor INTO conversion_factor
  FROM public.uom_conversions uc
  WHERE uc.product_id = p_product_id
    AND uc.from_uom = p_from_uom
    AND uc.to_uom = p_to_uom
    AND uc.is_active = true;
    
  -- If no direct conversion found, try reverse conversion
  IF conversion_factor IS NULL THEN
    SELECT (1.0 / uc.conversion_factor) INTO conversion_factor
    FROM public.uom_conversions uc
    WHERE uc.product_id = p_product_id
      AND uc.from_uom = p_to_uom
      AND uc.to_uom = p_from_uom
      AND uc.is_active = true;
  END IF;
  
  -- If still no conversion found, return original quantity
  IF conversion_factor IS NULL THEN
    RETURN p_quantity;
  END IF;
  
  RETURN p_quantity * conversion_factor;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ UOM migration completed successfully!';
  RAISE NOTICE 'Created tables: uom_units, uom_conversions, uom_pricing';
  RAISE NOTICE 'Enhanced tables: products, region_pricing, order_items';
  RAISE NOTICE 'Created views: products_with_uom, product_pricing_with_uom';
  RAISE NOTICE 'Created functions: get_product_pricing_by_uom, convert_quantity_uom';
  RAISE NOTICE 'Inserted % default UOM units', (SELECT COUNT(*) FROM public.uom_units);
END $$;