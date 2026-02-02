# Application Flows – Baskit Distributor Hub

This document describes key user and system flows as implemented in the codebase.

## 1. User Authentication & Role Flow

1. User accesses the app (SPA) via browser.
2. If unauthenticated and trying to access protected route:
   - `ProtectedRoute` / `AdminRoute` / `ApprovedRoute` checks auth state from `AuthContext`.
   - If not logged in, user is redirected to the login page.
3. After successful login via Supabase:
   - `AuthContext` receives user and role metadata (including `role` from `raw_app_meta_data`).
   - Guards now allow access depending on role (`distributor`, `admin`, etc.).
4. If user is authenticated but not yet approved:
   - `ApprovedRoute` denies access and shows “approval pending” messaging.

## 2. Distributor Registration & Approval Flow

1. Prospective distributor visits registration/onboarding pages.
2. User submits registration form, creating a profile and possibly an application row in Supabase.
3. RLS ensures only that user and admins can see the application.
4. Admin logs into admin section (protected by `AdminRoute`).
5. Admin reviews pending applications and sets an approved flag/role.
6. Upon approval, subsequent auth checks consider the user as approved and grant full distributor access.

## 3. Product Catalog Browsing Flow

1. Approved distributor navigates to Products page (e.g., `src/pages/products`).
2. Page uses hooks and product-service to:
   - Determine current region/area (from user choice or default).
   - Fetch product list, variants, and regional pricing from Supabase.
3. `product-service.ts`:
   - Queries `products` plus joins to brands, categories, variants, and regional_pricing.
   - Uses `mapDBProductToProduct` to produce unified `Product` objects with variants and region arrays.
4. UI presents:
   - Filters (area, brand, category, search).
   - Product cards/rows showing UOM, base price, MOQs, and variant indicators.

## 4. UOM & Pricing Flow

1. Admin configures UOM tables via admin UI (using `SKUManager` components and Supabase CRUD):
   - Adds units in `uom_units`.
   - Creates conversion entries in `uom_conversions` for a product.
   - Configures per-UOM pricing per area in `uom_pricing`.
2. When user views catalog:
   - Product records include flags (`enable_uom_conversions`) and base/moq/pricing UOM fields.
   - Conversion factors and UOM pricing are pulled so that UI can show correct prices per chosen UOM.
3. When user changes UOM selection for a product in cart or catalog:
   - Quantities are converted via conversion factors.
   - Pricing is recalculated or looked up from `uom_pricing`.

## 5. Cart & Profit Simulation Flow

1. User adds items to cart using `CartContext` and cart components.
2. For each item, the following is captured:
   - Product reference (ID, SKU, name, base UOM).
   - Selected UOM and variant (if applicable).
   - Quantity and region/area.
3. Cart logic:
   - Validates MOQs and variant mixing rules using fields like `single_sku_moq`, `allow_mix_variants`, and region-level flags.
   - Calculates line totals and aggregates cart totals.
   - Uses pricing from `product-service` outputs and/or UOM pricing tables.
4. Profit simulation:
   - Uses distributor price vs. reference/retail price to compute estimated margin and profit.
   - May use helper functions in `utils` for formatting and calculation.

## 6. Catalog Export & Analytics Flow

1. User filters catalog (area, brand, etc.) and triggers “Export to PDF”.
2. Frontend uses `pdf-utils.ts` and catalog utilities to:
   - Build a structured array of products with current filters applied.
   - Render PDF (via client-side PDF tools) and trigger download.
3. At the same time, analytics tracking runs:
   - `utils/analytics.ts` function `trackCatalogExport` is called.
   - It writes an entry to `catalog_exports` with user ID, product count, filters, etc.
4. Admin views analytics dashboard (`DistributorAnalytics` or similar component):
   - Queries Supabase views `distributor_order_analytics` and `export_analytics`.
   - Renders charts/tables with totals, time-series, and regional distributions.

## 7. Error & Security Flows

- If a secure API call is made without valid auth:
  - `requireAuth` or `requireAuthForViewing` throws; `use-secure-api` catches and displays a friendly message.
- If an admin-only operation is called by a non-admin user:
  - `requireAdmin` throws and the frontend shows an “Admin required” message.
- RLS at the database level ensures that even if a frontend bug occurs, unauthorized users cannot read/write restricted rows.
