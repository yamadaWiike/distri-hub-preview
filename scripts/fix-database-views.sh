#!/bin/bash

# Script to apply database views directly to the Supabase instance
# This script applies the necessary database views for the variant system
# to work properly with our application.

echo "Applying database views to fix API access issues..."

# Get the Supabase project info
PROJECT_ID="sahllcduqzfvhiohgpro"
PROJECT_URL="https://sahllcduqzfvhiohgpro.supabase.co"

# Check if SUPABASE_KEY is set in environment
if [ -z "$SUPABASE_KEY" ]; then
  echo "ERROR: SUPABASE_KEY environment variable not set"
  echo "Please set your Supabase service role key with: export SUPABASE_KEY=your_service_role_key"
  exit 1
fi

# Create products_with_variants view
echo "Creating products_with_variants view..."
curl -X POST "$PROJECT_URL/rest/v1/rpc/exec_sql" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "query": "CREATE OR REPLACE VIEW products_with_variants AS SELECT p.id, p.sku, pc.name as category, b.name as brand, p.name, p.size, p.base_distributor_price as distributor_price, p.consumer_price, p.base_moq as moq, p.description, p.image_url as image, p.has_variants, COALESCE((SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = p.id AND pv.is_active = TRUE), 0) as variant_count FROM products p LEFT JOIN brands b ON p.brand_id = b.id LEFT JOIN product_categories pc ON p.category_id = pc.id;"
  }'

# Create variants_view
echo "Creating variants_view..."
curl -X POST "$PROJECT_URL/rest/v1/rpc/exec_sql" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "query": "CREATE OR REPLACE VIEW variants_view AS SELECT pv.id, pv.product_id, p.name as product_name, vo.name as group_name, vov.value as option_name, pv.additional_price, pv.is_active FROM product_variants pv JOIN products p ON pv.product_id = p.id JOIN product_variant_options pvo ON pvo.variant_id = pv.id JOIN variant_options vo ON pvo.option_id = vo.id JOIN variant_option_values vov ON pvo.option_value_id = vov.id;"
  }'

# Check if views were created successfully
echo "Verifying views were created..."
curl -X POST "$PROJECT_URL/rest/v1/rpc/exec_sql" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "query": "SELECT table_name FROM information_schema.views WHERE table_schema = '\''public'\'' AND table_name IN ('\''products_with_variants'\'', '\''variants_view'\'');"
  }'

echo "Database views updated successfully!"
echo "You may need to restart your application for changes to take effect."
