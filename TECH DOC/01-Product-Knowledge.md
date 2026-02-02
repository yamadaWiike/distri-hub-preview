# Product Knowledge – Baskit Distributor Hub

## 1. Product Definition
- **Name**: Baskit Distributor Hub
- **Domain**: FMCG distributor enablement (Indonesia focus)
- **Purpose**: Digital portal for official distributors to browse SKUs, see regional pricing, simulate profit, and manage registration/onboarding.

## 2. Primary User Personas
- **Prospective Distributor**
  - Needs: See product catalog, pricing per province/area, understand margins before signing.
  - Key Journeys: Browse catalog → Filter by region/brand → Simulate profit → Register as distributor.

- **Active Distributor**
  - Needs: Always-updated catalog, accurate UOM-based pricing, easy order/cart management, exportable product lists.
  - Key Journeys: Login → Filter catalog → Build cart with multiple UOMs and mixed variants → Export catalog as PDF → Share/export analytics.

- **Admin / Baskit Ops**
  - Needs: Manage SKUs, UOM rules, regional pricing, variants, RLS policies, and analytics.
  - Key Journeys: Login as admin → Manage products/UOM/pricing → Approve distributor applications → Review analytics dashboards.

## 3. Core Value Propositions
- Central, single source of truth for SKUs, variants, and pricing per region.
- Accurate profit and margin simulation using live pricing + UOM conversions.
- Streamlined distributor onboarding and approval workflow.
- Exportable PDF catalog for offline/field sales usage.
- Secure access with Supabase auth and role-based restrictions.

## 4. High-Level Capabilities (from codebase)
- **Catalog & Product Browsing**
  - React pages under `src/pages/products` and components under `src/components` expose a searchable, filterable product list.
  - Uses `product-service.ts` to map raw Supabase rows into rich `Product` objects with regions, variants, and UOM metadata.

- **UOM (Unit of Measure) System**
  - Fully implemented multi-UOM system with `uom_units`, `uom_conversions`, and `uom_pricing` tables.
  - Frontend SKU manager supports configuration of base UOM, MOQ UOM, pricing UOM, and conversion factors.

- **Regional Pricing & Distribution Areas**
  - Region-aware pricing through tables like `regional_pricing` and `distribution_areas` described in docs/database-setup.md and product-service.
  - Users select an area/province to get localized price lists.

- **Distributor Registration & Profiles**
  - Profiles and applications tables with RLS rules so distributors only see their own profile and orders.
  - Admins can view and approve profiles; security docs show RLS fixes for distributor profiles.

- **Cart & Ordering**
  - Cart context and hooks (`CartContext`, `use-cart.ts`) support multi-UOM quantities, SKU-level MOQs, and optional mix-variant constraints.

- **Analytics**
  - Catalog export and order analytics via dedicated tables and views (`catalog_exports`, `distributor_order_analytics`, `export_analytics`).
  - Frontend dashboards use `utils/analytics.ts` and `use-analytics.ts`.

## 5. Non-Functional Characteristics
- **Performance**: Vite + React 18 with code-splitting and optimized bundles; Cloudflare/Vercel ready.
- **Security**: Strong RLS on Supabase, auth guards on frontend, protected routes, and hardened API access patterns.
- **Scalability**: Multi-host deployment support (Vercel, Cloudflare Pages, static hosting); modular React architecture.
- **Localization**: Primary language Indonesian, with language context and switches.

## 6. Product Boundaries
- Out of scope for this app:
  - Full order fulfillment and logistics (warehouse, shipment tracking) – assumed to be handled downstream.
  - Deep ERP integration – only basic analytics and export surfaces exists.
  - Complex B2B contract/pricing negotiation – pricing is configured as static or semi-static tables per region.
