-- Migration to create product_region_pricing table and region_pricing view

-- Create product_region_pricing table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_region_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    area VARCHAR(100) NOT NULL,
    distributor_price DECIMAL(12, 2) NOT NULL,
    moq INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, area)
);

-- Create region_pricing view
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

-- Ensure RLS policies are in place for the new table
ALTER TABLE product_region_pricing ENABLE ROW LEVEL SECURITY;

-- Create policies for product_region_pricing
DO $$
BEGIN
    -- Drop policies if they exist
    DROP POLICY IF EXISTS "Anyone can read product_region_pricing" ON product_region_pricing;
    DROP POLICY IF EXISTS "Authenticated users can insert product_region_pricing" ON product_region_pricing;
    DROP POLICY IF EXISTS "Users can update their own product_region_pricing" ON product_region_pricing;
    DROP POLICY IF EXISTS "Users can delete their own product_region_pricing" ON product_region_pricing;
    
    -- Create policies
    CREATE POLICY "Anyone can read product_region_pricing" 
        ON product_region_pricing FOR SELECT 
        USING (true);
        
    CREATE POLICY "Authenticated users can insert product_region_pricing" 
        ON product_region_pricing FOR INSERT 
        WITH CHECK (auth.role() = 'authenticated');
        
    CREATE POLICY "Users can update their own product_region_pricing" 
        ON product_region_pricing FOR UPDATE 
        USING (auth.role() = 'authenticated');
        
    CREATE POLICY "Users can delete their own product_region_pricing" 
        ON product_region_pricing FOR DELETE 
        USING (auth.role() = 'authenticated');
END $$;
