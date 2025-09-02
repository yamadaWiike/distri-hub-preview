-- Create the products table
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR PRIMARY KEY,
  category VARCHAR NOT NULL,
  brand VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  size VARCHAR NOT NULL,
  distributor_price INTEGER NOT NULL,
  consumer_price INTEGER NOT NULL,
  moq INTEGER NOT NULL,
  description TEXT NOT NULL,
  image VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the region_pricing table
CREATE TABLE IF NOT EXISTS region_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id VARCHAR NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  area VARCHAR NOT NULL,
  distributor_price INTEGER NOT NULL,
  moq INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on product_id for faster lookups
CREATE INDEX IF NOT EXISTS region_pricing_product_id_idx ON region_pricing (product_id);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE region_pricing ENABLE ROW LEVEL SECURITY;

-- Create policies for products - allow reading for everyone, but only admins can modify
CREATE POLICY "Allow public read access" ON products
  FOR SELECT USING (true);
  
CREATE POLICY "Allow admin full access" ON products
  USING (auth.uid() IN (SELECT user_id FROM distributor_profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM distributor_profiles WHERE role = 'admin'));

-- Create policies for region_pricing - same logic as products
CREATE POLICY "Allow public read access" ON region_pricing
  FOR SELECT USING (true);
  
CREATE POLICY "Allow admin full access" ON region_pricing
  USING (auth.uid() IN (SELECT user_id FROM distributor_profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM distributor_profiles WHERE role = 'admin'));
