-- SQL Script to inject products, variants, and pricing data from CSV
-- This script assumes you've already created the necessary tables

-- First, create a temporary table to hold the CSV data
CREATE TEMP TABLE temp_product_csv (
  sku_id TEXT,
  category TEXT,
  brand TEXT,
  product_name TEXT,
  size TEXT,
  full_name TEXT,
  variant TEXT,
  distribution_area TEXT,
  distributor_price_ctn NUMERIC,
  distributor_price_pcs NUMERIC,
  consumer_price_ctn NUMERIC,
  consumer_price_pcs NUMERIC,
  pcs_per_ctn INTEGER,
  moq INTEGER,
  product_picture TEXT
);

-- Import CSV data (you would need to adjust the path)
-- This is a placeholder - you'd need to use your database's specific COPY or LOAD command
-- For PostgreSQL, you would use something like:
-- COPY temp_product_csv FROM '/path/to/products-list.csv' WITH CSV HEADER;

-- Insert brands if they don't exist
INSERT INTO brands (name)
SELECT DISTINCT brand FROM temp_product_csv
ON CONFLICT (name) DO NOTHING;

-- Insert categories if they don't exist
INSERT INTO product_categories (name)
SELECT DISTINCT category FROM temp_product_csv
ON CONFLICT (name) DO NOTHING;

-- Insert base products (de-duplicating by SKU + product name + size)
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
    REGEXP_REPLACE(MIN(product_picture), 'view\\?usp=drive_link$', 'preview') AS image_url,
    COUNT(DISTINCT variant) > 1 AS has_variants
  FROM temp_product_csv
  WHERE variant != ''
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
  b.id,
  c.id,
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
  has_variants = EXCLUDED.has_variants;

-- Insert product variants
WITH variants_to_insert AS (
  SELECT DISTINCT
    p.id AS product_id,
    csv.variant AS variant_name,
    0 AS additional_price, -- No additional price in this dataset
    true AS is_active,
    p.sku || '-' || LOWER(REGEXP_REPLACE(csv.variant, '\\s+', '-')) AS variant_sku
  FROM
    temp_product_csv csv
  JOIN products p ON csv.sku_id = p.sku
  WHERE
    csv.variant != ''
)
INSERT INTO product_variants (
  product_id,
  variant_name,
  additional_price,
  is_active,
  sku
)
SELECT
  product_id,
  variant_name,
  additional_price,
  is_active,
  variant_sku
FROM variants_to_insert
ON CONFLICT (sku) DO UPDATE SET
  variant_name = EXCLUDED.variant_name,
  additional_price = EXCLUDED.additional_price,
  is_active = EXCLUDED.is_active;

-- Insert region pricing
WITH region_pricing_to_insert AS (
  SELECT DISTINCT
    p.id AS product_id,
    csv.distribution_area AS area,
    csv.distributor_price_ctn AS distributor_price,
    csv.moq AS moq
  FROM
    temp_product_csv csv
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
ON CONFLICT (product_id, area) DO UPDATE SET
  distributor_price = EXCLUDED.distributor_price,
  moq = EXCLUDED.moq;

-- Clean up
DROP TABLE temp_product_csv;
