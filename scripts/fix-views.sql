-- SQL script to fix views
-- Run this directly in your SQL editor or via Supabase SQL editor

-- Create products_with_variants view if it doesn't exist
DROP VIEW IF EXISTS products_with_variants;
CREATE VIEW products_with_variants AS
SELECT
    p.id,
    p.sku,
    pc.name as category,
    b.name as brand,
    p.name,
    p.size,
    p.base_distributor_price as distributor_price,
    p.consumer_price,
    p.base_moq as moq,
    p.description,
    p.image_url as image,
    p.has_variants,
    COALESCE(
        (SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = p.id AND pv.is_active = TRUE),
        0
    ) as variant_count
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN product_categories pc ON p.category_id = pc.id;

-- Create variants_view if it doesn't exist
DROP VIEW IF EXISTS variants_view;
CREATE VIEW variants_view AS
SELECT
    pv.id,
    pv.product_id,
    p.name as product_name,
    vo.name as group_name,
    vov.value as option_name,
    pv.additional_price,
    pv.is_active
FROM 
    product_variants pv
JOIN 
    products p ON pv.product_id = p.id
JOIN 
    product_variant_options pvo ON pvo.variant_id = pv.id
JOIN 
    variant_options vo ON pvo.option_id = vo.id
JOIN 
    variant_option_values vov ON pvo.option_value_id = vov.id;

-- Verify the views were created
SELECT table_name, table_schema 
FROM information_schema.views
WHERE table_name IN ('products_with_variants', 'variants_view')
  AND table_schema = 'public';
