-- Migration to create the products_with_variants view

-- Create products_with_variants view to display products with their variant counts
CREATE OR REPLACE VIEW products_with_variants AS
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
