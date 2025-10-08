-- Updated Database Schema with UOM Integration
-- This migration updates the existing schema to include UOM functionality

-- 1. Add UOM columns to existing products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS base_uom VARCHAR(50) DEFAULT 'pcs',
ADD COLUMN IF NOT EXISTS moq_uom VARCHAR(50) DEFAULT 'pcs', 
ADD COLUMN IF NOT EXISTS pricing_uom VARCHAR(50) DEFAULT 'pcs',
ADD COLUMN IF NOT EXISTS enable_uom_conversions BOOLEAN DEFAULT false;

-- 2. Create UOM Units table (master data for available units)
CREATE TABLE IF NOT EXISTS public.uom_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  symbol VARCHAR(10), -- e.g., 'kg', 'pcs', 'L'
  category VARCHAR(50), -- e.g., 'weight', 'volume', 'count'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Create UOM Conversions table (product-specific conversions)
CREATE TABLE IF NOT EXISTS public.uom_conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  from_uom VARCHAR(50) NOT NULL,
  to_uom VARCHAR(50) NOT NULL,
  conversion_factor DECIMAL(10,4) NOT NULL CHECK (conversion_factor > 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT uom_conversions_unique_conversion UNIQUE(product_id, from_uom, to_uom),
  CONSTRAINT uom_conversions_from_uom_fkey FOREIGN KEY (from_uom) REFERENCES public.uom_units(name),
  CONSTRAINT uom_conversions_to_uom_fkey FOREIGN KEY (to_uom) REFERENCES public.uom_units(name)
);

-- 4. Create UOM-specific pricing table (replaces some region_pricing functionality)
CREATE TABLE IF NOT EXISTS public.uom_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  uom VARCHAR(50) NOT NULL,
  area VARCHAR NOT NULL, -- Distribution area name
  distributor_price NUMERIC NOT NULL CHECK (distributor_price > 0),
  moq INTEGER NOT NULL DEFAULT 1,
  moq_uom VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT uom_pricing_unique_product_uom_area UNIQUE(product_id, uom, area),
  CONSTRAINT uom_pricing_uom_fkey FOREIGN KEY (uom) REFERENCES public.uom_units(name),
  CONSTRAINT uom_pricing_moq_uom_fkey FOREIGN KEY (moq_uom) REFERENCES public.uom_units(name)
);

-- 5. Update region_pricing table to include UOM context
ALTER TABLE public.region_pricing 
ADD COLUMN IF NOT EXISTS price_uom VARCHAR(50) DEFAULT 'pcs',
ADD COLUMN IF NOT EXISTS moq_uom VARCHAR(50) DEFAULT 'pcs';

-- Add foreign key constraints for the new UOM columns (after inserting default data)
-- We'll do this after inserting the default UOM units

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_base_uom ON public.products (base_uom);
CREATE INDEX IF NOT EXISTS idx_products_enable_uom ON public.products (enable_uom_conversions);
CREATE INDEX IF NOT EXISTS idx_uom_conversions_product_id ON public.uom_conversions (product_id);
CREATE INDEX IF NOT EXISTS idx_uom_conversions_from_uom ON public.uom_conversions (from_uom);
CREATE INDEX IF NOT EXISTS idx_uom_conversions_to_uom ON public.uom_conversions (to_uom);
CREATE INDEX IF NOT EXISTS idx_uom_pricing_product_id ON public.uom_pricing (product_id);
CREATE INDEX IF NOT EXISTS idx_uom_pricing_uom ON public.uom_pricing (uom);
CREATE INDEX IF NOT EXISTS idx_uom_pricing_area ON public.uom_pricing (area);
CREATE INDEX IF NOT EXISTS idx_region_pricing_price_uom ON public.region_pricing (price_uom);

-- 7. Insert default UOM units
INSERT INTO public.uom_units (name, description, symbol, category) VALUES
  ('pcs', 'Pieces', 'pcs', 'count'),
  ('box', 'Box', 'box', 'packaging'),
  ('carton', 'Carton', 'ctn', 'packaging'),
  ('pack', 'Pack', 'pack', 'packaging'),
  ('dozen', 'Dozen', 'dz', 'count'),
  ('kg', 'Kilogram', 'kg', 'weight'),
  ('gram', 'Gram', 'g', 'weight'),
  ('liter', 'Liter', 'L', 'volume'),
  ('ml', 'Milliliter', 'mL', 'volume'),
  ('bottle', 'Bottle', 'btl', 'packaging'),
  ('can', 'Can', 'can', 'packaging'),
  ('sachet', 'Sachet', 'scht', 'packaging'),
  ('pouch', 'Pouch', 'pouch', 'packaging'),
  ('tube', 'Tube', 'tube', 'packaging'),
  ('roll', 'Roll', 'roll', 'packaging')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  symbol = EXCLUDED.symbol,
  category = EXCLUDED.category,
  updated_at = now();

-- 8. Now add foreign key constraints for UOM columns in products table
-- (We do this after inserting the default units to avoid constraint violations)
ALTER TABLE public.products 
ADD CONSTRAINT IF NOT EXISTS products_base_uom_fkey 
  FOREIGN KEY (base_uom) REFERENCES public.uom_units(name),
ADD CONSTRAINT IF NOT EXISTS products_moq_uom_fkey 
  FOREIGN KEY (moq_uom) REFERENCES public.uom_units(name),
ADD CONSTRAINT IF NOT EXISTS products_pricing_uom_fkey 
  FOREIGN KEY (pricing_uom) REFERENCES public.uom_units(name);

-- 9. Add foreign key constraints for region_pricing UOM columns
ALTER TABLE public.region_pricing 
ADD CONSTRAINT IF NOT EXISTS region_pricing_price_uom_fkey 
  FOREIGN KEY (price_uom) REFERENCES public.uom_units(name),
ADD CONSTRAINT IF NOT EXISTS region_pricing_moq_uom_fkey 
  FOREIGN KEY (moq_uom) REFERENCES public.uom_units(name);

-- 10. Enable Row Level Security for new tables
ALTER TABLE public.uom_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uom_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uom_pricing ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS policies for UOM tables (following existing pattern)

-- UOM Units policies
CREATE POLICY "Allow public read access on uom_units" ON public.uom_units
  FOR SELECT USING (true);

CREATE POLICY "Allow admin full access on uom_units" ON public.uom_units
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.distributor_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- UOM Conversions policies  
CREATE POLICY "Allow public read access on uom_conversions" ON public.uom_conversions
  FOR SELECT USING (true);

CREATE POLICY "Allow admin full access on uom_conversions" ON public.uom_conversions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.distributor_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- UOM Pricing policies
CREATE POLICY "Allow public read access on uom_pricing" ON public.uom_pricing
  FOR SELECT USING (true);

CREATE POLICY "Allow admin full access on uom_pricing" ON public.uom_pricing
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.distributor_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 12. Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 13. Add updated_at triggers for new tables
CREATE TRIGGER handle_uom_units_updated_at
    BEFORE UPDATE ON public.uom_units
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_uom_conversions_updated_at
    BEFORE UPDATE ON public.uom_conversions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_uom_pricing_updated_at
    BEFORE UPDATE ON public.uom_pricing
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 14. Create view for products with UOM information
CREATE OR REPLACE VIEW public.products_with_uom AS
SELECT 
  p.*,
  bu.description as base_uom_description,
  bu.symbol as base_uom_symbol,
  mu.description as moq_uom_description,
  mu.symbol as moq_uom_symbol,
  pu.description as pricing_uom_description,
  pu.symbol as pricing_uom_symbol
FROM public.products p
LEFT JOIN public.uom_units bu ON p.base_uom = bu.name
LEFT JOIN public.uom_units mu ON p.moq_uom = mu.name  
LEFT JOIN public.uom_units pu ON p.pricing_uom = pu.name;

-- 15. Create view for comprehensive product pricing with UOM
CREATE OR REPLACE VIEW public.product_pricing_with_uom AS
SELECT 
  p.id,
  p.sku,
  p.name,
  p.base_uom,
  p.pricing_uom,
  p.enable_uom_conversions,
  
  -- Regional pricing (traditional)
  rp.area as region_area,
  rp.distributor_price as region_price,
  rp.moq as region_moq,
  rp.price_uom as region_price_uom,
  rp.moq_uom as region_moq_uom,
  
  -- UOM-specific pricing
  up.uom as uom_name,
  up.area as uom_area,
  up.distributor_price as uom_price,
  up.moq as uom_moq,
  up.moq_uom as uom_moq_unit,
  
  -- UOM unit details
  u.description as uom_description,
  u.symbol as uom_symbol,
  u.category as uom_category

FROM public.products p
LEFT JOIN public.region_pricing rp ON p.id = rp.product_id AND rp.id IS NOT NULL
LEFT JOIN public.uom_pricing up ON p.id = up.product_id AND up.is_active = true
LEFT JOIN public.uom_units u ON up.uom = u.name AND u.is_active = true
WHERE p.is_active = true;

-- 16. Create function to get product pricing for a specific UOM and area
CREATE OR REPLACE FUNCTION public.get_product_pricing_by_uom(
  p_product_id UUID,
  p_uom VARCHAR(50),
  p_area VARCHAR
) 
RETURNS TABLE (
  product_id UUID,
  uom VARCHAR(50),
  area VARCHAR,
  distributor_price NUMERIC,
  moq INTEGER,
  moq_uom VARCHAR(50)
) AS $$
BEGIN
  -- Try UOM-specific pricing first
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
    
  -- If no UOM-specific pricing, check if we need to return anything
  IF NOT FOUND THEN
    -- Could implement fallback logic here if needed
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 17. Create function to convert quantities between UOMs for a product
CREATE OR REPLACE FUNCTION public.convert_quantity_uom(
  p_product_id UUID,
  p_quantity NUMERIC,
  p_from_uom VARCHAR(50),
  p_to_uom VARCHAR(50)
)
RETURNS NUMERIC AS $$
DECLARE
  conversion_factor NUMERIC;
  reverse_factor NUMERIC;
BEGIN
  -- If same UOM, return original quantity
  IF p_from_uom = p_to_uom THEN
    RETURN p_quantity;
  END IF;
  
  -- Try direct conversion
  SELECT uc.conversion_factor INTO conversion_factor
  FROM public.uom_conversions uc
  WHERE uc.product_id = p_product_id 
    AND uc.from_uom = p_from_uom 
    AND uc.to_uom = p_to_uom 
    AND uc.is_active = true;
    
  IF conversion_factor IS NOT NULL THEN
    RETURN p_quantity * conversion_factor;
  END IF;
  
  -- Try reverse conversion
  SELECT (1.0 / uc.conversion_factor) INTO reverse_factor
  FROM public.uom_conversions uc
  WHERE uc.product_id = p_product_id 
    AND uc.from_uom = p_to_uom 
    AND uc.to_uom = p_from_uom 
    AND uc.is_active = true;
    
  IF reverse_factor IS NOT NULL THEN
    RETURN p_quantity * reverse_factor;
  END IF;
  
  -- No conversion found, return original quantity
  RETURN p_quantity;
END;
$$ LANGUAGE plpgsql;

-- 18. Update order_items table to include UOM information
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS uom VARCHAR(50) DEFAULT 'pcs',
ADD COLUMN IF NOT EXISTS unit_uom VARCHAR(50) DEFAULT 'pcs';

-- Add foreign key constraints for order_items UOM columns
ALTER TABLE public.order_items 
ADD CONSTRAINT IF NOT EXISTS order_items_uom_fkey 
  FOREIGN KEY (uom) REFERENCES public.uom_units(name),
ADD CONSTRAINT IF NOT EXISTS order_items_unit_uom_fkey 
  FOREIGN KEY (unit_uom) REFERENCES public.uom_units(name);

-- 19. Create indexes for order_items UOM columns  
CREATE INDEX IF NOT EXISTS idx_order_items_uom ON public.order_items (uom);
CREATE INDEX IF NOT EXISTS idx_order_items_unit_uom ON public.order_items (unit_uom);

-- 20. Grant necessary permissions (adjust as needed for your auth setup)
GRANT SELECT ON public.uom_units TO anon, authenticated;
GRANT SELECT ON public.uom_conversions TO anon, authenticated;
GRANT SELECT ON public.uom_pricing TO anon, authenticated;
GRANT SELECT ON public.products_with_uom TO anon, authenticated;
GRANT SELECT ON public.product_pricing_with_uom TO anon, authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.uom_units IS 'Master table for units of measure (pcs, kg, box, etc.)';
COMMENT ON TABLE public.uom_conversions IS 'Product-specific conversion factors between units';
COMMENT ON TABLE public.uom_pricing IS 'UOM-specific pricing per distribution area';
COMMENT ON COLUMN public.products.base_uom IS 'Primary unit of measure for the product';
COMMENT ON COLUMN public.products.moq_uom IS 'Unit of measure for minimum order quantity';
COMMENT ON COLUMN public.products.pricing_uom IS 'Unit of measure for pricing display';
COMMENT ON COLUMN public.products.enable_uom_conversions IS 'Whether UOM conversion system is enabled for this product';

-- Migration complete
SELECT 'UOM integration migration completed successfully' AS status;