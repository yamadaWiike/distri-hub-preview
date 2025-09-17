-- Create product_variants table to store variant options
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id VARCHAR NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_name VARCHAR NOT NULL,
  variant_description TEXT,
  additional_price INTEGER DEFAULT 0, -- Additional price over base product price
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on product_id for faster lookups
CREATE INDEX IF NOT EXISTS product_variants_product_id_idx ON product_variants (product_id);

-- Enable Row Level Security
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Create policies for product_variants - allow reading for everyone, but only admins can modify
CREATE POLICY "Allow public read access" ON product_variants
  FOR SELECT USING (true);
  
CREATE POLICY "Allow admin full access" ON product_variants
  USING (auth.uid() IN (SELECT user_id FROM distributor_profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM distributor_profiles WHERE role = 'admin'));

-- Insert sample data for variants
INSERT INTO product_variants (product_id, variant_name, variant_description, additional_price)
VALUES
  -- Keripik Kentang Original Variants
  ('SKU-CHIPS-10', 'Pedas', 'Varian dengan tambahan bumbu pedas', 500),
  ('SKU-CHIPS-10', 'Extra Crispy', 'Tekstur lebih renyah dengan ketebalan khusus', 700),
  
  -- Keripik Kentang BBQ Variants
  ('SKU-CHIPS-11', 'Strong BBQ', 'BBQ dengan rasa yang lebih kuat', 600),
  ('SKU-CHIPS-11', 'Honey BBQ', 'BBQ dengan tambahan madu', 800),
  
  -- Mi Instan Variants
  ('SKU-NOODLE-30', 'Pedas Level 1', 'Sedikit pedas', 300),
  ('SKU-NOODLE-30', 'Pedas Level 2', 'Pedas sedang', 500),
  ('SKU-NOODLE-30', 'Pedas Level 3', 'Sangat pedas', 800),
  
  -- Minuman Variants
  ('SKU-DRINK-50', 'Dingin', 'Disajikan dengan es', 1000),
  ('SKU-DRINK-50', 'Extra Energy', 'Dengan tambahan kafein', 1500),
  
  -- Coffee Variants
  ('SKU-COFFEE-60', 'Extra Sugar', 'Dengan tambahan gula', 500),
  ('SKU-COFFEE-60', 'Less Sugar', 'Dengan pengurangan gula', 0);

-- Create or replace view to get products with variant counts
CREATE OR REPLACE VIEW products_with_variants AS
SELECT 
  p.*,
  COUNT(pv.id) as variant_count
FROM 
  products p
LEFT JOIN
  product_variants pv ON p.id = pv.product_id
GROUP BY
  p.id;

-- Add function to get variants for a product
CREATE OR REPLACE FUNCTION get_product_variants(product_id VARCHAR)
RETURNS TABLE (
  id UUID,
  variant_name VARCHAR,
  variant_description TEXT,
  additional_price INTEGER,
  is_active BOOLEAN
) 
LANGUAGE SQL
AS $$
  SELECT 
    id, 
    variant_name, 
    variant_description, 
    additional_price, 
    is_active
  FROM 
    product_variants
  WHERE 
    product_id = $1
    AND is_active = TRUE
  ORDER BY 
    variant_name;
$$;
