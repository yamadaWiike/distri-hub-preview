#!/bin/bash

# Apply UOM (Unit of Measure) tables migration
echo "Applying UOM tables migration..."

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI not found. Please install it first."
    echo "Visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Apply the migration
echo "Running migration: 20251008000001_create_uom_tables.sql"
supabase db reset --local

# Check if migration was successful
if [ $? -eq 0 ]; then
    echo "✅ UOM tables migration applied successfully!"
    echo ""
    echo "The following tables have been created:"
    echo "  - uom_units (available units of measure)"
    echo "  - uom_conversions (conversion factors between units)"
    echo "  - uom_pricing (UOM-specific pricing per area)"
    echo ""
    echo "The products table has been updated with UOM fields:"
    echo "  - base_uom"
    echo "  - moq_uom" 
    echo "  - pricing_uom"
    echo "  - enable_uom_conversions"
    echo ""
    echo "Default UOM units have been inserted: pcs, box, carton, kg, gram, liter, ml, dozen, pack, bottle"
else
    echo "❌ Migration failed. Please check the error above."
    exit 1
fi