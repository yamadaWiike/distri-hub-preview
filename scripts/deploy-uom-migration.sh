#!/bin/bash

# UOM Database Migration Deployment Script
# This script deploys the comprehensive UOM functionality to your Supabase database

set -e  # Exit on any error

echo "🚀 Starting UOM Database Migration Deployment..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ No supabase/config.toml found. Please initialize Supabase first:"
    echo "   supabase init"
    exit 1
fi

echo "📋 Migration files to be applied:"
echo "   1. 20251008000001_create_uom_tables.sql - Create UOM tables"
echo "   2. 20251008000002_integrate_uom_with_existing_schema.sql - Integrate with existing schema"

# Confirm deployment
read -p "🤔 Do you want to proceed with the migration? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled"
    exit 1
fi

echo "🔄 Applying UOM migration files..."

# Copy migration files to Supabase migrations directory
if [ ! -d "supabase/migrations" ]; then
    mkdir -p supabase/migrations
fi

# Apply the comprehensive integration migration
if [ -f "supabase/migrations/20251008000002_integrate_uom_with_existing_schema.sql" ]; then
    echo "✅ Migration file already exists in supabase/migrations/"
else
    echo "❌ Migration file not found. Please ensure the migration file is in supabase/migrations/"
    exit 1
fi

# Run the migration
echo "🔧 Running database migration..."
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ UOM migration completed successfully!"
    echo ""
    echo "🎉 Your database now has full UOM functionality including:"
    echo "   ✓ UOM units table with predefined units"
    echo "   ✓ UOM conversions for product-specific rates"
    echo "   ✓ UOM pricing with regional support"
    echo "   ✓ Enhanced products table with UOM columns"
    echo "   ✓ Enhanced region_pricing and order_items tables"
    echo "   ✓ Database views for easier querying"
    echo "   ✓ PostgreSQL functions for conversions"
    echo "   ✓ Row Level Security policies"
    echo ""
    echo "📖 Next steps:"
    echo "   1. Update your TypeScript types (already done)"
    echo "   2. Test the UOM functionality in your admin interface"
    echo "   3. Configure initial UOM units for your products"
    echo ""
    echo "📚 See docs/uom-implementation.md for detailed usage instructions"
else
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi