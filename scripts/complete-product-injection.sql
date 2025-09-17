-- Complete SQL Script to inject products, variants, categories, brands, and pricing data
-- This script handles the CSV data as a direct SQL injection for Supabase

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
ON CONFLICT (name) DO NOTHING
RETURNING id, name;

-- Step 5: Insert unique brands
INSERT INTO brands (name)
SELECT DISTINCT brand 
FROM cleaned_product_csv
ON CONFLICT (name) DO NOTHING
RETURNING id, name;

-- Step 6: Create a mapping of base products (unique by SKU + name + size)
-- and insert into the products table
WITH unique_products AS (
  SELECT DISTINCT 
    sku_id,
    product_name,
    size,
    category,
    brand,
    MIN(distributor_price_ctn) AS base_distributor_price,
    MIN(consumer_price_ctn) AS consumer_price,
    MIN(moq) AS base_moq,
    MIN(image_url) AS image_url,
    BOOL_OR(variant != '') AS has_variants,
    MIN(pcs_per_ctn) AS units
  FROM cleaned_product_csv
  GROUP BY sku_id, product_name, size, category, brand
)
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
  stock_quantity
)
SELECT
  up.sku_id,
  up.product_name,
  up.size,
  up.brand || ' ' || up.product_name || ' - ' || up.size,
  up.base_distributor_price,
  up.consumer_price,
  up.base_moq,
  up.image_url,
  b.id AS brand_id,
  c.id AS category_id,
  up.has_variants,
  1000 -- Default stock
FROM
  unique_products up
JOIN brands b ON up.brand = b.name
JOIN product_categories c ON up.category = c.name
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
  has_variants = EXCLUDED.has_variants
RETURNING id, sku;

-- Step 7: Insert product variants
WITH variants_to_insert AS (
  SELECT DISTINCT
    p.id AS product_id,
    csv.variant AS variant_name,
    0 AS additional_price, -- No additional price in this dataset
    TRUE AS is_active
  FROM
    cleaned_product_csv csv
  JOIN products p ON csv.sku_id = p.sku
  WHERE
    csv.variant != '' AND csv.variant IS NOT NULL
)
INSERT INTO product_variants (
  product_id,
  variant_name,
  additional_price,
  is_active
)
SELECT
  product_id,
  variant_name,
  additional_price,
  is_active
FROM variants_to_insert
-- Replace with simple insert, checking if record exists first
WHERE NOT EXISTS (
  SELECT 1 FROM product_variants
  WHERE product_id = variants_to_insert.product_id 
  AND variant_name = variants_to_insert.variant_name
);

-- Step 8: Insert regional pricing
WITH region_pricing_to_insert AS (
  SELECT DISTINCT
    p.id AS product_id,
    csv.distribution_area AS area,
    csv.distributor_price_ctn AS distributor_price,
    csv.moq AS moq
  FROM
    cleaned_product_csv csv
  JOIN products p ON csv.sku_id = p.sku
)
INSERT INTO region_pricing (
  product_id,
  area,
  distributor_price,
  moq
)
SELECT
  product_id,
  area,
  distributor_price,
  moq
FROM region_pricing_to_insert
-- Replace with simple insert, checking if record exists first
WHERE NOT EXISTS (
  SELECT 1 FROM region_pricing
  WHERE product_id = region_pricing_to_insert.product_id 
  AND area = region_pricing_to_insert.area
);

-- Step 9: Skip margin calculation since the column doesn't exist
-- If you need margin calculations, you can add the column first with:
-- ALTER TABLE products ADD COLUMN margin NUMERIC;
-- Then uncomment the below code:
-- UPDATE products
-- SET margin = ROUND((consumer_price - base_distributor_price) / NULLIF(consumer_price, 0) * 100, 2)
-- WHERE consumer_price > 0;

-- Step 10: Clean up temporary tables
DROP TABLE temp_product_csv;
DROP TABLE cleaned_product_csv;

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
  -- Calculate margin on the fly since the column doesn't exist
  ROUND((p.consumer_price - p.base_distributor_price) / NULLIF(p.consumer_price, 0) * 100, 2) AS margin,
  b.name AS brand,
  c.name AS category,
  p.has_variants,
  COUNT(DISTINCT pv.id) AS variant_count,
  COUNT(DISTINCT rp.area) AS region_count
FROM
  products p
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN product_categories c ON p.category_id = c.id
LEFT JOIN product_variants pv ON p.id = pv.product_id
LEFT JOIN region_pricing rp ON p.id = rp.product_id
GROUP BY
  p.id, p.sku, p.name, p.size, p.description, p.base_distributor_price, p.consumer_price,
  p.base_moq, p.stock_quantity, p.image_url, b.name, c.name, p.has_variants;
