-- Migration to create the variants_view

-- Create variants_view to provide a unified view of product variants and their options
CREATE OR REPLACE VIEW variants_view AS
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
