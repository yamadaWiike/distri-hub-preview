-- This migration updates the order_items table to reference the products table instead of skus
-- Since we've moved from the skus table to the products table

-- First, remove the existing foreign key constraint
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

-- Change the data type of product_id from UUID to VARCHAR to match products.id
ALTER TABLE public.order_items ALTER COLUMN product_id TYPE VARCHAR USING product_id::text;

-- Add new foreign key constraint to the products table
ALTER TABLE public.order_items
ADD CONSTRAINT order_items_product_id_fkey
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;
