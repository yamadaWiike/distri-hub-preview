-- Create UOM (Unit of Measure) related tables

-- 1. Units of Measure table
CREATE TABLE IF NOT EXISTS uom_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. UOM Conversions table
CREATE TABLE IF NOT EXISTS uom_conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  from_uom VARCHAR(50) NOT NULL,
  to_uom VARCHAR(50) NOT NULL,
  conversion_factor DECIMAL(10,4) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, from_uom, to_uom)
);

-- 3. UOM-specific pricing table
CREATE TABLE IF NOT EXISTS uom_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  uom VARCHAR(50) NOT NULL,
  area VARCHAR NOT NULL,
  distributor_price INTEGER NOT NULL,
  moq INTEGER NOT NULL,
  moq_uom VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, uom, area)
);

-- 4. Add UOM fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS base_uom VARCHAR(50) DEFAULT 'pcs',
ADD COLUMN IF NOT EXISTS moq_uom VARCHAR(50) DEFAULT 'pcs',
ADD COLUMN IF NOT EXISTS pricing_uom VARCHAR(50) DEFAULT 'pcs',
ADD COLUMN IF NOT EXISTS enable_uom_conversions BOOLEAN DEFAULT false;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS uom_conversions_product_id_idx ON uom_conversions (product_id);
CREATE INDEX IF NOT EXISTS uom_conversions_from_uom_idx ON uom_conversions (from_uom);
CREATE INDEX IF NOT EXISTS uom_conversions_to_uom_idx ON uom_conversions (to_uom);
CREATE INDEX IF NOT EXISTS uom_pricing_product_id_idx ON uom_pricing (product_id);
CREATE INDEX IF NOT EXISTS uom_pricing_uom_idx ON uom_pricing (uom);
CREATE INDEX IF NOT EXISTS uom_pricing_area_idx ON uom_pricing (area);

-- Insert default UOM units
INSERT INTO uom_units (name, description) VALUES
  ('pcs', 'Pieces'),
  ('box', 'Box'),
  ('carton', 'Carton'),
  ('kg', 'Kilogram'),
  ('gram', 'Gram'),
  ('liter', 'Liter'),
  ('ml', 'Milliliter'),
  ('dozen', 'Dozen'),
  ('pack', 'Pack'),
  ('bottle', 'Bottle')
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE uom_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE uom_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE uom_pricing ENABLE ROW LEVEL SECURITY;

-- Create policies for UOM tables

-- UOM Units - allow everyone to read, admins to modify
CREATE POLICY "Allow public read access" ON uom_units
  FOR SELECT USING (true);

CREATE POLICY "Allow admin full access" ON uom_units
  FOR ALL USING (true);

-- UOM Conversions - allow everyone to read, admins to modify
CREATE POLICY "Allow public read access" ON uom_conversions
  FOR SELECT USING (true);

CREATE POLICY "Allow admin full access" ON uom_conversions
  FOR ALL USING (true);

-- UOM Pricing - allow everyone to read, admins to modify
CREATE POLICY "Allow public read access" ON uom_pricing
  FOR SELECT USING (true);

CREATE POLICY "Allow admin full access" ON uom_pricing
  FOR ALL USING (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_uom_units_updated_at BEFORE UPDATE ON uom_units
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_uom_conversions_updated_at BEFORE UPDATE ON uom_conversions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_uom_pricing_updated_at BEFORE UPDATE ON uom_pricing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();