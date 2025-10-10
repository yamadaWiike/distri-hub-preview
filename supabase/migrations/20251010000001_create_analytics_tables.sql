-- Create catalog exports table for tracking PDF catalog exports
CREATE TABLE IF NOT EXISTS public.catalog_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  products_count INTEGER NOT NULL DEFAULT 0,
  area TEXT,
  brand TEXT,
  min_price NUMERIC,
  max_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create a type for the catalog exports for Typescript to use
DO $$ BEGIN
  CREATE TYPE public.catalog_export_type AS (
    id UUID,
    user_id UUID,
    exported_at TIMESTAMP WITH TIME ZONE,
    products_count INTEGER,
    area TEXT,
    brand TEXT,
    min_price NUMERIC,
    max_price NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Update orders table with additional fields for better analytics
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_number TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('unpaid', 'partially_paid', 'paid')),
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS distributor_id UUID REFERENCES public.distributor_profiles(id),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Ensure the orders.status field has all required statuses
ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
ADD CONSTRAINT orders_status_check
CHECK (status IN ('pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled'));

-- Create view for distributor order analytics
CREATE OR REPLACE VIEW public.distributor_order_analytics AS
SELECT 
  o.distributor_id,
  dp.business_name,
  o.status,
  COUNT(*) AS order_count,
  SUM(o.total_amount) AS total_value,
  MIN(o.created_at) AS first_order_date,
  MAX(o.created_at) AS latest_order_date
FROM 
  public.orders o
JOIN 
  public.distributor_profiles dp ON o.distributor_id = dp.id
GROUP BY 
  o.distributor_id, dp.business_name, o.status;

-- Create view for export analytics
CREATE OR REPLACE VIEW public.export_analytics AS
SELECT 
  ce.user_id,
  u.email,
  dp.business_name,
  COUNT(*) AS export_count,
  SUM(ce.products_count) AS total_products_exported,
  MIN(ce.exported_at) AS first_export_date,
  MAX(ce.exported_at) AS latest_export_date,
  string_agg(DISTINCT ce.area, ', ' ORDER BY ce.area) AS exported_areas
FROM 
  public.catalog_exports ce
LEFT JOIN 
  auth.users u ON ce.user_id = u.id
LEFT JOIN 
  public.distributor_profiles dp ON ce.user_id = dp.user_id
GROUP BY 
  ce.user_id, u.email, dp.business_name;

-- Add RLS policies for catalog_exports
ALTER TABLE public.catalog_exports ENABLE ROW LEVEL SECURITY;

-- Only admins can view all exports, users can see their own
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'catalog_exports' 
        AND policyname = 'Users can view their own catalog exports'
    ) THEN
        EXECUTE format('
            CREATE POLICY "Users can view their own catalog exports" 
            ON public.catalog_exports
            FOR SELECT 
            USING (auth.uid() = user_id OR auth.jwt() ->> ''role'' = ''admin'')
        ');
    END IF;
END
$$;

-- Users can create their own exports
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'catalog_exports' 
        AND policyname = 'Users can create their own catalog exports'
    ) THEN
        EXECUTE format('
            CREATE POLICY "Users can create their own catalog exports"
            ON public.catalog_exports
            FOR INSERT
            WITH CHECK (auth.uid() = user_id)
        ');
    END IF;
END
$$;

-- Only admins can modify exports
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'catalog_exports' 
        AND policyname = 'Only admins can modify catalog exports'
    ) THEN
        EXECUTE format('
            CREATE POLICY "Only admins can modify catalog exports"
            ON public.catalog_exports
            FOR UPDATE
            USING (auth.jwt() ->> ''role'' = ''admin'')
        ');
    END IF;
END
$$;

-- Only admins can delete exports
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'catalog_exports' 
        AND policyname = 'Only admins can delete catalog exports'
    ) THEN
        EXECUTE format('
            CREATE POLICY "Only admins can delete catalog exports"
            ON public.catalog_exports
            FOR DELETE
            USING (auth.jwt() ->> ''role'' = ''admin'')
        ');
    END IF;
END
$$;

-- Grant access to the views
GRANT SELECT ON public.distributor_order_analytics TO authenticated;
GRANT SELECT ON public.export_analytics TO authenticated;

COMMENT ON TABLE public.catalog_exports IS 'Tracks whenever a distributor exports a product catalog as PDF';
COMMENT ON TABLE public.orders IS 'Stores order information with enhanced fields for analytics';
COMMENT ON VIEW public.distributor_order_analytics IS 'Aggregated order statistics by distributor and status';
COMMENT ON VIEW public.export_analytics IS 'Aggregated export statistics by user';