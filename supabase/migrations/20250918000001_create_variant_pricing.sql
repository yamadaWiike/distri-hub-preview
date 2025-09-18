-- Migration to create variant_pricing table

-- Create variant_pricing table if it doesn't exist
CREATE TABLE IF NOT EXISTS variant_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_name VARCHAR(100) NOT NULL,
    area VARCHAR(100) NOT NULL,
    distributor_price DECIMAL(12, 2) NOT NULL,
    moq INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, variant_name, area)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS variant_pricing_product_id_idx ON variant_pricing (product_id);
CREATE INDEX IF NOT EXISTS variant_pricing_area_idx ON variant_pricing (area);

-- Ensure RLS policies are in place for the new table
ALTER TABLE variant_pricing ENABLE ROW LEVEL SECURITY;

-- Create policies for variant_pricing
DO $$
BEGIN
    -- Drop policies if they exist
    DROP POLICY IF EXISTS "Anyone can read variant_pricing" ON variant_pricing;
    DROP POLICY IF EXISTS "Authenticated users can insert variant_pricing" ON variant_pricing;
    DROP POLICY IF EXISTS "Users can update their own variant_pricing" ON variant_pricing;
    DROP POLICY IF EXISTS "Users can delete their own variant_pricing" ON variant_pricing;
    
    -- Create policies
    CREATE POLICY "Anyone can read variant_pricing" 
        ON variant_pricing FOR SELECT 
        USING (true);
        
    CREATE POLICY "Authenticated users can insert variant_pricing" 
        ON variant_pricing FOR INSERT 
        WITH CHECK (auth.role() = 'authenticated');
        
    CREATE POLICY "Users can update their own variant_pricing" 
        ON variant_pricing FOR UPDATE 
        USING (auth.role() = 'authenticated');
        
    CREATE POLICY "Users can delete their own variant_pricing" 
        ON variant_pricing FOR DELETE 
        USING (auth.role() = 'authenticated');
END $$;

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_variant_pricing_updated_at
    BEFORE UPDATE ON variant_pricing
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();