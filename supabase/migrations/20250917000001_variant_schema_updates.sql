CREATE TABLE IF NOT EXISTS public.product_variant_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.product_variant_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES product_variant_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add description column to brands if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'brands' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE public.brands ADD COLUMN description TEXT;
  END IF;
END $$;

-- Add description column to product_categories if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'product_categories' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE public.product_categories ADD COLUMN description TEXT;
  END IF;
END $$;

-- Update the variants table to match the script expectations
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'product_variants' 
    AND column_name = 'option_id'
  ) THEN
    ALTER TABLE public.product_variants ADD COLUMN option_id UUID REFERENCES product_variant_options(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'product_variants' 
    AND column_name = 'additional_price'
  ) THEN
    ALTER TABLE public.product_variants ADD COLUMN additional_price NUMERIC DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'product_variants' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.product_variants ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;
END $$;
