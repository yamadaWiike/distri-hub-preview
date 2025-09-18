-- Check what columns actually exist in the orders table
-- Run this first to understand the current schema

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check what columns exist in order_items table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'order_items' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if tables exist at all
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('orders', 'order_items');

-- Sample a few rows to see current data
SELECT * FROM orders LIMIT 3;