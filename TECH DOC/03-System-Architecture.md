# System Architecture – Baskit Distributor Hub

## 1. High-Level Overview

The Baskit Distributor Hub is a **React 18 + Vite** single-page application backed by **Supabase** for authentication, database, RLS, and analytics. It is designed to be deployed as a static frontend on platforms like Vercel or Cloudflare Pages.

### Core Layers
- **Client/UI Layer** (React + shadcn-ui + Tailwind in `src/`)
- **Service & Integration Layer** (`src/services`, `src/integrations/supabase`, `src/utils`)
- **Data Layer** (Supabase Postgres with migrations in `supabase/migrations` and helper scripts in `scripts/`)
- **Security Layer** (Supabase RLS, auth guards, protected routes, secure hooks, security docs).

## 2. Frontend Architecture

### 2.1 Application Composition
- **Entry Points**: `main.tsx`, `App.tsx` set up routing, contexts, and global providers.
- **Pages** (`src/pages`):
  - `home`, `about`, `contact`, `auth`, `products`, `orders`, `profile`, `admin` subtrees.
- **Components** (`src/components`):
  - `admin/`: SKU manager, analytics dashboards, pricing/UOM configuration UIs.
  - `cart/`: Cart and checkout-like flows.
  - `layout/`: Shared layout, navigation, header/footer.
  - `auth/`: Login, registration, ProtectedRoute components.
  - `ui/`: shadcn-ui primitives.

### 2.2 State Management
- **Contexts** (`src/contexts`):
  - `AuthContext`: Auth state, user role, approval status.
  - `CartContext`: Cart items, aggregated totals, UOM-aware quantities.
  - `LanguageContext`: Current locale, translations.

- **Hooks** (`src/hooks`):
  - `use-auth`, `use-cart`, `use-language`, `use-secure-api`, `use-analytics`, etc.
  - Encapsulate business rules (e.g., when API can be called, cart constraints).

### 2.3 Services & Utilities
- **Product Service** (`src/services/product-service.ts`):
  - Responsible for fetching products, variants, regional pricing, and mapping DB rows into rich `Product` objects (`mapDBProductToProduct`).
  - Uses the shared `supabase` client (`integrations/supabase/client.ts`).

- **Utilities** (`src/utils`):
  - `auth-guards.ts`: `requireAuth`, `requireAdmin`, `requireAuthForViewing`, `validateAuth`, etc.
  - `analytics.ts`: Tracking catalog exports and analytics-related helpers.
  - `mixVariants.ts`, `catalog`, `pdf-utils.ts`: Business rules for mixed variants and catalog PDF generation.

## 3. Backend / Data Architecture

### 3.1 Supabase
- **Authentication**: Supabase Auth with custom roles via `raw_app_meta_data.role` (e.g., admin).
- **Database**: Postgres with schemas for:
  - Products (`products`, `product_variants`, `variants_view`, etc.).
  - Regional pricing (`regional_pricing`, `distribution_areas`).
  - Orders, order items, analytics tables (`catalog_exports`, `distributor_order_analytics`, `export_analytics`).
  - UOM system (`uom_units`, `uom_conversions`, `uom_pricing`).

- **Migrations**: SQL migration files under `supabase/migrations` (referenced in docs like `database-setup.md`, `uom-implementation.md`, `ANALYTICS.md`).

### 3.2 Database Access Pattern
- All direct DB access from the frontend goes through Supabase client:
  - `supabase.from(<table>).select(...).eq(...).insert(...).update(...)`.
- Product-related queries are centralized in `product-service.ts` for consistency and mapping logic.
- Views like `variants_view`, `distributor_order_analytics`, `export_analytics` are used for optimized reads.

## 4. Security Architecture

### 4.1 Frontend Security
- **Auth Guards**: `auth-guards.ts` ensures calls to services require appropriate auth (e.g., `requireAuth`, `requireAuthForViewing`, `requireAdmin`).
- **Protected Routes**: Components in `src/components/auth/ProtectedRoute.tsx` handle:
  - `<ProtectedRoute>` for general auth.
  - `<AdminRoute>` for admin-only.
  - `<ApprovedRoute>` for approved distributors.
  - `<RoleBasedRoute>` for custom roles.

- **Secure API Hooks**: `use-secure-api.tsx` wraps service calls with authorization checks and error handling.

### 4.2 Backend Security
- **Row Level Security (RLS)**: Implemented on key tables:
  - Distributors can see only their own profiles and orders.
  - Admins can see/modify all.
  - Product catalog is publicly or broadly readable (according to policies) while admin-only operations are restricted.
- **RLS Fix Docs**: `DISTRIBUTOR_PROFILES_RLS_SECURITY_FIX.md`, `PRODUCTS_RLS_SECURITY_FIX.md` describe hardening steps.

## 5. Deployment Architecture

- **Static Frontend**: Built with `npm run build` / `npm run build:vercel` / `npm run build:cloudflare`.
- **Hosting Targets**:
  - Vercel via `vercel.json`.
  - Cloudflare Pages via `wrangler.toml` and headers config.
  - General static hosting compatible.
- **PM2 / Traditional Server**: Optional Node/PM2 deployment using `ecosystem.config.cjs` and `deploy.sh`.

## 6. Integration Points

- **Supabase**: Primary backend for auth, DB, and RLS.
- **Web3Forms**: For contact forms and simple form submissions.
- **S3-like Storage**: Used via `getImageUrl` (`lib/s3-upload`) for product images.
- **Analytics Visualization**: Internal React components using Supabase views; no heavy external BI dependency.
