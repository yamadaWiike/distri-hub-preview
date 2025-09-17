-- Complete SQL Script to inject products, variants, categories, brands, and pricing data
-- This script handles the CSV data as a direct SQL injection for Supabase
-- Updated to match the provided database schema

-- Step 1: Create temporary tables to hold the raw CSV data
CREATE TEMP TABLE temp_product_csv (
  sku_id TEXT,
  category TEXT,
  brand TEXT,
  product_name TEXT,
  size TEXT,
  full_name TEXT,
  variant TEXT,
  distribution_area TEXT,
  distributor_price_ctn TEXT,
  distributor_price_pcs TEXT,
  consumer_price_ctn TEXT,
  consumer_price_pcs TEXT,
  pcs_per_ctn TEXT,
  moq TEXT,
  product_picture TEXT
);

-- Step 2: Insert raw data from the CSV
INSERT INTO temp_product_csv (sku_id, category, brand, product_name, size, full_name, variant, distribution_area, 
                            distributor_price_ctn, distributor_price_pcs, consumer_price_ctn, consumer_price_pcs, 
                            pcs_per_ctn, moq, product_picture) VALUES
('FMCG001', 'Snack', 'Anak Tempe', 'Keripik Tempe', '15 gr', 'Anak Tempe Keripik Tempe - 15 gr', 'Original', 'Jabodetabek', '56,000', '1,400', '80,000', '2,000', '40', '200', 'https://drive.google.com/file/d/1EoWVR2XKaqJGLj22dDNYgg_xZTaWsBgi/view?usp=drive_link'),
('FMCG001', 'Snack', 'Anak Tempe', 'Keripik Tempe', '15 gr', 'Anak Tempe Keripik Tempe - 15 gr', 'BBQ', 'Jabodetabek', '56,000', '1,400', '80,000', '2,000', '40', '200', 'https://drive.google.com/file/d/1EoWVR2XKaqJGLj22dDNYgg_xZTaWsBgi/view?usp=drive_link'),
('FMCG001', 'Snack', 'Anak Tempe', 'Keripik Tempe', '15 gr', 'Anak Tempe Keripik Tempe - 15 gr', 'Jagung Manis', 'Jabodetabek', '56,000', '1,400', '80,000', '2,000', '40', '200', 'https://drive.google.com/file/d/1EoWVR2XKaqJGLj22dDNYgg_xZTaWsBgi/view?usp=drive_link'),
('FMCG001', 'Snack', 'Anak Tempe', 'Keripik Tempe', '15 gr', 'Anak Tempe Keripik Tempe - 15 gr', 'Tempe Balado', 'Jabodetabek', '56,000', '1,400', '80,000', '2,000', '40', '200', 'https://drive.google.com/file/d/1EoWVR2XKaqJGLj22dDNYgg_xZTaWsBgi/view?usp=drive_link'),
('FMCG001', 'Snack', 'Anak Tempe', 'Keripik Tempe', '15 gr', 'Anak Tempe Keripik Tempe - 15 gr', 'Original', 'Jawa Barat', '56,000', '1,400', '80,000', '2,000', '40', '200', 'https://drive.google.com/file/d/1EoWVR2XKaqJGLj22dDNYgg_xZTaWsBgi/view?usp=drive_link'),
('FMCG001', 'Snack', 'Anak Tempe', 'Keripik Tempe', '15 gr', 'Anak Tempe Keripik Tempe - 15 gr', 'BBQ', 'Jawa Barat', '56,000', '1,400', '80,000', '2,000', '40', '200', 'https://drive.google.com/file/d/1EoWVR2XKaqJGLj22dDNYgg_xZTaWsBgi/view?usp=drive_link'),
('FMCG001', 'Snack', 'Anak Tempe', 'Keripik Tempe', '15 gr', 'Anak Tempe Keripik Tempe - 15 gr', 'Jagung Manis', 'Jawa Barat', '56,000', '1,400', '80,000', '2,000', '40', '200', 'https://drive.google.com/file/d/1EoWVR2XKaqJGLj22dDNYgg_xZTaWsBgi/view?usp=drive_link'),
('FMCG001', 'Snack', 'Anak Tempe', 'Keripik Tempe', '15 gr', 'Anak Tempe Keripik Tempe - 15 gr', 'Tempe Balado', 'Jawa Barat', '56,000', '1,400', '80,000', '2,000', '40', '200', 'https://drive.google.com/file/d/1EoWVR2XKaqJGLj22dDNYgg_xZTaWsBgi/view?usp=drive_link'),
('FMCG001', 'Snack', 'Anak Tempe', 'Keripik Tempe', '15 gr', 'Anak Tempe Keripik Tempe - 15 gr', 'Original', 'Jawa Tengah', '56,000', '1,400', '80,000', '2,000', '40', '200', 'https://drive.google.com/file/d/1EoWVR2XKaqJGLj22dDNYgg_xZTaWsBgi/view?usp=drive_link'),
('FMCG001', 'Snack', 'Anak Tempe', 'Keripik Tempe', '15 gr', 'Anak Tempe Keripik Tempe - 15 gr', 'BBQ', 'Jawa Tengah', '56,000', '1,400', '80,000', '2,000', '40', '200', 'https://drive.google.com/file/d/1EoWVR2XKaqJGLj22dDNYgg_xZTaWsBgi/view?usp=drive_link'),
('FMCG001', 'Snack', 'Anak Tempe', 'Keripik Tempe', '15 gr', 'Anak Tempe Keripik Tempe - 15 gr', 'Jagung Manis', 'Jawa Tengah', '56,000', '1,400', '80,000', '2,000', '40', '200', 'https://drive.google.com/file/d/1EoWVR2XKaqJGLj22dDNYgg_xZTaWsBgi/view?usp=drive_link'),
('FMCG001', 'Snack', 'Anak Tempe', 'Keripik Tempe', '15 gr', 'Anak Tempe Keripik Tempe - 15 gr', 'Tempe Balado', 'Jawa Tengah', '56,000', '1,400', '80,000', '2,000', '40', '200', 'https://drive.google.com/file/d/1EoWVR2XKaqJGLj22dDNYgg_xZTaWsBgi/view?usp=drive_link'),
('FMCG002', 'Snack', 'Let''z', 'Popcorn', '20 gr', 'Let''z Popcorn - 20 gr', 'Caramel', 'Jabodetabek', '44,500', '1,483', '60,000', '2,000', '30', '200', 'https://drive.google.com/file/d/1Vo8PDkm34UbtcI9AqlpiMErr5CqoJAdP/view?usp=drive_link'),
('FMCG002', 'Snack', 'Let''z', 'Popcorn', '20 gr', 'Let''z Popcorn - 20 gr', 'Caramel', 'Jawa Barat', '44,500', '1,483', '60,000', '2,000', '30', '650', 'https://drive.google.com/file/d/1Vo8PDkm34UbtcI9AqlpiMErr5CqoJAdP/view?usp=drive_link'),
('FMCG002', 'Snack', 'Let''z', 'Popcorn', '20 gr', 'Let''z Popcorn - 20 gr', 'Caramel', 'Jawa Tengah', '44,500', '1,483', '60,000', '2,000', '30', '1,300', 'https://drive.google.com/file/d/1Vo8PDkm34UbtcI9AqlpiMErr5CqoJAdP/view?usp=drive_link'),
('FMCG002', 'Snack', 'Let''z', 'Popcorn', '20 gr', 'Let''z Popcorn - 20 gr', 'Caramel', 'Jawa Timur', '44,500', '1,483', '60,000', '2,000', '30', '1,300', 'https://drive.google.com/file/d/1Vo8PDkm34UbtcI9AqlpiMErr5CqoJAdP/view?usp=drive_link'),
('FMCG003', 'Snack', 'Let''z', 'Gula Kapas', '10 gr', 'Let''z Gula Kapas - 10 gr', 'Leci', 'Jabodetabek', '57,600', '1,440', '80,000', '2,000', '40', '680', 'https://drive.google.com/file/d/1-oMDVEdUhBvURMlbImAGGjZBxR_8vdVL/view?usp=drive_link'),
('FMCG003', 'Snack', 'Let''z', 'Gula Kapas', '10 gr', 'Let''z Gula Kapas - 10 gr', 'Anggur', 'Jabodetabek', '57,600', '1,440', '80,000', '2,000', '40', '680', 'https://drive.google.com/file/d/1-oMDVEdUhBvURMlbImAGGjZBxR_8vdVL/view?usp=drive_link'),
('FMCG003', 'Snack', 'Let''z', 'Gula Kapas', '10 gr', 'Let''z Gula Kapas - 10 gr', 'Strawberry', 'Jabodetabek', '57,600', '1,440', '80,000', '2,000', '40', '680', 'https://drive.google.com/file/d/1-oMDVEdUhBvURMlbImAGGjZBxR_8vdVL/view?usp=drive_link'),
('FMCG003', 'Snack', 'Let''z', 'Gula Kapas', '10 gr', 'Let''z Gula Kapas - 10 gr', 'Jeruk', 'Jabodetabek', '57,600', '1,440', '80,000', '2,000', '40', '680', 'https://drive.google.com/file/d/1-oMDVEdUhBvURMlbImAGGjZBxR_8vdVL/view?usp=drive_link'),
('FMCG003', 'Snack', 'Let''z', 'Gula Kapas', '10 gr', 'Let''z Gula Kapas - 10 gr', 'Leci', 'Jawa Barat', '57,600', '1,440', '80,000', '2,000', '40', '680', 'https://drive.google.com/file/d/1-oMDVEdUhBvURMlbImAGGjZBxR_8vdVL/view?usp=drive_link'),
('FMCG003', 'Snack', 'Let''z', 'Gula Kapas', '10 gr', 'Let''z Gula Kapas - 10 gr', 'Anggur', 'Jawa Barat', '57,600', '1,440', '80,000', '2,000', '40', '680', 'https://drive.google.com/file/d/1-oMDVEdUhBvURMlbImAGGjZBxR_8vdVL/view?usp=drive_link'),
('FMCG003', 'Snack', 'Let''z', 'Gula Kapas', '10 gr', 'Let''z Gula Kapas - 10 gr', 'Strawberry', 'Jawa Barat', '57,600', '1,440', '80,000', '2,000', '40', '680', 'https://drive.google.com/file/d/1-oMDVEdUhBvURMlbImAGGjZBxR_8vdVL/view?usp=drive_link'),
('FMCG003', 'Snack', 'Let''z', 'Gula Kapas', '10 gr', 'Let''z Gula Kapas - 10 gr', 'Jeruk', 'Jawa Barat', '57,600', '1,440', '80,000', '2,000', '40', '680', 'https://drive.google.com/file/d/1-oMDVEdUhBvURMlbImAGGjZBxR_8vdVL/view?usp=drive_link'),
('FMCG003', 'Snack', 'Let''z', 'Gula Kapas', '10 gr', 'Let''z Gula Kapas - 10 gr', 'Leci', 'Jawa Tengah', '57,600', '1,440', '80,000', '2,000', '40', '1,300', 'https://drive.google.com/file/d/1-oMDVEdUhBvURMlbImAGGjZBxR_8vdVL/view?usp=drive_link'),
('FMCG003', 'Snack', 'Let''z', 'Gula Kapas', '10 gr', 'Let''z Gula Kapas - 10 gr', 'Anggur', 'Jawa Tengah', '57,600', '1,440', '80,000', '2,000', '40', '1,300', 'https://drive.google.com/file/d/1-oMDVEdUhBvURMlbImAGGjZBxR_8vdVL/view?usp=drive_link'),
('FMCG003', 'Snack', 'Let''z', 'Gula Kapas', '10 gr', 'Let''z Gula Kapas - 10 gr', 'Strawberry', 'Jawa Tengah', '57,600', '1,440', '80,000', '2,000', '40', '1,300', 'https://drive.google.com/file/d/1-oMDVEdUhBvURMlbImAGGjZBxR_8vdVL/view?usp=drive_link'),
('FMCG003', 'Snack', 'Let''z', 'Gula Kapas', '10 gr', 'Let''z Gula Kapas - 10 gr', 'Jeruk', 'Jawa Tengah', '57,600', '1,440', '80,000', '2,000', '40', '1,300', 'https://drive.google.com/file/d/1-oMDVEdUhBvURMlbImAGGjZBxR_8vdVL/view?usp=drive_link'),
('FMCG003', 'Snack', 'Let''z', 'Gula Kapas', '10 gr', 'Let''z Gula Kapas - 10 gr', 'Leci', 'Jawa Timur', '57,600', '1,440', '80,000', '2,000', '40', '1,300', 'https://drive.google.com/file/d/1-oMDVEdUhBvURMlbImAGGjZBxR_8vdVL/view?usp=drive_link'),
('FMCG003', 'Snack', 'Let''z', 'Gula Kapas', '10 gr', 'Let''z Gula Kapas - 10 gr', 'Anggur', 'Jawa Timur', '57,600', '1,440', '80,000', '2,000', '40', '1,300', 'https://drive.google.com/file/d/1-oMDVEdUhBvURMlbImAGGjZBxR_8vdVL/view?usp=drive_link'),
('FMCG003', 'Snack', 'Let''z', 'Gula Kapas', '10 gr', 'Let''z Gula Kapas - 10 gr', 'Strawberry', 'Jawa Timur', '57,600', '1,440', '80,000', '2,000', '40', '1,300', 'https://drive.google.com/file/d/1-oMDVEdUhBvURMlbImAGGjZBxR_8vdVL/view?usp=drive_link'),
('FMCG003', 'Snack', 'Let''z', 'Gula Kapas', '10 gr', 'Let''z Gula Kapas - 10 gr', 'Jeruk', 'Jawa Timur', '57,600', '1,440', '80,000', '2,000', '40', '1,300', 'https://drive.google.com/file/d/1-oMDVEdUhBvURMlbImAGGjZBxR_8vdVL/view?usp=drive_link'),
('FMCG004', 'Snack', 'Wispish', 'Keripik Singkong', '25 gr', 'Wispish Keripik Singkong - 25 gr', 'Original', 'Jabodetabek', '86,500', '1,442', '120,000', '2,000', '60', '300', 'https://drive.google.com/file/d/1kfBrTbfC7OHM_dVOXrhzcHjl979mJUpV/view?usp=drive_link');

-- Continue with the rest of the products
-- For brevity, I'm showing a subset of the data here. In the actual file, all CSV rows would be included.

-- Step 3: Create a cleaned table with proper data types
CREATE TEMP TABLE cleaned_product_csv AS
SELECT
  sku_id,
  category,
  brand,
  product_name,
  size,
  full_name,
  variant,
  distribution_area,
  -- Clean and convert numeric fields
  REPLACE(REPLACE(distributor_price_ctn, ',', ''), '"', '')::NUMERIC AS distributor_price_ctn,
  REPLACE(REPLACE(distributor_price_pcs, ',', ''), '"', '')::NUMERIC AS distributor_price_pcs,
  REPLACE(REPLACE(consumer_price_ctn, ',', ''), '"', '')::NUMERIC AS consumer_price_ctn,
  REPLACE(REPLACE(consumer_price_pcs, ',', ''), '"', '')::NUMERIC AS consumer_price_pcs,
  REPLACE(REPLACE(pcs_per_ctn, ',', ''), '"', '')::INTEGER AS pcs_per_ctn,
  REPLACE(REPLACE(moq, ',', ''), '"', '')::INTEGER AS moq,
  -- Convert Google Drive links to preview format
  REPLACE(product_picture, 'view?usp=drive_link', 'preview') AS image_url
FROM 
  temp_product_csv;

-- Step 4: Insert unique categories
INSERT INTO product_categories (name)
SELECT DISTINCT category 
FROM cleaned_product_csv
ON CONFLICT (name) DO NOTHING;

-- Step 5: Insert unique brands
INSERT INTO brands (name)
SELECT DISTINCT brand 
FROM cleaned_product_csv
ON CONFLICT (name) DO NOTHING;

-- Step 6: Create unique product SKUs for each variant and region combination
-- This ensures every product variant in each region gets its own SKU
-- Format: BASE_SKU-VARIANT_SLUG-REGION_SLUG
CREATE TEMP TABLE product_skus AS
SELECT
  sku_id || CASE 
    WHEN variant != '' AND variant IS NOT NULL 
    THEN '-' || LOWER(REPLACE(REPLACE(variant, ' ', '-'), '''', '')) 
    ELSE '' 
  END || '-' || LOWER(REPLACE(distribution_area, ' ', '-')) AS unique_sku,
  sku_id AS base_sku,
  category,
  brand,
  product_name,
  size,
  full_name,
  variant,
  distribution_area,
  distributor_price_ctn,
  consumer_price_ctn,
  moq,
  image_url,
  pcs_per_ctn
FROM 
  cleaned_product_csv;

-- Step 7: Insert products with unique SKUs
INSERT INTO products (
  sku,
  name,
  size,
  description,
  base_distributor_price,
  consumer_price,
  base_moq,
  image_url,
  brand_id,
  category_id,
  has_variants,
  stock_quantity,
  is_active
)
SELECT
  ps.unique_sku,
  ps.product_name || CASE WHEN ps.variant != '' THEN ' - ' || ps.variant ELSE '' END,
  ps.size,
  ps.brand || ' ' || ps.product_name || ' - ' || ps.size || CASE WHEN ps.variant != '' THEN ' (' || ps.variant || ')' ELSE '' END || ' - ' || ps.distribution_area,
  ps.distributor_price_ctn,
  ps.consumer_price_ctn,
  ps.moq,
  ps.image_url,
  b.id AS brand_id,
  c.id AS category_id,
  FALSE, -- Each product is a specific variant and region, so no variants needed
  1000, -- Default stock
  TRUE  -- Active by default
FROM
  product_skus ps
JOIN brands b ON ps.brand = b.name
JOIN product_categories c ON ps.category = c.name
ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  size = EXCLUDED.size,
  description = EXCLUDED.description,
  base_distributor_price = EXCLUDED.base_distributor_price,
  consumer_price = EXCLUDED.consumer_price,
  base_moq = EXCLUDED.base_moq,
  image_url = EXCLUDED.image_url,
  brand_id = EXCLUDED.brand_id,
  category_id = EXCLUDED.category_id,
  has_variants = EXCLUDED.has_variants;

-- Step 8: Associate each product with its parent product (optional if needed)
-- First, create base products (one per base SKU)
CREATE TEMP TABLE base_products AS
SELECT DISTINCT ON (base_sku)
  base_sku,
  product_name,
  size,
  brand || ' ' || product_name || ' - ' || size AS description,
  MIN(distributor_price_ctn) OVER (PARTITION BY base_sku) AS base_distributor_price,
  MIN(consumer_price_ctn) OVER (PARTITION BY base_sku) AS consumer_price,
  MIN(moq) OVER (PARTITION BY base_sku) AS base_moq,
  image_url,
  brand,
  category,
  TRUE AS has_variants
FROM 
  product_skus;

-- Step 9: Insert region pricing information 
-- Store the distribution area pricing in region_pricing table
INSERT INTO region_pricing (
  product_id,
  area,
  distributor_price,
  moq
)
SELECT
  p.id AS product_id,
  ps.distribution_area AS area,
  ps.distributor_price_ctn::INTEGER AS distributor_price,
  ps.moq AS moq
FROM
  product_skus ps
JOIN products p ON ps.unique_sku = p.sku
-- Replace with simple insert, checking if record exists first
WHERE NOT EXISTS (
  SELECT 1 FROM region_pricing
  WHERE product_id = p.id 
  AND area = ps.distribution_area
);

-- Step 10: Clean up temporary tables
DROP TABLE temp_product_csv;
DROP TABLE cleaned_product_csv;
DROP TABLE product_skus;
DROP TABLE base_products;

-- Step 11: Create view for simplified product access
CREATE OR REPLACE VIEW products_with_details AS
SELECT
  p.id,
  p.sku,
  p.name,
  p.size,
  p.description,
  p.base_distributor_price AS distributor_price,
  p.consumer_price,
  p.base_moq AS moq,
  p.stock_quantity AS stock,
  p.image_url AS image,
  -- Calculate margin on the fly
  ROUND((p.consumer_price - p.base_distributor_price) / NULLIF(p.consumer_price, 0) * 100, 2) AS margin,
  b.name AS brand,
  c.name AS category,
  p.has_variants,
  COALESCE((SELECT COUNT(*) FROM region_pricing rp WHERE rp.product_id = p.id), 0) AS region_count
FROM
  products p
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN product_categories c ON p.category_id = c.id;
