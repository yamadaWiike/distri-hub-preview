-- Migration to create product variants tables and related functions

-- Create product_variant_groups table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_variant_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_variant_options table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_variant_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES product_variant_groups(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, name)
);

-- Create product_variants table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES product_variant_options(id) ON DELETE CASCADE,
    additional_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, option_id)
);

-- Update products table to include has_variants column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'has_variants'
    ) THEN
        ALTER TABLE products ADD COLUMN has_variants BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;

-- Create variants_view to easily access product variants with their details
CREATE OR REPLACE VIEW variants_view AS
SELECT
    pv.id,
    pv.product_id,
    p.name as product_name,
    pvg.id as group_id,
    pvg.name as group_name,
    pvo.id as option_id,
    pvo.name as option_name,
    pv.additional_price,
    pv.is_active
FROM 
    product_variants pv
JOIN 
    products p ON pv.product_id = p.id
JOIN 
    product_variant_options pvo ON pv.option_id = pvo.id
JOIN 
    product_variant_groups pvg ON pvo.group_id = pvg.id;

-- Ensure RLS policies are in place for the new tables
ALTER TABLE product_variant_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variant_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Create policies for variant tables
DO $$
BEGIN
    -- Policies for product_variant_groups
    DROP POLICY IF EXISTS "Anyone can read product_variant_groups" ON product_variant_groups;
    DROP POLICY IF EXISTS "Authenticated users can manage product_variant_groups" ON product_variant_groups;
    
    CREATE POLICY "Anyone can read product_variant_groups" 
        ON product_variant_groups FOR SELECT 
        USING (true);
        
    CREATE POLICY "Authenticated users can manage product_variant_groups" 
        ON product_variant_groups FOR ALL 
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');
        
    -- Policies for product_variant_options
    DROP POLICY IF EXISTS "Anyone can read product_variant_options" ON product_variant_options;
    DROP POLICY IF EXISTS "Authenticated users can manage product_variant_options" ON product_variant_options;
    
    CREATE POLICY "Anyone can read product_variant_options" 
        ON product_variant_options FOR SELECT 
        USING (true);
        
    CREATE POLICY "Authenticated users can manage product_variant_options" 
        ON product_variant_options FOR ALL 
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');
        
    -- Policies for product_variants
    DROP POLICY IF EXISTS "Anyone can read product_variants" ON product_variants;
    DROP POLICY IF EXISTS "Authenticated users can manage product_variants" ON product_variants;
    
    CREATE POLICY "Anyone can read product_variants" 
        ON product_variants FOR SELECT 
        USING (true);
        
    CREATE POLICY "Authenticated users can manage product_variants" 
        ON product_variants FOR ALL 
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');
END $$;

-- Insert sample variant groups and options
INSERT INTO product_variant_groups (name)
VALUES ('Flavor'), ('Size'), ('Color')
ON CONFLICT DO NOTHING;

-- Insert sample options for the groups
INSERT INTO product_variant_options (group_id, name)
SELECT 
    g.id, 
    opt
FROM 
    product_variant_groups g,
    UNNEST(
        CASE 
            WHEN g.name = 'Flavor' THEN ARRAY['Original', 'Spicy', 'BBQ', 'Cheese', 'Sour Cream']
            WHEN g.name = 'Size' THEN ARRAY['Small', 'Medium', 'Large', 'Family']
            WHEN g.name = 'Color' THEN ARRAY['Red', 'Blue', 'Green', 'Black', 'White']
            ELSE ARRAY[]::VARCHAR[]
        END
    ) AS opt
WHERE 
    NOT EXISTS (
        SELECT 1 
        FROM product_variant_options 
        WHERE group_id = g.id AND name = opt
    );

-- Function to add variants to a product
CREATE OR REPLACE FUNCTION add_product_variants(
    p_product_id UUID,
    p_group_name VARCHAR,
    p_option_names VARCHAR[],
    p_additional_prices DECIMAL[] DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_group_id UUID;
    v_option_id UUID;
    i INT;
BEGIN
    -- Find the variant group ID
    SELECT id INTO v_group_id FROM product_variant_groups WHERE name = p_group_name;
    
    IF v_group_id IS NULL THEN
        RAISE EXCEPTION 'Variant group "%" not found', p_group_name;
    END IF;
    
    -- Update product to indicate it has variants
    UPDATE products SET has_variants = TRUE WHERE id = p_product_id;
    
    -- Add each variant option
    FOR i IN 1..array_length(p_option_names, 1) LOOP
        -- Find the option ID
        SELECT id INTO v_option_id 
        FROM product_variant_options 
        WHERE group_id = v_group_id AND name = p_option_names[i];
        
        IF v_option_id IS NULL THEN
            RAISE EXCEPTION 'Variant option "%" not found in group "%"', p_option_names[i], p_group_name;
        END IF;
        
        -- Add the variant with additional price if provided
        INSERT INTO product_variants (product_id, option_id, additional_price)
        VALUES (
            p_product_id, 
            v_option_id, 
            COALESCE(
                CASE WHEN p_additional_prices IS NOT NULL AND i <= array_length(p_additional_prices, 1) 
                THEN p_additional_prices[i] 
                ELSE NULL END, 
                0
            )
        )
        ON CONFLICT (product_id, option_id) 
        DO UPDATE SET 
            additional_price = EXCLUDED.additional_price,
            is_active = TRUE;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add sample variants to a product
DO $$
DECLARE
    v_product_id UUID;
BEGIN
    -- Get a sample product ID (chips product)
    SELECT id INTO v_product_id FROM products WHERE sku = 'SKU-CHIPS-10';
    
    IF v_product_id IS NOT NULL THEN
        -- Add flavor variants with additional prices
        PERFORM add_product_variants(
            v_product_id, 
            'Flavor',
            ARRAY['Original', 'Spicy', 'BBQ', 'Cheese'],
            ARRAY[0, 1000, 1500, 2000]::DECIMAL[]
        );
    END IF;
END $$;
