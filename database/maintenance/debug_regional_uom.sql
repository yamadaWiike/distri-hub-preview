-- Check what UOM data exists in regional pricing for Gula Kapas
SELECT 
    p.name as product_name,
    p.sku,
    p.moq_uom as product_moq_uom,
    p.pricing_uom as product_pricing_uom,
    rp.area,
    rp.moq_uom as regional_moq_uom,
    rp.price_uom as regional_price_uom,
    CASE 
        WHEN rp.moq_uom IS NULL THEN 'NULL (should inherit)'
        ELSE rp.moq_uom
    END as regional_moq_status,
    CASE 
        WHEN rp.price_uom IS NULL THEN 'NULL (should inherit)'
        ELSE rp.price_uom
    END as regional_price_status
FROM public.products p
JOIN public.region_pricing rp ON p.id = rp.product_id
WHERE p.name = 'Gula Kapas'
ORDER BY rp.area;
