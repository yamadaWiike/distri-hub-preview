# Data Model / ERD – Baskit Distributor Hub (Inferred)

This ERD is conceptual and inferred from migrations and services. Refer to actual SQL under `supabase/migrations` for authoritative schema.

## 1. Core Entities

### 1.1 Products
- **Table**: `products`
- **Key Fields**:
  - `id` (UUID)
  - `sku` (string)
  - `category_id` → FK `product_categories.id`
  - `brand_id` → FK `brands.id`
  - `name`, `size`, `description`
  - `base_distributor_price`, `retail_price`, `consumer_price`
  - `base_moq`
  - UOM fields: `base_uom`, `moq_uom`, `pricing_uom`, `enable_uom_conversions`
  - Mix variants fields: `single_sku_moq`, `allow_mix_variants`

### 1.2 Product Variants
- **Table**: `product_variants`
- **Key Fields**:
  - `id` (UUID)
  - `product_id` → FK `products.id`
  - `variant_name`
  - `variant_description`
  - `additional_price`
  - `is_active`

- **View**: `variants_view`
  - Combines product, group, and option info into flattened variant options.

### 1.3 Regional Pricing & Distribution Areas
- **Table**: `regional_pricing`
- **Key Fields**:
  - `id` (UUID)
  - `product_id` → FK `products.id`
  - `area` (string)
  - `distributor_price`
  - `moq`, `moq_uom`, `price_uom`
  - UOM conversion factors: `moq_conversion_factor`, `pricing_conversion_factor`
  - Mix variants fields: `sku_level_moq`, `allow_mix_variants`

- **Table**: `distribution_areas`
  - Defines coverage regions (province, city, etc.).

### 1.4 UOM System

- **Table**: `uom_units`
  - `id`, `name`, `description`, `is_active`, timestamps.

- **Table**: `uom_conversions`
  - `id`
  - `product_id` → FK `products.id`
  - `from_uom`, `to_uom`
  - `conversion_factor`
  - `is_active`
  - Unique constraint on `(product_id, from_uom, to_uom)`.

- **Table**: `uom_pricing`
  - `id`
  - `product_id` → FK `products.id`
  - `uom`
  - `area`
  - `distributor_price`
  - `moq`, `moq_uom`
  - `is_active`
  - Unique constraint on `(product_id, uom, area)`.

### 1.5 Distributors & Orders

- **Table**: `distributor_profiles`
  - Identity and business profile of each distributor.

- **Table**: `applications`
  - Distributor registration applications and status.

- **Table**: `orders`
  - High-level order information (distributor, status, totals).

- **Table**: `order_items`
  - Line items referencing `orders` and `products`.

### 1.6 Analytics

- **Table**: `catalog_exports`
  - User, time, product count, filters for each catalog export.

- **View**: `distributor_order_analytics`
  - Aggregated orders by status, distributor, region, etc.

- **View**: `export_analytics`
  - Aggregated catalog export statistics.

## 2. Relationships (Textual ERD)

- `products` 1—* `product_variants`
- `products` 1—* `regional_pricing`
- `products` 1—* `uom_conversions`
- `products` 1—* `uom_pricing`
- `products` 1—* `order_items`
- `distributor_profiles` 1—* `orders`
- `orders` 1—* `order_items`
- `distribution_areas` 1—* `regional_pricing` (by area code/name)
- `users (auth.users)` 1—1 `distributor_profiles` (logical)

## 3. Notes

- Exact field lists and constraints should be validated against migrations like:
  - UOM: `20251008000001_create_uom_tables.sql`.
  - Analytics: `20251010000001_create_analytics_tables.sql`.
- RLS policies are defined in SQL migration or separate security scripts and must be part of the ERD conversation for security-aware design.
