# Baskit Analytics Implementation

This document explains the analytics tracking implementation for catalog exports and order statistics in the Baskit distributor hub.

## Overview

The analytics system tracks:

1. **Catalog Exports** - When distributors generate PDF catalogs
2. **Order Statistics** - Status and distribution of orders

## Technical Implementation

### Database Schema

The database schema is defined in the migration script `20251010000001_create_analytics_tables.sql` which creates:

- `catalog_exports` table - Records catalog export events
- Updates to the `orders` table - Adds fields for better analytics
- `distributor_order_analytics` view - Aggregates order statistics 
- `export_analytics` view - Summarizes export data

### Analytics Helper Module

The `utils/analytics.ts` file contains helper functions and type definitions:

```typescript
// Import in components that need analytics
import { trackCatalogExport } from "@/utils/analytics";

// To track a catalog export
await trackCatalogExport(
  userId,
  filteredProducts.length,
  area,
  brand,
  priceRange
);
```

### Components Using Analytics

1. **DaftarProduk.tsx** - Tracks catalog exports when PDFs are generated
   - Uses the `trackCatalogExport` helper function

2. **DistributorAnalytics.tsx** - Displays analytics data
   - Shows export statistics and order distribution
   - Uses the database views to aggregate data

## Visualization

The analytics dashboard shows:

- Total exports with weekly/monthly trends
- Regional distribution of exports
- Order status distribution

## Security Considerations

- Row-Level Security (RLS) ensures users only see their own data
- Only admins can access aggregate analytics data
- All tracking respects user privacy

## Future Enhancements

Possible improvements:

- Export filtering by date range
- More detailed order analytics
- User engagement metrics
- Product popularity analytics
- Export to CSV/Excel functionality