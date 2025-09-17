#!/bin/bash
# Script to apply the database view fixes to Supabase

# Exit on error
set -e

echo "Creating products_with_variants view..."
supabase db run --file ./supabase/migrations/20250916000001_products_with_variants_view.sql

echo "Creating variants_view view..."
supabase db run --file ./supabase/migrations/20250916000002_variants_view.sql

echo "Database views have been created successfully!"
