-- Migration: Add variant options to database
-- Description: Creates view for variant options

-- Create view to easily query product variant options
CREATE OR REPLACE VIEW product_variant_options_view AS
SELECT 
    pv.product_id,
    pv.id as variant_id,
    pv.variant_name,
    pv.variant_description,
    pv.additional_price,
    string_agg(DISTINCT vo.name, ', ') as option_names,
    json_agg(
        json_build_object(
            'name', vo.name,
            'value', vov.value
        )
    ) as options
FROM 
    product_variants pv
JOIN 
    product_variant_options pvo ON pv.id = pvo.variant_id
JOIN 
    variant_options vo ON pvo.option_id = vo.id
JOIN 
    variant_option_values vov ON pvo.option_value_id = vov.id
WHERE 
    pv.is_active = TRUE
GROUP BY 
    pv.product_id, pv.id, pv.variant_name, pv.variant_description, pv.additional_price;

-- Function to get variant options as formatted JSON
CREATE OR REPLACE FUNCTION get_variant_options_json(product_id_param UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT 
        jsonb_agg(
            jsonb_build_object(
                'option_name', option_name,
                'option_values', option_values
            )
        ) INTO result
    FROM (
        SELECT 
            vo.name AS option_name,
            jsonb_agg(DISTINCT vov.value ORDER BY vov.value) AS option_values
        FROM 
            product_variants pv
        JOIN 
            product_variant_options pvo ON pv.id = pvo.variant_id
        JOIN 
            variant_options vo ON pvo.option_id = vo.id
        JOIN 
            variant_option_values vov ON pvo.option_value_id = vov.id
        WHERE 
            pv.product_id = product_id_param
            AND pv.is_active = TRUE
        GROUP BY 
            vo.name
        ORDER BY 
            vo.name
    ) options;
    
    RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;
