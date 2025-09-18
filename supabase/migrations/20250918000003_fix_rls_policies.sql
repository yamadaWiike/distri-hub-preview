-- Fix RLS policies for brands and product_categories tables

-- Drop existing policies for product_categories
DROP POLICY IF EXISTS "Anyone can read product_categories" ON public.product_categories;
DROP POLICY IF EXISTS "Authenticated users can insert product_categories" ON public.product_categories;
DROP POLICY IF EXISTS "Authenticated users can update product_categories" ON public.product_categories;
DROP POLICY IF EXISTS "Authenticated users can delete product_categories" ON public.product_categories;

-- Drop existing policies for brands
DROP POLICY IF EXISTS "Anyone can read brands" ON public.brands;
DROP POLICY IF EXISTS "Authenticated users can insert brands" ON public.brands;
DROP POLICY IF EXISTS "Authenticated users can update brands" ON public.brands;
DROP POLICY IF EXISTS "Authenticated users can delete brands" ON public.brands;

-- Create more permissive policies for product_categories
CREATE POLICY "Anyone can read product_categories" 
    ON public.product_categories FOR SELECT 
    USING (true);

CREATE POLICY "Anyone can insert product_categories" 
    ON public.product_categories FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Anyone can update product_categories" 
    ON public.product_categories FOR UPDATE 
    USING (true);

CREATE POLICY "Anyone can delete product_categories" 
    ON public.product_categories FOR DELETE 
    USING (true);

-- Create more permissive policies for brands
CREATE POLICY "Anyone can read brands" 
    ON public.brands FOR SELECT 
    USING (true);

CREATE POLICY "Anyone can insert brands" 
    ON public.brands FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Anyone can update brands" 
    ON public.brands FOR UPDATE 
    USING (true);

CREATE POLICY "Anyone can delete brands" 
    ON public.brands FOR DELETE 
    USING (true);

-- Note: In production, you should replace these with more restrictive policies
-- that check for admin roles, but for development this allows full access