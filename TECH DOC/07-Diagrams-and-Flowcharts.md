# Diagrams & Flowcharts – Baskit Distributor Hub

Textual diagram descriptions suitable for later visual modeling (e.g., Draw.io, Mermaid, Lucidchart).

## 1. Context Diagram (C1 – High Level)

Actors:
- Distributor User
- Admin User
- Supabase (Auth + DB)
- Web3Forms
- Storage (S3-compatible) for images

System: **Baskit Distributor Hub Web App** (SPA)

Interactions:
- Distributor ↔ Web App: login, browse products, manage cart, export catalogs.
- Admin ↔ Web App: manage SKUs/UOM/pricing, approve distributors, view analytics.
- Web App ↔ Supabase: auth, read/write products, pricing, orders, analytics.
- Web App ↔ Web3Forms: submit contact forms.
- Web App ↔ Storage: read product images.

## 2. Container Diagram (C2 – Main Components)

Containers:
1. **Browser Client (React SPA)**
2. **Supabase Services** (Auth + Postgres + RLS)
3. **Static Hosting** (Vercel/Cloudflare/other)
4. **Optional 3rd Party Services** (Web3Forms, Hotjar, S3 storage)

Data Flow:
- Browser → Hosting: downloads JS/CSS/HTML bundle.
- SPA → Supabase: authenticated API calls using JWT.
- SPA → Web3Forms: POST form submissions.
- SPA → Storage: GET product image URLs.

## 3. Component Diagram (Frontend)

Major components:
- `App.tsx`: Top-level routing and layout.
- Contexts: AuthContext, CartContext, LanguageContext.
- Feature trees under `src/pages` (home, products, orders, admin, etc.).
- Services: `product-service.ts` orchestrating Supabase data.
- Utilities: `auth-guards.ts`, `analytics.ts`, `pdf-utils.ts`, `mixVariants.ts`.

Flow:
- Routes render pages.
- Pages call hooks.
- Hooks call services and utils.
- Services call Supabase.

## 4. Sequence Diagrams (Textual)

### 4.1 Login and Access Protected Route
1. User → SPA: Open `/admin`.
2. SPA: `AdminRoute` checks `AuthContext`.
3. If not authenticated → redirect to `/login`.
4. User → Supabase via SPA: submit credentials.
5. Supabase → SPA: JWT + user profile.
6. SPA: updates `AuthContext` with role.
7. User re-enters `/admin` → passes `AdminRoute` check.

### 4.2 Browse Catalog and Add to Cart
1. User → SPA: Open `/products`.
2. SPA → Supabase via `product-service`: fetch products + variants + regional pricing.
3. Supabase → SPA: product data.
4. SPA: render product list.
5. User selects UOM, variant, quantity and clicks “Add to Cart”.
6. SPA (CartContext): validates MOQs and mix-variant rules.
7. SPA: updates cart state and recalculates totals/profit.

### 4.3 Export Catalog to PDF with Analytics
1. User sets filters and presses “Export PDF”.
2. SPA: builds product list from current view.
3. SPA: generates PDF via `pdf-utils.ts` and triggers download.
4. SPA: calls `trackCatalogExport` from `utils/analytics.ts`.
5. `trackCatalogExport` → Supabase: insert into `catalog_exports`.
6. Supabase: record export event.

## 5. Flowcharts (Logical)

### 5.1 Auth Guard Flow
- Start → Is user authenticated?
  - No → Redirect to login.
  - Yes → Is route admin-only?
    - Yes → Is user admin?
      - No → Show access denied.
      - Yes → Allow route.
    - No → Is route approved-only?
      - Yes → Is user approved?
        - No → Show approval pending.
        - Yes → Allow route.
      - No → Allow route.

### 5.2 UOM Pricing Flow
- Start → Product has `enable_uom_conversions`?
  - No → Use base/pricing UOM only.
  - Yes → Load `uom_conversions` and `uom_pricing` for product + area.
    - User selects UOM.
    - If direct price exists in `uom_pricing` → use it.
    - Else → derive price from base using `conversion_factor`.

These textual diagrams can be converted into visual diagrams (Mermaid, Draw.io, etc.) as needed.
