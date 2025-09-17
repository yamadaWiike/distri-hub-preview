# Product and Variants Import Script

This script imports products, variants, brands, categories, and regional pricing data from a CSV file into your Supabase database.

## Features

- Handles non-unique SKU IDs
- Maintains proper relationships between products, variants, and regions
- Imports product images from Drive links
- Creates brands and categories as needed
- Handles various numeric formats with commas
- Preserves regional pricing variations

## Prerequisites

1. Node.js and npm installed
2. Supabase project set up with the appropriate tables:
   - `products`
   - `product_variants`
   - `region_pricing`
   - `brands`
   - `product_categories`

## Setup

1. Create a `.env` file in the project root with your Supabase credentials:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

2. Make sure your CSV file is placed in the `/data` directory with the name `products-list.csv`

## Running the Script

```bash
# Compile TypeScript
npx tsc scripts/inject-products-variants.ts --esModuleInterop --resolveJsonModule

# Run the compiled script
node scripts/inject-products-variants.js
```

## CSV Format

The script expects a CSV file with the following columns:

- `SKU ID`: Product SKU (can be non-unique)
- `Category`: Product category name
- `Brand`: Brand name
- `Product Name`: Name of the product
- `Size`: Size or weight of the product
- `Variants`: Variant name (if applicable)
- `Distribution Area`: Region name
- `Distributor Price (Ctn)`: Price per carton for distributors
- `Distributor Price (Pcs)`: Price per piece for distributors
- `Consumer Price (Ctn)`: Price per carton for consumers
- `Consumer Price (Pcs)`: Price per piece for consumers
- `Pcs per Ctn`: Number of pieces per carton
- `MOQ`: Minimum order quantity
- `Product Picture`: URL to product image

## Database Structure

The script will create:

1. One product record per unique SKU + Product Name + Size combination
2. One variant record per unique variant name for each product
3. One region pricing record per distribution area for each product
4. Brand and category records as needed

## Troubleshooting

If you encounter errors:

1. Check that your database tables match the expected schema
2. Verify that your Supabase credentials are correct
3. Make sure the CSV file is properly formatted
4. Look for console error messages for specific import failures
