# Analytics Database Migration

This migration adds the necessary tables and views for tracking catalog exports and analyzing order data.

## Tables Added

### catalog_exports

Tracks whenever a distributor exports a product catalog as PDF. Each record includes:

- User ID who performed the export
- Timestamp of the export
- Number of products in the export
- Area filter used (if any)
- Brand filter used (if any)
- Price range used for filtering

### Updates to orders table

The following fields are added to the existing orders table:

- `order_number`: A friendly identifier for orders
- `payment_status`: Status of payment (unpaid, partially_paid, paid)
- `payment_method`: Method used for payment
- `distributor_id`: Direct reference to distributor profile
- `notes`: Additional order notes

## Views Added

### distributor_order_analytics

Provides aggregated order statistics by distributor and status, including:

- Total order count by status
- Total order value
- First and latest order dates

### export_analytics

Provides aggregated export statistics by user, including:

- Total export count
- Total products exported
- First and latest export dates
- Areas exported (as comma-separated list)

## How to Apply This Migration

This migration will be automatically applied when you run:

```bash
supabase db push
```

Or manually apply it with:

```bash
psql -f supabase/migrations/20251010000001_create_analytics_tables.sql
```

## Security

Row Level Security (RLS) policies are set up to ensure:

- Users can only see and create their own exports
- Users can only see their own orders
- Only admins can modify or delete exports
- Only admins can see all users' data

## Related Components

This database schema supports the following components:

1. `DistributorAnalytics.tsx` - Admin component showing export and order statistics
2. `DaftarProduk.tsx` - Contains the exportPDF function that logs catalog exports