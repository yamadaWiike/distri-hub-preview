# Database and Code Fixes

## Overview

This document explains the changes made to fix two issues in the application:

1. 404 error when accessing the `products_with_variants` view
2. 406 error when using a UUID to fetch a product instead of its SKU

## Database Fixes

We've added two SQL migration files to create the missing views:

1. `20250916000001_products_with_variants_view.sql` - Creates the `products_with_variants` view
2. `20250916000002_variants_view.sql` - Creates the `variants_view` view

These views allow for querying products with their variants in a more convenient way.

## Code Fixes

### 1. Enhanced `fetchProductBySku` Function

We've updated the `fetchProductBySku` function in `src/lib/db.ts` to:

- Accept either a SKU string or a UUID as input
- First try to look up a product by its SKU
- If that fails and the input looks like a UUID, try looking it up by ID
- Handle variant fetching from either the view or directly from the tables

### 2. Added Proper Type Definitions

- Added `VariantRecord` interface to handle database variant responses
- Updated the `ProductRecord` interface to include the `has_variants` field
- Added proper type assertions to prevent TypeScript errors

## How to Apply the Fixes

### Database Fixes

Run the following command to apply the database view fixes:

```bash
./scripts/apply-db-fixes.sh
```

Alternatively, you can apply the migrations manually using the Supabase CLI:

```bash
supabase db run --file ./supabase/migrations/20250916000001_products_with_variants_view.sql
supabase db run --file ./supabase/migrations/20250916000002_variants_view.sql
```

### Code Fixes

The code fixes have already been applied to the codebase. No additional action is required.

## Notes

- The application now works with both product SKUs and UUIDs
- If both views are missing, the code will fall back to direct table queries
- All error handling has been improved to provide more informative logs

For any questions or issues, please contact the development team.
