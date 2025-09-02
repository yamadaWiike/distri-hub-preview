-- Insert Dummy SKUs into products and region_pricing tables
-- Note: Run this script in the Supabase SQL editor
-- This script is designed to work with the existing database schema

-- Enable uuid extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- We'll work with the existing schema structure
-- Check if tables exist before proceeding
DO $$
DECLARE
  product_table_exists BOOLEAN;
  brand_table_exists BOOLEAN;
  category_table_exists BOOLEAN;
  region_pricing_table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'products'
  ) INTO product_table_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'brands'
  ) INTO brand_table_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'product_categories'
  ) INTO category_table_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'region_pricing'
  ) INTO region_pricing_table_exists;
  
  -- Check if the required tables exist
  IF NOT product_table_exists OR NOT brand_table_exists OR NOT category_table_exists THEN
    RAISE NOTICE 'Required tables not found. Please check your database schema.';
  END IF;
END
$$;

-- Create an index on product_id for faster lookups
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'region_pricing'
  ) AND NOT EXISTS (
    SELECT FROM pg_indexes 
    WHERE tablename = 'region_pricing' AND indexname = 'region_pricing_product_id_idx'
  ) THEN
    CREATE INDEX region_pricing_product_id_idx ON region_pricing (product_id);
  END IF;
END $$;

-- Create or insert sample brands
DO $$
DECLARE
  snack_brand_id UUID;
  beverage_brand_id UUID;
  dairy_brand_id UUID;
  bakery_brand_id UUID;
  frozen_brand_id UUID;
BEGIN
  -- Insert brands if they don't exist
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'brands'
  ) THEN
    -- Check if brands already exist
    IF NOT EXISTS (SELECT FROM brands WHERE name = 'Keripik Makmur') THEN
      INSERT INTO brands (name) VALUES ('Keripik Makmur') RETURNING id INTO snack_brand_id;
    ELSE
      SELECT id FROM brands WHERE name = 'Keripik Makmur' INTO snack_brand_id;
    END IF;
    
    IF NOT EXISTS (SELECT FROM brands WHERE name = 'Teh Sejuk') THEN
      INSERT INTO brands (name) VALUES ('Teh Sejuk') RETURNING id INTO beverage_brand_id;
    ELSE
      SELECT id FROM brands WHERE name = 'Teh Sejuk' INTO beverage_brand_id;
    END IF;
    
    IF NOT EXISTS (SELECT FROM brands WHERE name = 'Susu Sehat') THEN
      INSERT INTO brands (name) VALUES ('Susu Sehat') RETURNING id INTO dairy_brand_id;
    ELSE
      SELECT id FROM brands WHERE name = 'Susu Sehat' INTO dairy_brand_id;
    END IF;
    
    IF NOT EXISTS (SELECT FROM brands WHERE name = 'Roti Prima') THEN
      INSERT INTO brands (name) VALUES ('Roti Prima') RETURNING id INTO bakery_brand_id;
    ELSE
      SELECT id FROM brands WHERE name = 'Roti Prima' INTO bakery_brand_id;
    END IF;
    
    IF NOT EXISTS (SELECT FROM brands WHERE name = 'Frozen Lezat') THEN
      INSERT INTO brands (name) VALUES ('Frozen Lezat') RETURNING id INTO frozen_brand_id;
    ELSE
      SELECT id FROM brands WHERE name = 'Frozen Lezat' INTO frozen_brand_id;
    END IF;
  END IF;
END
$$;

-- Create or insert sample product categories
DO $$
DECLARE
  snack_category_id UUID;
  beverage_category_id UUID;
  dairy_category_id UUID;
  bakery_category_id UUID;
  frozen_category_id UUID;
BEGIN
  -- Insert categories if they don't exist
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'product_categories'
  ) THEN
    -- Check if categories already exist
    IF NOT EXISTS (SELECT FROM product_categories WHERE name = 'Snack') THEN
      INSERT INTO product_categories (name) VALUES ('Snack') RETURNING id INTO snack_category_id;
    ELSE
      SELECT id FROM product_categories WHERE name = 'Snack' INTO snack_category_id;
    END IF;
    
    IF NOT EXISTS (SELECT FROM product_categories WHERE name = 'Beverage') THEN
      INSERT INTO product_categories (name) VALUES ('Beverage') RETURNING id INTO beverage_category_id;
    ELSE
      SELECT id FROM product_categories WHERE name = 'Beverage' INTO beverage_category_id;
    END IF;
    
    IF NOT EXISTS (SELECT FROM product_categories WHERE name = 'Dairy') THEN
      INSERT INTO product_categories (name) VALUES ('Dairy') RETURNING id INTO dairy_category_id;
    ELSE
      SELECT id FROM product_categories WHERE name = 'Dairy' INTO dairy_category_id;
    END IF;
    
    IF NOT EXISTS (SELECT FROM product_categories WHERE name = 'Bakery') THEN
      INSERT INTO product_categories (name) VALUES ('Bakery') RETURNING id INTO bakery_category_id;
    ELSE
      SELECT id FROM product_categories WHERE name = 'Bakery' INTO bakery_category_id;
    END IF;
    
    IF NOT EXISTS (SELECT FROM product_categories WHERE name = 'Frozen') THEN
      INSERT INTO product_categories (name) VALUES ('Frozen') RETURNING id INTO frozen_category_id;
    ELSE
      SELECT id FROM product_categories WHERE name = 'Frozen' INTO frozen_category_id;
    END IF;
  END IF;
END
$$;

-- Insert products based on the schema we have
DO $$
DECLARE
  snack_category_id UUID;
  beverage_category_id UUID;
  dairy_category_id UUID;
  bakery_category_id UUID;
  frozen_category_id UUID;
  
  snack_brand_id UUID;
  beverage_brand_id UUID;
  dairy_brand_id UUID;
  bakery_brand_id UUID;
  frozen_brand_id UUID;
  
  snack_product_id UUID;
  beverage_product_id UUID;
  dairy_product_id UUID;
  bakery_product_id UUID;
  frozen_product_id UUID;
BEGIN
  -- Check if we need to add a stock_quantity column to products table
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'products'
  ) AND NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'stock_quantity'
  ) THEN
    ALTER TABLE products ADD COLUMN stock_quantity INTEGER DEFAULT 0;
    RAISE NOTICE 'Added stock_quantity column to products table';
  END IF;
  -- Get category IDs
  SELECT id FROM product_categories WHERE name = 'Snack' INTO snack_category_id;
  SELECT id FROM product_categories WHERE name = 'Beverage' INTO beverage_category_id;
  SELECT id FROM product_categories WHERE name = 'Dairy' INTO dairy_category_id;
  SELECT id FROM product_categories WHERE name = 'Bakery' INTO bakery_category_id;
  SELECT id FROM product_categories WHERE name = 'Frozen' INTO frozen_category_id;
  
  -- Get brand IDs
  SELECT id FROM brands WHERE name = 'Keripik Makmur' INTO snack_brand_id;
  SELECT id FROM brands WHERE name = 'Teh Sejuk' INTO beverage_brand_id;
  SELECT id FROM brands WHERE name = 'Susu Sehat' INTO dairy_brand_id;
  SELECT id FROM brands WHERE name = 'Roti Prima' INTO bakery_brand_id;
  SELECT id FROM brands WHERE name = 'Frozen Lezat' INTO frozen_brand_id;
  
  -- Insert products if they don't exist
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'products'
  ) THEN
    -- Insert snack products
    IF NOT EXISTS (SELECT FROM products WHERE sku = 'SKU-SNCK-001') THEN
      INSERT INTO products (
        sku, 
        category_id, 
        brand_id, 
        name, 
        size, 
        base_distributor_price, 
        consumer_price, 
        base_moq, 
        description, 
        image_url,
        stock_quantity
      ) VALUES (
        'SKU-CHIPS-10',
        snack_category_id,
        snack_brand_id,
        'Keripik Pisang Madu Premium',
        '100g',
        8000,
        10000,
        20,
        'Keripik pisang premium dengan rasa madu alami, dibuat dari pisang pilihan yang diolah dengan metode vacuum frying untuk menjaga nutrisi dan rasa. Tekstur renyah, manis alami, dan bebas pengawet. Cocok untuk cemilan sehat keluarga atau sebagai oleh-oleh khas.',
        'keripik_pisang.jpg',
        500  -- Adding stock quantity
      ) RETURNING id INTO snack_product_id;
    ELSE
      SELECT id FROM products WHERE sku = 'SKU-CHIPS-10' INTO snack_product_id;
    END IF;
    
    -- Insert more snack products
    IF NOT EXISTS (SELECT FROM products WHERE sku = 'SKU-SNCK-002') THEN
      INSERT INTO products (
        sku, 
        category_id, 
        brand_id, 
        name, 
        size, 
        base_distributor_price, 
        consumer_price, 
        base_moq, 
        description, 
        image_url,
        stock_quantity
      ) VALUES (
        'SKU-CHIPS-11',
        snack_category_id,
        snack_brand_id,
        'Keripik Singkong Balado',
        '150g',
        7500,
        9500,
        25,
        'Keripik singkong dengan bumbu balado pedas khas Indonesia. Terbuat dari singkong pilihan yang diiris tipis dan digoreng hingga renyah sempurna. Rasa pedas dan gurihnya menggugah selera, cocok untuk teman nonton atau camilan saat santai.',
        'keripik_singkong.jpg',
        350  -- Adding stock quantity
      );
    END IF;
    
    IF NOT EXISTS (SELECT FROM products WHERE sku = 'SKU-SNCK-003') THEN
      INSERT INTO products (
        sku, 
        category_id, 
        brand_id, 
        name, 
        size, 
        base_distributor_price, 
        consumer_price, 
        base_moq, 
        description, 
        image_url,
        stock_quantity
      ) VALUES (
        'SKU-CHIPS-12',
        snack_category_id,
        snack_brand_id,
        'Keripik Ubi Ungu',
        '80g',
        8200,
        10500,
        15,
        'Keripik ubi ungu organik yang kaya akan antioksidan dan serat. Diolah dari ubi ungu segar pilihan petani lokal, dengan proses penggorengan vakum untuk mempertahankan warna ungu alami dan nutrisinya. Rasanya yang manis alami tanpa pemanis tambahan menjadikannya camilan sehat untuk semua usia.',
        'keripik_ubi_ungu.jpg',
        420  -- Adding stock quantity
      );
    END IF;
    
    -- Insert beverage products
    IF NOT EXISTS (SELECT FROM products WHERE sku = 'SKU-BEV-001') THEN
      INSERT INTO products (
        sku, 
        category_id, 
        brand_id, 
        name, 
        size, 
        base_distributor_price, 
        consumer_price, 
        base_moq, 
        description, 
        image_url,
        stock_quantity
      ) VALUES (
        'SKU-TEH-10',
        beverage_category_id,
        beverage_brand_id,
        'Teh Hijau Organik Premium',
        '500ml',
        4000,
        6000,
        24,
        'Minuman teh hijau organik premium yang dipetik dari kebun teh pegunungan terbaik di Indonesia. Diolah dengan teknologi ekstraksi dingin untuk mempertahankan antioksidan dan khasiat teh hijau. Rendah kalori, tanpa pemanis buatan, dan dikemas dalam botol ramah lingkungan. Rasanya segar dengan aroma teh hijau yang khas.',
        'teh_hijau.jpg',
        650  -- Adding stock quantity
      ) RETURNING id INTO beverage_product_id;
    ELSE
      SELECT id FROM products WHERE sku = 'SKU-TEH-10' INTO beverage_product_id;
    END IF;
    
    IF NOT EXISTS (SELECT FROM products WHERE sku = 'SKU-BEV-002') THEN
      INSERT INTO products (
        sku, 
        category_id, 
        brand_id, 
        name, 
        size, 
        base_distributor_price, 
        consumer_price, 
        base_moq, 
        description, 
        image_url,
        stock_quantity
      ) VALUES (
        'SKU-TEH-11',
        beverage_category_id,
        beverage_brand_id,
        'Teh Melati Jasmine',
        '450ml',
        3800,
        5800,
        24,
        'Teh melati premium dengan aroma bunga melati asli. Teh hitam berkualitas tinggi dipadukan dengan bunga melati pilihan untuk menciptakan minuman yang menyegarkan dan menenangkan. Disajikan tanpa pengawet dan dikemas dalam botol PET ramah lingkungan. Cocok dinikmati dingin atau hangat.',
        'teh_melati.jpg',
        480  -- Adding stock quantity
      );
    END IF;
    
    IF NOT EXISTS (SELECT FROM products WHERE sku = 'SKU-BEV-003') THEN
      INSERT INTO products (
        sku, 
        category_id, 
        brand_id, 
        name, 
        size, 
        base_distributor_price, 
        consumer_price, 
        base_moq, 
        description, 
        image_url
      ) VALUES (
        'SKU-BEV-003',
        beverage_category_id,
        beverage_brand_id,
        'Air Kelapa Murni',
        '330ml',
        5000,
        7500,
        18,
        'Air kelapa muda asli 100% tanpa tambahan gula atau pengawet. Dipanen dari kebun kelapa organik dan langsung dikemas dengan teknologi UHT untuk menjaga kesegaran dan nutrisinya. Kaya elektrolit alami dan mineral, cocok untuk rehidrasi setelah olahraga atau sebagai minuman sehat sehari-hari.',
        'air_kelapa.jpg'
      );
    END IF;
    
    -- Insert dairy products
    IF NOT EXISTS (SELECT FROM products WHERE sku = 'SKU-DAIRY-001') THEN
      INSERT INTO products (
        sku, 
        category_id, 
        brand_id, 
        name, 
        size, 
        base_distributor_price, 
        consumer_price, 
        base_moq, 
        description, 
        image_url
      ) VALUES (
        'SKU-DAIRY-001',
        dairy_category_id,
        dairy_brand_id,
        'Susu UHT Full Cream Premium',
        '1L',
        12000,
        15000,
        12,
        'Susu sapi full cream premium dengan kadar lemak 3.5%. Bersumber dari sapi perah yang dipelihara di peternakan pegunungan dengan pakan organik berkualitas. Diproses dengan teknologi UHT untuk menjaga kesegaran tanpa bahan pengawet hingga 6 bulan dalam kemasan tertutup. Kaya kalsium dan vitamin D untuk kesehatan tulang dan gigi.',
        'susu_full_cream.jpg'
      ) RETURNING id INTO dairy_product_id;
    ELSE
      SELECT id FROM products WHERE sku = 'SKU-DAIRY-001' INTO dairy_product_id;
    END IF;
    
    IF NOT EXISTS (SELECT FROM products WHERE sku = 'SKU-DAIRY-002') THEN
      INSERT INTO products (
        sku, 
        category_id, 
        brand_id, 
        name, 
        size, 
        base_distributor_price, 
        consumer_price, 
        base_moq, 
        description, 
        image_url
      ) VALUES (
        'SKU-DAIRY-002',
        dairy_category_id,
        dairy_brand_id,
        'Susu UHT Low Fat',
        '1L',
        13000,
        16500,
        12,
        'Susu sapi rendah lemak dengan kadar lemak hanya 1%. Ideal untuk yang sedang menjaga asupan lemak namun tetap ingin mendapatkan nutrisi susu lengkap. Diproses dengan teknologi UHT modern yang menjaga rasa dan nutrisi. Diperkaya dengan kalsium dan protein tambahan, cocok untuk diet seimbang dan gaya hidup aktif.',
        'susu_low_fat.jpg'
      );
    END IF;
    
    IF NOT EXISTS (SELECT FROM products WHERE sku = 'SKU-DAIRY-003') THEN
      INSERT INTO products (
        sku, 
        category_id, 
        brand_id, 
        name, 
        size, 
        base_distributor_price, 
        consumer_price, 
        base_moq, 
        description, 
        image_url
      ) VALUES (
        'SKU-DAIRY-003',
        dairy_category_id,
        dairy_brand_id,
        'Yogurt Plain Probiotik',
        '500g',
        15000,
        18500,
        8,
        'Yogurt plain tanpa gula dengan 5 strain probiotik aktif untuk kesehatan pencernaan. Dibuat dari susu sapi segar pilihan yang difermentasi secara alami. Tekstur creamy dengan rasa asam yang seimbang. Sumber protein dan kalsium yang baik, cocok untuk sarapan, camilan sehat, atau bahan dasar smoothie dan hidangan penutup.',
        'yogurt_plain.jpg'
      );
    END IF;
    
    -- Insert bakery products
    IF NOT EXISTS (SELECT FROM products WHERE sku = 'SKU-BAKERY-001') THEN
      INSERT INTO products (
        sku, 
        category_id, 
        brand_id, 
        name, 
        size, 
        base_distributor_price, 
        consumer_price, 
        base_moq, 
        description, 
        image_url
      ) VALUES (
        'SKU-BAKERY-001',
        bakery_category_id,
        bakery_brand_id,
        'Roti Tawar Premium',
        '400g',
        9000,
        12000,
        10,
        'Roti tawar premium berbahan tepung terigu protein tinggi pilihan, tanpa pengawet dan pewarna buatan. Dipanggang dengan sempurna untuk menghasilkan tekstur lembut dan aroma yang menggugah selera. Cocok untuk sarapan, sandwich, atau camilan. Tersedia dalam kemasan praktis yang menjaga kesegaran hingga 5 hari dalam suhu ruangan.',
        'roti_tawar.jpg'
      ) RETURNING id INTO bakery_product_id;
    ELSE
      SELECT id FROM products WHERE sku = 'SKU-BAKERY-001' INTO bakery_product_id;
    END IF;
    
    IF NOT EXISTS (SELECT FROM products WHERE sku = 'SKU-BAKERY-002') THEN
      INSERT INTO products (
        sku, 
        category_id, 
        brand_id, 
        name, 
        size, 
        base_distributor_price, 
        consumer_price, 
        base_moq, 
        description, 
        image_url
      ) VALUES (
        'SKU-BAKERY-002',
        bakery_category_id,
        bakery_brand_id,
        'Roti Gandum Utuh',
        '350g',
        10500,
        14000,
        10,
        'Roti gandum utuh (whole wheat) yang kaya serat dan nutrisi. Dibuat dengan 80% tepung gandum utuh dan diperkaya dengan biji-bijian seperti flaxseed dan sunflower seed. Rendah gula dan tanpa bahan pengawet. Teksturnya padat namun tetap lembut, dengan rasa khas gandum yang nikmat. Pilihan sehat untuk sarapan atau sandwich.',
        'roti_gandum.jpg'
      );
    END IF;
    
    IF NOT EXISTS (SELECT FROM products WHERE sku = 'SKU-BAKERY-003') THEN
      INSERT INTO products (
        sku, 
        category_id, 
        brand_id, 
        name, 
        size, 
        base_distributor_price, 
        consumer_price, 
        base_moq, 
        description, 
        image_url
      ) VALUES (
        'SKU-BAKERY-003',
        bakery_category_id,
        bakery_brand_id,
        'Brownies Cokelat Deluxe',
        '250g',
        15000,
        22000,
        6,
        'Brownies cokelat premium dengan tekstur fudgy di dalam dan sedikit crispy di luar. Dibuat dengan cokelat Belgia berkualitas tinggi (70% cocoa) dan butter impor. Hadir dalam kemasan praktis yang menjaga kelembaban dan kualitas brownies. Cocok untuk dessert, hadiah, atau teman minum kopi dan teh.',
        'brownies_cokelat.jpg'
      );
    END IF;
    
    -- Insert frozen products
    IF NOT EXISTS (SELECT FROM products WHERE sku = 'SKU-FROZEN-001') THEN
      INSERT INTO products (
        sku, 
        category_id, 
        brand_id, 
        name, 
        size, 
        base_distributor_price, 
        consumer_price, 
        base_moq, 
        description, 
        image_url
      ) VALUES (
        'SKU-FROZEN-001',
        frozen_category_id,
        frozen_brand_id,
        'Nugget Ayam Premium',
        '500g',
        18000,
        25000,
        5,
        'Nugget ayam premium dengan kandungan daging ayam asli 70%. Terbuat dari fillet dada ayam pilihan tanpa tulang dan kulit, diproses higienis dalam fasilitas bersertifikat HACCP. Dilapisi tepung roti premium yang menghasilkan tekstur renyah di luar dan juicy di dalam. Siap digoreng hanya dalam 3 menit, cocok untuk lauk praktis atau camilan keluarga.',
        'nugget_ayam.jpg'
      ) RETURNING id INTO frozen_product_id;
    ELSE
      SELECT id FROM products WHERE sku = 'SKU-FROZEN-001' INTO frozen_product_id;
    END IF;
    
    IF NOT EXISTS (SELECT FROM products WHERE sku = 'SKU-FROZEN-002') THEN
      INSERT INTO products (
        sku, 
        category_id, 
        brand_id, 
        name, 
        size, 
        base_distributor_price, 
        consumer_price, 
        base_moq, 
        description, 
        image_url
      ) VALUES (
        'SKU-FROZEN-002',
        frozen_category_id,
        frozen_brand_id,
        'Bakso Sapi Premium',
        '500g (25pcs)',
        21000,
        28000,
        5,
        'Bakso sapi premium berbahan 90% daging sapi segar pilihan tanpa MSG dan pengawet berbahaya. Diproses dengan teknologi modern untuk menghasilkan tekstur kenyal alami tanpa bahan pengenyal. Dikemas dalam kemasan vacuum yang menjaga kualitas dan daya simpan. Siap disajikan dengan cara direbus selama 3-5 menit.',
        'bakso_sapi.jpg'
      );
    END IF;
    
    IF NOT EXISTS (SELECT FROM products WHERE sku = 'SKU-FROZEN-003') THEN
      INSERT INTO products (
        sku, 
        category_id, 
        brand_id, 
        name, 
        size, 
        base_distributor_price, 
        consumer_price, 
        base_moq, 
        description, 
        image_url
      ) VALUES (
        'SKU-FROZEN-003',
        frozen_category_id,
        frozen_brand_id,
        'Udang Beku Kupas',
        '400g',
        32000,
        42000,
        4,
        'Udang beku berkualitas premium, dikupas dan dibersihkan secara higienis dengan kepala dan kulit terpisah (peeled & deveined). Ukuran 31-40 ekor per kg, cocok untuk berbagai masakan. Dibekukan dengan metode IQF (Individual Quick Freezing) untuk mempertahankan kesegaran, tekstur dan nutrisi. Dikemas dalam kemasan resealable untuk kemudahan penyimpanan.',
        'udang_beku.jpg'
      );
    END IF;
    
    -- Create temporary table to store product mappings with a unique constraint on sku
    DROP TABLE IF EXISTS product_mapping;
    CREATE TEMPORARY TABLE product_mapping (
      sku TEXT PRIMARY KEY,
      product_id UUID
    );
    
    -- Insert product mappings (using simple INSERT since we just created the table)
    INSERT INTO product_mapping (sku, product_id) VALUES
      -- Snacks
      ('SKU-CHIPS-10', snack_product_id),
      ('SKU-CHIPS-11', (SELECT id FROM products WHERE sku = 'SKU-CHIPS-11')),
      ('SKU-CHIPS-12', (SELECT id FROM products WHERE sku = 'SKU-CHIPS-12')),
      -- Beverages
      ('SKU-TEH-10', beverage_product_id),
      ('SKU-TEH-11', (SELECT id FROM products WHERE sku = 'SKU-TEH-11')),
      ('SKU-BEV-003', (SELECT id FROM products WHERE sku = 'SKU-BEV-003')),
      -- Dairy
      ('SKU-DAIRY-001', dairy_product_id),
      ('SKU-DAIRY-002', (SELECT id FROM products WHERE sku = 'SKU-DAIRY-002')),
      ('SKU-DAIRY-003', (SELECT id FROM products WHERE sku = 'SKU-DAIRY-003')),
      -- Bakery
      ('SKU-BAKERY-001', bakery_product_id),
      ('SKU-BAKERY-002', (SELECT id FROM products WHERE sku = 'SKU-BAKERY-002')),
      ('SKU-BAKERY-003', (SELECT id FROM products WHERE sku = 'SKU-BAKERY-003')),
      -- Frozen
      ('SKU-FROZEN-001', frozen_product_id),
      ('SKU-FROZEN-002', (SELECT id FROM products WHERE sku = 'SKU-FROZEN-002')),
      ('SKU-FROZEN-003', (SELECT id FROM products WHERE sku = 'SKU-FROZEN-003'));
  END IF;
END
$$;

-- Insert region pricing data
DO $$
DECLARE
  snack_product_id UUID;
  beverage_product_id UUID;
  dairy_product_id UUID;
  bakery_product_id UUID;
  frozen_product_id UUID;
BEGIN
  -- Get product IDs from our temporary mapping table
  SELECT product_id FROM product_mapping WHERE sku = 'SKU-CHIPS-10' INTO snack_product_id;
  SELECT product_id FROM product_mapping WHERE sku = 'SKU-TEH-10' INTO beverage_product_id;
  SELECT product_id FROM product_mapping WHERE sku = 'SKU-DAIRY-001' INTO dairy_product_id;
  SELECT product_id FROM product_mapping WHERE sku = 'SKU-BAKERY-001' INTO bakery_product_id;
  SELECT product_id FROM product_mapping WHERE sku = 'SKU-FROZEN-001' INTO frozen_product_id;
  
  -- Insert region pricing for snack product - Jakarta regions
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'region_pricing'
  ) AND snack_product_id IS NOT NULL THEN
    -- Jakarta Pusat
    IF NOT EXISTS (
      SELECT FROM region_pricing 
      WHERE product_id = snack_product_id AND area = 'Jakarta Pusat'
    ) THEN
      INSERT INTO region_pricing (product_id, area, distributor_price, moq) VALUES
        (snack_product_id, 'Jakarta Pusat', 8500, 25);
    END IF;
    
    -- Jakarta Selatan
    IF NOT EXISTS (
      SELECT FROM region_pricing 
      WHERE product_id = snack_product_id AND area = 'Jakarta Selatan'
    ) THEN
      INSERT INTO region_pricing (product_id, area, distributor_price, moq) VALUES
        (snack_product_id, 'Jakarta Selatan', 8700, 20);
    END IF;
    
    -- Jakarta Utara
    IF NOT EXISTS (
      SELECT FROM region_pricing 
      WHERE product_id = snack_product_id AND area = 'Jakarta Utara'
    ) THEN
      INSERT INTO region_pricing (product_id, area, distributor_price, moq) VALUES
        (snack_product_id, 'Jakarta Utara', 8300, 30);
    END IF;
    
    -- Insert region pricing for beverage product - various cities
    IF beverage_product_id IS NOT NULL THEN
      -- Kota Bandung
      IF NOT EXISTS (
        SELECT FROM region_pricing 
        WHERE product_id = beverage_product_id AND area = 'Kota Bandung'
      ) THEN
        INSERT INTO region_pricing (product_id, area, distributor_price, moq) VALUES
          (beverage_product_id, 'Kota Bandung', 4200, 30);
      END IF;
      
      -- Kota Surabaya
      IF NOT EXISTS (
        SELECT FROM region_pricing 
        WHERE product_id = beverage_product_id AND area = 'Kota Surabaya'
      ) THEN
        INSERT INTO region_pricing (product_id, area, distributor_price, moq) VALUES
          (beverage_product_id, 'Kota Surabaya', 4500, 35);
      END IF;
      
      -- Kota Medan
      IF NOT EXISTS (
        SELECT FROM region_pricing 
        WHERE product_id = beverage_product_id AND area = 'Kota Medan'
      ) THEN
        INSERT INTO region_pricing (product_id, area, distributor_price, moq) VALUES
          (beverage_product_id, 'Kota Medan', 4800, 40);
      END IF;
    END IF;
    
    -- Insert region pricing for dairy product
    IF dairy_product_id IS NOT NULL THEN
      -- Kota Bandung
      IF NOT EXISTS (
        SELECT FROM region_pricing 
        WHERE product_id = dairy_product_id AND area = 'Kota Bandung'
      ) THEN
        INSERT INTO region_pricing (product_id, area, distributor_price, moq) VALUES
          (dairy_product_id, 'Kota Bandung', 12500, 15);
      END IF;
      
      -- Jakarta Pusat
      IF NOT EXISTS (
        SELECT FROM region_pricing 
        WHERE product_id = dairy_product_id AND area = 'Jakarta Pusat'
      ) THEN
        INSERT INTO region_pricing (product_id, area, distributor_price, moq) VALUES
          (dairy_product_id, 'Jakarta Pusat', 12200, 12);
      END IF;
    END IF;
    
    -- Insert region pricing for bakery product
    IF bakery_product_id IS NOT NULL THEN
      -- Jakarta Pusat
      IF NOT EXISTS (
        SELECT FROM region_pricing 
        WHERE product_id = bakery_product_id AND area = 'Jakarta Pusat'
      ) THEN
        INSERT INTO region_pricing (product_id, area, distributor_price, moq) VALUES
          (bakery_product_id, 'Jakarta Pusat', 9500, 12);
      END IF;
    END IF;
    
    -- Insert region pricing for frozen product
    IF frozen_product_id IS NOT NULL THEN
      -- Kota Surabaya
      IF NOT EXISTS (
        SELECT FROM region_pricing 
        WHERE product_id = frozen_product_id AND area = 'Kota Surabaya'
      ) THEN
        INSERT INTO region_pricing (product_id, area, distributor_price, moq) VALUES
          (frozen_product_id, 'Kota Surabaya', 19000, 8);
      END IF;
    END IF;
  END IF;
END
$$;

-- Add more region pricing for all products
DO $$
DECLARE
  current_product_id UUID;
  product_sku TEXT;
  product_skus TEXT[] := ARRAY[
    'SKU-SNCK-002', 'SKU-SNCK-003', 
    'SKU-BEV-002', 'SKU-BEV-003', 
    'SKU-DAIRY-002', 'SKU-DAIRY-003', 
    'SKU-BAKERY-002', 'SKU-BAKERY-003', 
    'SKU-FROZEN-002', 'SKU-FROZEN-003'
  ];
  areas TEXT[] := ARRAY['Jakarta Pusat', 'Jakarta Selatan', 'Jakarta Utara', 'Kota Bandung', 'Kota Surabaya', 'Kota Medan'];
  i INTEGER;
  j INTEGER;
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'region_pricing'
  ) THEN
    -- Loop through each product
    FOREACH product_sku IN ARRAY product_skus
    LOOP
      -- Get product ID
      SELECT product_id FROM product_mapping WHERE sku = product_sku INTO current_product_id;
      
      IF current_product_id IS NOT NULL THEN
        -- Add regional pricing for 2 random areas for each product
        FOR i IN 1..2 LOOP
          j := floor(random() * array_length(areas, 1)) + 1;
          
          -- Check if pricing already exists for this product and area
          IF NOT EXISTS (
            SELECT FROM region_pricing 
            WHERE product_id = current_product_id AND area = areas[j]
          ) THEN
            -- Insert region pricing with slightly randomized values
            INSERT INTO region_pricing (product_id, area, distributor_price, moq) VALUES
              (current_product_id, areas[j], 
               (8000 + floor(random() * 25000)::int), -- Random price between 8000 and 33000
               (5 + floor(random() * 25)::int)); -- Random MOQ between 5 and 30
          END IF;
        END LOOP;
      END IF;
    END LOOP;
  END IF;
END
$$;

-- Update all products to add stock_quantity if missing
DO $$
DECLARE
  product_rec RECORD;
BEGIN
  FOR product_rec IN 
    SELECT id FROM products WHERE stock_quantity IS NULL
  LOOP
    UPDATE products 
    SET stock_quantity = FLOOR(100 + RANDOM() * 900)::INT 
    WHERE id = product_rec.id;
  END LOOP;
END
$$;

-- Display success message
DO $$
DECLARE
  product_count INTEGER;
  pricing_count INTEGER;
  stock_sum INTEGER;
BEGIN
  SELECT COUNT(*) FROM products INTO product_count;
  SELECT COUNT(*) FROM region_pricing INTO pricing_count;
  SELECT SUM(stock_quantity) FROM products INTO stock_sum;
  
  RAISE NOTICE 'Dummy SKUs inserted successfully!';
  
  -- Print summary of inserted data
  RAISE NOTICE 'Added products: %', product_count;
  RAISE NOTICE 'Added region pricing entries: %', pricing_count;
  RAISE NOTICE 'Total product stock: %', stock_sum;
  RAISE NOTICE 'Product categories: Snack, Beverage, Dairy, Bakery, Frozen';
END
$$;

-- Helper function to insert more products if needed
-- You can call this function to add more products later
CREATE OR REPLACE FUNCTION add_more_products() 
RETURNS VOID AS $$
DECLARE
  category_id UUID;
  brand_id UUID;
  product_id UUID;
BEGIN
  -- Example for beverages
  -- Get category and brand IDs
  SELECT id FROM product_categories WHERE name = 'Beverage' INTO category_id;
  SELECT id FROM brands WHERE name = 'Teh Sejuk' INTO brand_id;
  
  -- Check if product already exists
  SELECT id FROM products WHERE sku = 'SKU-BEV-002' INTO product_id;
  
  IF product_id IS NULL THEN
    -- Insert additional beverage products
    INSERT INTO products (
      sku, 
      category_id, 
      brand_id, 
      name, 
      size, 
      base_distributor_price, 
      consumer_price, 
      base_moq, 
      description, 
      image_url
    ) VALUES (
      'SKU-BEV-002',
      category_id,
      brand_id,
      'Teh Melati Botol',
      '500ml',
      4200,
      6500,
      24,
      'Teh melati segar dalam kemasan botol praktis',
      'teh_melati.jpg'
    ) RETURNING id INTO product_id;
    
    -- Add region pricing for the new product
    INSERT INTO region_pricing (product_id, area, distributor_price, moq) VALUES
      (product_id, 'Jakarta Pusat', 4300, 25),
      (product_id, 'Kota Bandung', 4500, 30);
      
    RAISE NOTICE 'Added new product: SKU-BEV-002';
  ELSE
    RAISE NOTICE 'Product SKU-BEV-002 already exists, skipping insertion';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- To add more products and region pricing, you can run:
-- SELECT add_more_products();

-- End of script
