-- SQL script to insert variant options for products

-- First, make sure all products we want to add variants to exist
-- Check for product ID 'SKU-CHIPS-10'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM products WHERE sku = 'SKU-CHIPS-10') THEN
        RAISE NOTICE 'Product SKU-CHIPS-10 does not exist, creating it...';
        INSERT INTO products (sku, name, description, size, base_distributor_price, consumer_price, base_moq, brand_id, category_id)
        VALUES (
            'SKU-CHIPS-10',
            'Keripik Kentang Original',
            'Keripik kentang renyah rasa original dengan kualitas premium.',
            '50gr',
            4500,
            8000,
            100,
            (SELECT id FROM brands WHERE name = 'Baskit' LIMIT 1),
            (SELECT id FROM product_categories WHERE name = 'Makanan Ringan' LIMIT 1)
        );
    END IF;
END $$;

-- Check if has_variants column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'has_variants'
    ) THEN
        ALTER TABLE products
        ADD COLUMN has_variants BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Update the product to have the has_variants flag
UPDATE products SET has_variants = TRUE WHERE sku = 'SKU-CHIPS-10';

-- Check if variant tables exist, create them if they don't
DO $$
BEGIN
    -- Check for variant_options table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'variant_options') THEN
        CREATE TABLE variant_options (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(100) NOT NULL,
            description TEXT,
            type VARCHAR(50) NOT NULL DEFAULT 'select',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- Check for variant_option_values table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'variant_option_values') THEN
        CREATE TABLE variant_option_values (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            option_id UUID NOT NULL REFERENCES variant_options(id) ON DELETE CASCADE,
            value TEXT NOT NULL,
            display_order INT DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- Check for product_variants table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_variants') THEN
        CREATE TABLE product_variants (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            variant_name VARCHAR(255) NOT NULL,
            variant_description TEXT,
            additional_price DECIMAL(12, 2) DEFAULT 0.00,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(product_id, variant_name)
        );
    END IF;

    -- Check for product_variant_options table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_variant_options') THEN
        CREATE TABLE product_variant_options (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
            option_id UUID NOT NULL REFERENCES variant_options(id) ON DELETE CASCADE,
            option_value_id UUID NOT NULL REFERENCES variant_option_values(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(variant_id, option_id, option_value_id)
        );
    END IF;

    -- Check if extension uuid-ossp is available and enabled
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    END IF;
    
    -- Create products_with_variants view if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public' AND table_name = 'products_with_variants'
    ) THEN
        EXECUTE '
        CREATE OR REPLACE VIEW products_with_variants AS
        SELECT 
            p.id,
            pc.name AS category,
            b.name AS brand,
            p.name,
            p.size,
            p.base_distributor_price AS distributor_price,
            p.consumer_price,
            p.base_moq AS moq,
            p.description,
            p.image_url AS image,
            COALESCE(
                (SELECT COUNT(*) FROM product_variants WHERE product_id = p.id AND is_active = TRUE),
                0
            ) AS variant_count
        FROM 
            products p
        LEFT JOIN 
            brands b ON p.brand_id = b.id
        LEFT JOIN 
            product_categories pc ON p.category_id = pc.id;
        ';
    END IF;
END $$;

-- Create region_pricing view if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public' AND table_name = 'region_pricing'
    ) THEN
        EXECUTE '
        CREATE OR REPLACE VIEW region_pricing AS
        SELECT 
            id,
            product_id,
            area,
            distributor_price,
            moq,
            created_at
        FROM 
            product_region_pricing;
        ';
    END IF;
    
    -- Make sure product_region_pricing table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_region_pricing') THEN
        CREATE TABLE product_region_pricing (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            area VARCHAR(100) NOT NULL,
            distributor_price DECIMAL(12, 2) NOT NULL,
            moq INTEGER NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(product_id, area)
        );
        
        -- Insert default region pricing for our sample product
        INSERT INTO product_region_pricing (product_id, area, distributor_price, moq)
        SELECT 
            id AS product_id,
            'Jabodetabek' AS area,
            base_distributor_price AS distributor_price,
            base_moq AS moq
        FROM 
            products 
        WHERE 
            sku = 'SKU-CHIPS-10';
    END IF;
END $$;

-- Insert variant options if they don't exist
DO $$
DECLARE
    size_option_id UUID;
    packaging_option_id UUID;
    current_product_id UUID; -- Renamed to avoid ambiguity with table column
    
    size_small_id UUID;
    size_medium_id UUID;
    size_large_id UUID;
    
    pkg_standard_id UUID;
    pkg_gift_id UUID;
    pkg_eco_id UUID;
    
    var1_id UUID;
    var2_id UUID;
    var3_id UUID;
    var4_id UUID;
    var5_id UUID;
    var6_id UUID;
BEGIN
    -- Get product ID
    SELECT id INTO current_product_id FROM products WHERE sku = 'SKU-CHIPS-10';
    
    -- Check if Size option exists, if not create it
    IF NOT EXISTS (SELECT 1 FROM variant_options WHERE name = 'Size') THEN
        INSERT INTO variant_options (name, description, type)
        VALUES ('Size', 'Product size options', 'size')
        RETURNING id INTO size_option_id;
    ELSE
        SELECT id INTO size_option_id FROM variant_options WHERE name = 'Size';
    END IF;
    
    -- Check if Packaging option exists, if not create it
    IF NOT EXISTS (SELECT 1 FROM variant_options WHERE name = 'Packaging') THEN
        INSERT INTO variant_options (name, description, type)
        VALUES ('Packaging', 'Packaging options', 'select')
        RETURNING id INTO packaging_option_id;
    ELSE
        SELECT id INTO packaging_option_id FROM variant_options WHERE name = 'Packaging';
    END IF;
    
    -- Insert size option values if they don't exist
    IF NOT EXISTS (SELECT 1 FROM variant_option_values WHERE option_id = size_option_id AND value = 'Small') THEN
        INSERT INTO variant_option_values (option_id, value, display_order)
        VALUES (size_option_id, 'Small', 1)
        RETURNING id INTO size_small_id;
    ELSE
        SELECT id INTO size_small_id FROM variant_option_values WHERE option_id = size_option_id AND value = 'Small';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM variant_option_values WHERE option_id = size_option_id AND value = 'Medium') THEN
        INSERT INTO variant_option_values (option_id, value, display_order)
        VALUES (size_option_id, 'Medium', 2)
        RETURNING id INTO size_medium_id;
    ELSE
        SELECT id INTO size_medium_id FROM variant_option_values WHERE option_id = size_option_id AND value = 'Medium';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM variant_option_values WHERE option_id = size_option_id AND value = 'Large') THEN
        INSERT INTO variant_option_values (option_id, value, display_order)
        VALUES (size_option_id, 'Large', 3)
        RETURNING id INTO size_large_id;
    ELSE
        SELECT id INTO size_large_id FROM variant_option_values WHERE option_id = size_option_id AND value = 'Large';
    END IF;
    
    -- Insert packaging option values if they don't exist
    IF NOT EXISTS (SELECT 1 FROM variant_option_values WHERE option_id = packaging_option_id AND value = 'Standard Box') THEN
        INSERT INTO variant_option_values (option_id, value, display_order)
        VALUES (packaging_option_id, 'Standard Box', 1)
        RETURNING id INTO pkg_standard_id;
    ELSE
        SELECT id INTO pkg_standard_id FROM variant_option_values 
        WHERE option_id = packaging_option_id AND value = 'Standard Box';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM variant_option_values WHERE option_id = packaging_option_id AND value = 'Gift Box') THEN
        INSERT INTO variant_option_values (option_id, value, display_order)
        VALUES (packaging_option_id, 'Gift Box', 2)
        RETURNING id INTO pkg_gift_id;
    ELSE
        SELECT id INTO pkg_gift_id FROM variant_option_values 
        WHERE option_id = packaging_option_id AND value = 'Gift Box';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM variant_option_values WHERE option_id = packaging_option_id AND value = 'Eco-friendly') THEN
        INSERT INTO variant_option_values (option_id, value, display_order)
        VALUES (packaging_option_id, 'Eco-friendly', 3)
        RETURNING id INTO pkg_eco_id;
    ELSE
        SELECT id INTO pkg_eco_id FROM variant_option_values 
        WHERE option_id = packaging_option_id AND value = 'Eco-friendly';
    END IF;
    
    -- Create product variants
    -- Small - Standard Box
    IF NOT EXISTS (SELECT 1 FROM product_variants WHERE product_id = current_product_id AND variant_name = 'Small - Standard Box') THEN
        INSERT INTO product_variants (product_id, variant_name, additional_price, is_active)
        VALUES (current_product_id, 'Small - Standard Box', 0, TRUE)
        RETURNING id INTO var1_id;
        
        -- Link variant to options
        INSERT INTO product_variant_options (variant_id, option_id, option_value_id)
        VALUES (var1_id, size_option_id, size_small_id);
        
        INSERT INTO product_variant_options (variant_id, option_id, option_value_id)
        VALUES (var1_id, packaging_option_id, pkg_standard_id);
    END IF;
    
    -- Medium - Standard Box
    IF NOT EXISTS (SELECT 1 FROM product_variants WHERE product_id = current_product_id AND variant_name = 'Medium - Standard Box') THEN
        INSERT INTO product_variants (product_id, variant_name, additional_price, is_active)
        VALUES (current_product_id, 'Medium - Standard Box', 1000, TRUE)
        RETURNING id INTO var2_id;
        
        -- Link variant to options
        INSERT INTO product_variant_options (variant_id, option_id, option_value_id)
        VALUES (var2_id, size_option_id, size_medium_id);
        
        INSERT INTO product_variant_options (variant_id, option_id, option_value_id)
        VALUES (var2_id, packaging_option_id, pkg_standard_id);
    END IF;
    
    -- Large - Standard Box
    IF NOT EXISTS (SELECT 1 FROM product_variants WHERE product_id = current_product_id AND variant_name = 'Large - Standard Box') THEN
        INSERT INTO product_variants (product_id, variant_name, additional_price, is_active)
        VALUES (current_product_id, 'Large - Standard Box', 2000, TRUE)
        RETURNING id INTO var3_id;
        
        -- Link variant to options
        INSERT INTO product_variant_options (variant_id, option_id, option_value_id)
        VALUES (var3_id, size_option_id, size_large_id);
        
        INSERT INTO product_variant_options (variant_id, option_id, option_value_id)
        VALUES (var3_id, packaging_option_id, pkg_standard_id);
    END IF;
    
    -- Small - Gift Box
    IF NOT EXISTS (SELECT 1 FROM product_variants WHERE product_id = current_product_id AND variant_name = 'Small - Gift Box') THEN
        INSERT INTO product_variants (product_id, variant_name, additional_price, is_active)
        VALUES (current_product_id, 'Small - Gift Box', 1500, TRUE)
        RETURNING id INTO var4_id;
        
        -- Link variant to options
        INSERT INTO product_variant_options (variant_id, option_id, option_value_id)
        VALUES (var4_id, size_option_id, size_small_id);
        
        INSERT INTO product_variant_options (variant_id, option_id, option_value_id)
        VALUES (var4_id, packaging_option_id, pkg_gift_id);
    END IF;
    
    -- Medium - Gift Box
    IF NOT EXISTS (SELECT 1 FROM product_variants WHERE product_id = current_product_id AND variant_name = 'Medium - Gift Box') THEN
        INSERT INTO product_variants (product_id, variant_name, additional_price, is_active)
        VALUES (current_product_id, 'Medium - Gift Box', 2500, TRUE)
        RETURNING id INTO var5_id;
        
        -- Link variant to options
        INSERT INTO product_variant_options (variant_id, option_id, option_value_id)
        VALUES (var5_id, size_option_id, size_medium_id);
        
        INSERT INTO product_variant_options (variant_id, option_id, option_value_id)
        VALUES (var5_id, packaging_option_id, pkg_gift_id);
    END IF;
    
    -- Eco-friendly Package
    IF NOT EXISTS (SELECT 1 FROM product_variants WHERE product_id = current_product_id AND variant_name = 'Eco-friendly Package') THEN
        INSERT INTO product_variants (product_id, variant_name, variant_description, additional_price, is_active)
        VALUES (
            current_product_id, 
            'Eco-friendly Package', 
            'Environmentally friendly packaging using biodegradable materials', 
            1200, 
            TRUE
        )
        RETURNING id INTO var6_id;
        
        -- Link variant to options (just packaging for this one)
        INSERT INTO product_variant_options (variant_id, option_id, option_value_id)
        VALUES (var6_id, packaging_option_id, pkg_eco_id);
    END IF;
    
END $$;
