
# Baskit Distributor Hub

**Platform distributor GT Baskit:** katalog produk, harga, MOQ, dan pendaftaran distributor.

## Project Overview

Baskit Distributor Hub adalah portal resmi untuk distributor FMCG di Indonesia. Platform ini memudahkan distributor untuk:

- Menjelajahi katalog produk lengkap
- Melihat harga khusus per wilayah/provinsi
- Simulasi keuntungan dan margin
- Mendaftar sebagai distributor resmi
- Menghubungi tim Baskit untuk onboarding dan dukungan

## Features

- Katalog produk dengan filter area dan harga regional
- Simulasi keuntungan distributor
- Pendaftaran distributor online

## Environment Setup

This project uses environment variables to secure sensitive information. Follow these steps to set up your environment:

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Fill in the required environment variables in the `.env` file:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous/public key
   - `VITE_SUPABASE_PROJECT_ID`: Your Supabase project ID

Note: The `.env` file is ignored by Git to protect sensitive information. Never commit your actual environment variables to the repository.
- Profil bisnis dan verifikasi
- Admin dashboard untuk pengelolaan SKU dan aplikasi distributor
- FAQ dan kontak support

## Technologies Used

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (auth & backend integration)

## Known Issues and TODOs

### TypeScript Errors with Supabase

There are currently some TypeScript issues in the `SKUManager.tsx` component related to Supabase type definitions. These issues occur because:

1. The type definitions don't exactly match the database schema
2. The Supabase client has strict typing that doesn't align with our use case

**Current solution:**
- We use targeted `@ts-expect-error` comments at specific points where TypeScript errors occur
- We've added custom type definitions for the database tables in `src/integrations/supabase/types.ts`

**Recommended long-term fix:**
- Generate accurate types from the Supabase schema:
  ```bash
  npx supabase gen types typescript --project-id <your-project-id>
  ```
- Update the Database interface in `src/integrations/supabase/types.ts` with the generated types
- Remove the `@ts-expect-error` comments once proper types are in place

## Getting Started

### Prerequisites
- Node.js & npm

### Installation
```sh
git clone <YOUR_GIT_URL>
cd baskit-distributor-hub-25
npm i
npm run dev
```

### Database Setup
This project includes several scripts to help set up and maintain the database:

1. **Apply Database View Fixes**
   ```sh
   ./scripts/apply-db-fixes.sh
   ```
   This script creates the necessary views for product data, including `products_with_variants` and `variants_view`.

2. **Apply Variant Schema Updates**
   ```sh
   ./scripts/apply-variant-schema.sh
   ```
   This script updates the database schema to support product variants, including creating tables for variant groups and options.

3. **Seed Variant Data**
   ```sh
   node scripts/seed-variants.js
   ```
   This script populates the database with sample variant data. Make sure you've applied the variant schema updates first.

### Usage
- Buka `http://localhost:5173` di browser
- Daftar sebagai distributor untuk akses harga khusus
- Jelajahi produk, simulasi margin, dan lakukan pendaftaran

## Deployment

Deploy via [Lovable](https://lovable.dev/projects/8f232d77-cc27-4788-bc81-f012c9ee4d08) atau hosting Vite/React standar.

## Custom Domain

Ikuti panduan [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide) untuk menghubungkan domain Anda.


## Contact & Support

Untuk bantuan dan FAQ, gunakan halaman Hubungi di aplikasi.

## About Baskit

Platform distribusi FMCG terdepan di Indonesia yang menghubungkan produsen dengan distributor untuk ekosistem perdagangan efisien dan menguntungkan.

**Misi:** Memudahkan akses distribusi produk FMCG berkualitas ke seluruh Indonesia dengan teknologi modern dan layanan terpercaya.

**Visi:** Menjadi platform distribusi FMCG nomor satu di Indonesia yang menghubungkan ribuan produsen dan distributor.

---

© 2025 Baskit. All rights reserved.
