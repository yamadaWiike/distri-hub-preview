# Product Requirements – Baskit Distributor Hub

This document captures inferred functional and non-functional requirements based on the existing implementation and docs.

## 1. Functional Requirements

### 1.1 Authentication & Authorization
- FR-1: Users must be able to register and log in using Supabase authentication.
- FR-2: The system must distinguish roles at minimum: `distributor`, `admin`, and `pending`/unapproved.
- FR-3: Only authenticated and approved users can access core catalog and pricing data.
- FR-4: Only admin users can access admin routes, SKU management, UOM configuration, and analytics dashboards.
- FR-5: Route-level and API-level guards must enforce roles (see `auth-guards.ts`, `ProtectedRoute.tsx`).

### 1.2 Distributor Onboarding
- FR-6: Prospective distributors can submit registration details and create a distributor profile.
- FR-7: Admins can review and approve/reject distributor applications.
- FR-8: Pending distributors see an “approval pending” state and cannot use sensitive features.

### 1.3 Product Catalog & Browsing
- FR-9: Users can browse a list of products with key attributes (name, SKU, brand, category, size, UOM info).
- FR-10: Users can filter products by region/area, brand, category, and possibly search by keyword.
- FR-11: For each product, the system must show available variants, regional pricing, and applicable MOQs.
- FR-12: Catalog listing must support mixed variants, where allowed per product/region.
- FR-13: Product data must be sourced from Supabase tables and views (e.g., products, variants, regional_pricing, variants_view).

### 1.4 UOM & Pricing
- FR-14: Each product must have base UOM, MOQ UOM, pricing UOM, and a flag to enable/disable UOM conversions.
- FR-15: The system must support defining conversion factors between units per product (e.g., pcs ↔ box ↔ carton).
- FR-16: The system must support UOM-specific pricing per distribution area (table `uom_pricing`).
- FR-17: MOQs and pricing must be correctly translated across UOMs using conversion factors.

### 1.5 Cart & Order Preparation
- FR-18: Users can add products (with selected UOM and variant) into a shopping cart.
- FR-19: The cart must calculate totals and margin/profit estimates in real-time using the latest pricing.
- FR-20: The system should enforce minimum quantities and rules for mixing variants if defined (single_sku_moq, allow_mix_variants, region-level flags).

### 1.6 Catalog Export & Analytics
- FR-21: Users can generate a PDF catalog export of the current filtered product list.
- FR-22: Each export event is recorded into `catalog_exports` with relevant metadata (user, filters, counts).
- FR-23: Analytics dashboards must show total exports, trends, regional distribution, and order status breakdowns.
- FR-24: Admins can view aggregate analytics; regular distributors can only see their own export/order analytics.

### 1.7 Localization
- FR-25: The UI must support at least Bahasa Indonesia, with the ability to add more locales.
- FR-26: Language selection must persist per user/session (via `LanguageContext`).

### 1.8 Security & Compliance
- FR-27: RLS in Supabase must ensure users only see their own profiles, orders, and analytics where appropriate.
- FR-28: Product catalog is broadly readable, but sensitive admin operations require elevated permissions.

## 2. Non-Functional Requirements

### 2.1 Performance
- NFR-1: Catalog pages should load within a reasonable time under typical distributor catalog sizes (optimized via views and efficient product-service queries).
- NFR-2: PDF export should complete within a few seconds for typical product sets.

### 2.2 Reliability & Integrity
- NFR-3: Database migrations must be reproducible via `npm run db:migrate` and associated shell/Node scripts.
- NFR-4: Seed operations must be idempotent enough for development/test environments (`npm run db:seed`).

### 2.3 Security
- NFR-5: All protected APIs must pass through `requireAuth` or similar guards at the service layer.
- NFR-6: Frontend must use ProtectedRoute wrappers for all admin and sensitive pages.

### 2.4 Maintainability
- NFR-7: Codebase follows modular structure (components, services, utils, contexts, hooks) with TypeScript types under `src/types` and Supabase types under `src/integrations/supabase/types.ts`.
- NFR-8: Naming conventions and path aliases (`@/…`) must remain consistent to support refactoring.

## 3. Open / Future Requirements (from docs)
- FR-Future-1: Extended analytics (product popularity, engagement metrics, export to CSV/Excel).
- FR-Future-2: More complex dynamic pricing (time-based, quantity-based) in the UOM system.
- FR-Future-3: Integration with additional auth hardening (2FA, IP whitelisting, rate limiting).
- FR-Future-4: Enhanced reporting dashboards for admin users.
