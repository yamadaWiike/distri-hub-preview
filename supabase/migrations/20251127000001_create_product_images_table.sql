-- Create product_images table to support multiple images per product
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_is_primary ON product_images(product_id, is_primary);

-- Add RLS policies
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all product images
CREATE POLICY "Allow authenticated users to view product images"
  ON product_images FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert product images
CREATE POLICY "Allow authenticated users to insert product images"
  ON product_images FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update product images
CREATE POLICY "Allow authenticated users to update product images"
  ON product_images FOR UPDATE
  TO authenticated
  USING (true);

-- Allow authenticated users to delete product images
CREATE POLICY "Allow authenticated users to delete product images"
  ON product_images FOR DELETE
  TO authenticated
  USING (true);

-- Add comment
COMMENT ON TABLE product_images IS 'Stores multiple images for each product with primary image designation';
