-- Migration to create missing brands and product_categories tables

-- Create brands table
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create product_categories table
CREATE TABLE IF NOT EXISTS public.product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for brands
CREATE POLICY "Anyone can read brands" 
    ON public.brands FOR SELECT 
    USING (true);

CREATE POLICY "Authenticated users can insert brands" 
    ON public.brands FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update brands" 
    ON public.brands FOR UPDATE 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete brands" 
    ON public.brands FOR DELETE 
    USING (auth.role() = 'authenticated');

-- Create policies for product_categories
CREATE POLICY "Anyone can read product_categories" 
    ON public.product_categories FOR SELECT 
    USING (true);

CREATE POLICY "Authenticated users can insert product_categories" 
    ON public.product_categories FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update product_categories" 
    ON public.product_categories FOR UPDATE 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete product_categories" 
    ON public.product_categories FOR DELETE 
    USING (auth.role() = 'authenticated');

-- Insert some default brands if none exist
INSERT INTO public.brands (name) VALUES 
    ('Let''z'),
    ('Anak Tempe'),
    ('Wispish'),
    ('Unknown Brand')
ON CONFLICT (name) DO NOTHING;

-- Insert some default categories if none exist
INSERT INTO public.product_categories (name) VALUES 
    ('Snack'),
    ('Beverage'),
    ('Food'),
    ('Minuman'),
    ('Rokok'),
    ('Cokelat dan Permen'),
    ('Bakery')
ON CONFLICT (name) DO NOTHING;

-- Update existing products table to include foreign keys if they don't exist
DO $$ 
BEGIN
    -- Add brand_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'brand_id'
    ) THEN
        ALTER TABLE public.products ADD COLUMN brand_id UUID REFERENCES public.brands(id);
    END IF;
    
    -- Add category_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'category_id'
    ) THEN
        ALTER TABLE public.products ADD COLUMN category_id UUID REFERENCES public.product_categories(id);
    END IF;
    
    -- Add has_variants column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'has_variants'
    ) THEN
        ALTER TABLE public.products ADD COLUMN has_variants BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add base_distributor_price column if it doesn't exist (and remove old distributor_price)
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'base_distributor_price'
    ) THEN
        ALTER TABLE public.products ADD COLUMN base_distributor_price NUMERIC DEFAULT 0;
    END IF;
    
    -- Add base_moq column if it doesn't exist (and remove old moq)
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'base_moq'
    ) THEN
        ALTER TABLE public.products ADD COLUMN base_moq INTEGER DEFAULT 1;
    END IF;
    
    -- Add stock_quantity column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'stock_quantity'
    ) THEN
        ALTER TABLE public.products ADD COLUMN stock_quantity INTEGER DEFAULT 0;
    END IF;
    
    -- Add sku column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'sku'
    ) THEN
        ALTER TABLE public.products ADD COLUMN sku TEXT;
    END IF;
    
    -- Add image_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'image_url'
    ) THEN
        ALTER TABLE public.products ADD COLUMN image_url TEXT;
    END IF;
    
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.products ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Update existing products that have brand names to use brand_id references
UPDATE public.products 
SET brand_id = (
    SELECT b.id 
    FROM public.brands b 
    WHERE b.name = products.brand
)
WHERE brand_id IS NULL AND brand IS NOT NULL;

-- Update existing products that have category names to use category_id references  
UPDATE public.products 
SET category_id = (
    SELECT c.id 
    FROM public.product_categories c 
    WHERE c.name = products.category
)
WHERE category_id IS NULL AND category IS NOT NULL;

-- Set default brand for products without brand
UPDATE public.products 
SET brand_id = (SELECT id FROM public.brands WHERE name = 'Unknown Brand')
WHERE brand_id IS NULL;

-- Set default category for products without category
UPDATE public.products 
SET category_id = (SELECT id FROM public.product_categories WHERE name = 'Snack')
WHERE category_id IS NULL;