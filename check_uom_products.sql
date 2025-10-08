-- Check products with UOM settings (non-default values)
SELECT 
    p.name as product_name,
    p.sku,
    p.base_uom,
    p.moq_uom,
    p.pricing_uom,
    p.enable_uom_conversions,
    p.has_variants,
    CASE 
        WHEN p.has_variants THEN 'Parent Product with Variants'
        ELSE 'Regular Product'
    END as product_type
FROM public.products p
WHERE 
    p.moq_uom != 'pcs' 
    OR p.pricing_uom != 'pcs' 
    OR p.base_uom != 'pcs'
    OR p.enable_uom_conversions = true
ORDER BY p.name;

-- Check regional pricing with UOM settings
SELECT 
    p.name as product_name,
    p.sku,
    rp.area,
    rp.moq,
    rp.moq_uom,
    rp.distributor_price,
    rp.price_uom
FROM public.products p
JOIN public.region_pricing rp ON p.id = rp.product_id
WHERE 
    rp.moq_uom != 'pcs' 
    OR rp.price_uom != 'pcs'
ORDER BY p.name, rp.area;

-- Check product variants for products with UOM settings
SELECT 
    p.name as parent_product_name,
    p.sku as parent_sku,
    p.moq_uom as parent_moq_uom,
    p.pricing_uom as parent_pricing_uom,
    pv.variant_name,
    pv.additional_price,
    pv.is_active
FROM public.products p
JOIN public.product_variants pv ON p.id = pv.product_id
WHERE 
    (p.moq_uom != 'pcs' OR p.pricing_uom != 'pcs' OR p.base_uom != 'pcs')
    AND pv.is_active = true
ORDER BY p.name, pv.variant_name;

-- Check UOM conversions
SELECT 
    p.name as product_name,
    p.sku,
    uc.from_uom,
    uc.to_uom,
    uc.conversion_factor,
    uc.is_active
FROM public.products p
JOIN public.uom_conversions uc ON p.id = uc.product_id
WHERE uc.is_active = true
ORDER BY p.name;

-- Summary: Count of products with UOM configured
SELECT 
    'Products with non-default UOM' as description,
    COUNT(*) as count
FROM public.products p
WHERE 
    p.moq_uom != 'pcs' 
    OR p.pricing_uom != 'pcs' 
    OR p.base_uom != 'pcs'
    OR p.enable_uom_conversions = true;