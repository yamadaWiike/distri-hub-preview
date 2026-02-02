# Tech Stack – Baskit Distributor Hub

## 1. Frontend
- **Language**: TypeScript
- **Framework**: React 18
- **Build Tool**: Vite
- **UI Library**: shadcn-ui (Radix UI primitives) + Tailwind CSS
- **Routing**: React Router (via pages directory and route components)
- **State Management**: React Context + custom hooks (`use-auth`, `use-cart`, `use-language`, etc.)
- **Forms & Validation**: React Hook Form + Zod (as referenced in README)
- **HTTP / API Client**: Supabase client directly + Axios where needed
- **Icons**: Lucide React
- **Maps**: Leaflet (for location visualization where required)

## 2. Backend & Data
- **Backend-as-a-Service**: Supabase
  - Authentication (email/password, JWT, roles via `raw_app_meta_data`)
  - Postgres database
  - Row Level Security
  - Storage for assets (where used)
- **Database Schema Management**:
  - SQL migrations under `supabase/migrations`.
  - Helper scripts under `scripts/` (`apply-db-fixes.sh`, `apply-uom-migration.mjs`, etc.).

## 3. Infrastructure & Deployment
- **Build & Deploy**:
  - npm / pnpm scripts for build (`npm run build`, `npm run build:vercel`, `npm run build:cloudflare`).
  - PM2 configuration via `ecosystem.config.cjs` for traditional server deployment.
- **Hosting Targets**:
  - Vercel (configured via `vercel.json`).
  - Cloudflare Pages (configured via `wrangler.toml` and headers in `config/headers.json`).
  - General static hosting (any provider that can serve the `dist` folder).

## 4. Security & Tooling
- **Security**:
  - Supabase RLS and policies documented in security docs.
  - Frontend auth guards (`auth-guards.ts`, `ProtectedRoute.tsx`, `use-secure-api.tsx`).
  - API security guidelines in `docs/API_SECURITY.md`.
- **Linting & Formatting**:
  - ESLint with configs in `eslint.config.js` / `.eslintrc.js`.
- **Task Automation**:
  - PowerShell and shell scripts for database setup, migrations, security tests, and deployment.

## 5. Analytics & Monitoring
- **Analytics**:
  - Custom Supabase-based analytics via `catalog_exports`, `distributor_order_analytics`, and `export_analytics`.
  - Frontend integration through `utils/analytics.ts` and `use-analytics.ts`.
- **Optional Tools**:
  - `use-hotjar.ts` hook suggests optional integration with Hotjar for UX analytics.

## 6. External Integrations
- **Web3Forms** for contact form submissions.
- **S3-compatible storage** for product images via `lib/s3-upload`.
