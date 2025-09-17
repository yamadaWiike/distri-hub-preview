-- Updated SQL Script to inject products as individual SKUs
-- This script ensures each variant and region combination is inserted as a unique product

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

INSERT INTO temp_product_csv (sku_id, category, brand, product_name, size, full_name, variant, distribution_area, distributor_price_ctn, distributor_price_pcs, consumer_price_ctn, consumer_price_pcs, pcs_per_ctn, moq, product_picture) VALUES
-- BEGIN FULL SKU LIST
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
('FMCG003', 'Snack', 'Let''z', 'Gula Kapas', '10 gr', 'Let''z Gula Kapas - 10 gr', 'Jeruk', 'Jawa Timur', '57,600', '1,440', '80,000', '2,000', '40', '1,300', 'https://drive.google.com/file/d/1-oMDVEdUhBvURMlbImAGGjZBxR_8vdVL/view?usp=drive_link');
-- END FULL SKU LIST
-- (The actual patch will include all rows from your CSV, properly formatted for SQL)

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
WHERE NOT EXISTS (SELECT 1 FROM product_categories WHERE name = category);

-- Step 5: Insert unique brands
INSERT INTO brands (name)
SELECT DISTINCT brand 
FROM cleaned_product_csv
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE name = brand);

-- Step 6: Create a temp table with unique SKUs for each variant and region
CREATE TEMP TABLE unique_product_skus AS
SELECT
  CASE
    WHEN variant = '' THEN sku_id
    ELSE sku_id || '-' || LOWER(REPLACE(variant, ' ', '-')) || '-' || LOWER(REPLACE(distribution_area, ' ', '-'))
  END AS unique_sku,
  sku_id AS base_sku,
  product_name,
  size,
  variant,
  distribution_area,
  category,
  brand,
  distributor_price_ctn,
  consumer_price_ctn,
  moq,
  image_url,
  pcs_per_ctn
FROM cleaned_product_csv;

-- Step 7: Insert each variant+region as a unique product
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
  ups.unique_sku,
  CASE 
    WHEN ups.variant = '' THEN ups.product_name
    ELSE ups.product_name || ' - ' || ups.variant
  END AS name,
  ups.size,
  CASE
    WHEN ups.variant = '' THEN ups.brand || ' ' || ups.product_name || ' - ' || ups.size
    ELSE ups.brand || ' ' || ups.product_name || ' - ' || ups.variant || ' - ' || ups.size
  END AS description,
  ups.distributor_price_ctn,
  ups.consumer_price_ctn,
  ups.moq,
  ups.image_url,
  b.id AS brand_id,
  c.id AS category_id,
  FALSE AS has_variants, -- Each variant is now its own product
  1000 -- Default stock
FROM
  unique_product_skus ups
JOIN brands b ON ups.brand = b.name
JOIN product_categories c ON ups.category = c.name;

-- Step 8: Insert regional pricing
WITH region_pricing_to_insert AS (
  SELECT DISTINCT
    p.id AS product_id,
    ups.distribution_area AS area,
    ups.distributor_price_ctn AS distributor_price,
    ups.moq AS moq
  FROM
    unique_product_skus ups
  JOIN products p ON ups.unique_sku = p.sku
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
WHERE NOT EXISTS (
  SELECT 1 FROM region_pricing
  WHERE product_id = region_pricing_to_insert.product_id 
  AND area = region_pricing_to_insert.area
);

-- Step 9: Clean up temporary tables
DROP TABLE temp_product_csv;
DROP TABLE cleaned_product_csv;
DROP TABLE unique_product_skus;

-- Step 10: Create view for simplified product access with calculated margin
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
  -- Use only one: base_sku (remove variant_count entirely)
  SPLIT_PART(p.sku, '-', 1) AS base_sku,
  CASE 
    WHEN POSITION('-' IN p.sku) > 0 THEN 
      SPLIT_PART(p.sku, '-', 2)
    ELSE 
      ''
  END AS variant,
  rp.area AS region
FROM
  products p
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN product_categories c ON p.category_id = c.id
LEFT JOIN region_pricing rp ON p.id = rp.product_id;
