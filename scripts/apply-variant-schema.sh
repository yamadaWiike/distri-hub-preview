#!/bin/bash
# Script to apply the variant schema updates to Supabase

# Exit on error
set -e

echo "Applying variant schema updates..."
supabase db run --file ./supabase/migrations/20250917000001_variant_schema_updates.sql

echo "Schema updates have been applied successfully!"
