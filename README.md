
# Baskit Distributor Hub

**Platform distributor GT Baskit:** katalog produk, harga, MOQ, dan pendaftaran distributor.

## Project Overview

Baskit Distributor Hub adalah portal resmi untuk distributor FMCG di Indonesia. Platform ini memudahkan distributor untuk:

- 📦 Menjelajahi katalog produk lengkap dengan sistem UOM (Unit of Measure)
- 🌍 Melihat harga khusus per wilayah/provinsi
- 📊 Simulasi keuntungan dan margin dengan perhitungan profit otomatis
- 📝 Mendaftar sebagai distributor resmi
- 📞 Menghubungi tim Baskit untuk onboarding dan dukungan
- 🛒 Sistem keranjang belanja dengan dukungan mixed variants
- 📋 Export katalog produk dalam format PDF

## Key Features

### Core Functionality
- **Katalog Produk**: Filter berdasarkan area dan harga regional
- **Sistem UOM**: Konversi unit otomatis (pieces, cartons, cases)
- **Mixed Variants**: Dukungan untuk produk dengan multiple varian
- **Simulasi Profit**: Perhitungan margin dan keuntungan real-time
- **Regional Pricing**: Harga berbeda per provinsi/wilayah distribusi

### User Experience
- **Responsive Design**: Optimized untuk desktop dan mobile
- **Multi-language**: Dukungan Bahasa Indonesia
- **Real-time Updates**: Data produk dan harga terkini
- **Secure Authentication**: Sistem login yang aman dengan Supabase

### Business Tools
- **Admin Dashboard**: Pengelolaan SKU dan aplikasi distributor
- **Export Catalog**: Generate katalog PDF dengan profit margins
- **Contact Forms**: Integrasi Web3Forms untuk komunikasi
- **FAQ & Support**: Comprehensive help system

## Environment Setup

This project uses environment variables to secure sensitive information. Follow these steps to set up your environment:

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in the required environment variables in the `.env` file:**
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous/public key  
   - `VITE_SUPABASE_PROJECT_ID`: Your Supabase project ID
   - `VITE_WEB3FORMS_ACCESS_KEY`: Web3Forms API key for contact forms

3. **Security Note:**
   - The `.env` file is ignored by Git to protect sensitive information
   - Never commit your actual environment variables to the repository
   - Use placeholder values in `.env.example` for documentation

## Technologies Used

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **UI Library**: shadcn-ui components with Radix UI primitives
- **Styling**: Tailwind CSS for responsive design
- **Backend**: Supabase (authentication, database, real-time)
- **State Management**: React Context API with custom hooks
- **Form Handling**: React Hook Form with Zod validation
- **HTTP Client**: Axios for API requests
- **Maps**: Leaflet for location visualization
- **PDF Generation**: Built-in catalog export functionality
- **Icons**: Lucide React icon library

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── admin/          # Admin dashboard components
│   ├── cart/           # Shopping cart components
│   ├── layout/         # Page layout components
│   └── ui/             # shadcn-ui components
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks
├── integrations/       # Third-party service integrations
├── lib/                # Utility libraries and configurations
├── pages/              # Application pages/routes
├── services/           # API and business logic services
├── types/              # TypeScript type definitions
└── utils/              # Helper functions
```

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
- **Node.js**: Version 18 or higher
- **npm** or **pnpm**: Package manager
- **Git**: Version control
- **Supabase Account**: For backend services

### Installation
```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd baskit-distributor-hub-25

# Install dependencies
npm install
# or
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your actual values

# Start development server
npm run dev
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development environment
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run db:migrate` - Apply database migrations
- `npm run db:seed` - Seed database with sample data

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
1. **Access the Application**
   - Open `http://localhost:5173` in your browser
   - Navigate through the product catalog

2. **Distributor Registration**
   - Daftar sebagai distributor untuk akses harga khusus
   - Complete business profile verification

3. **Product Exploration**
   - Jelajahi produk dengan filter regional
   - View UOM conversions and mixed variants
   - Simulasi margin dan keuntungan real-time

4. **Order Management**
   - Add products to cart with specific UOM
   - Calculate total with profit margins
   - Export catalog in PDF format

## Deployment

### Production Deployment
- Deploy via [Lovable](https://lovable.dev/projects/8f232d77-cc27-4788-bc81-f012c9ee4d08)
- Compatible with any Vite/React hosting platform (Vercel, Netlify, etc.)
- Includes `vercel.json` for Vercel deployment configuration

### Custom Domain Setup
Follow the [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide) guide untuk menghubungkan domain Anda.

### Environment Variables for Production
Ensure all environment variables are properly configured in your hosting platform:
- Set Supabase credentials
- Configure Web3Forms API key
- Verify all URLs and endpoints


## API Documentation

### Core Services
- **Product Service**: Handles product catalog and pricing
- **Auth Service**: User authentication and authorization  
- **Cart Service**: Shopping cart and UOM management
- **Region Service**: Geographic and pricing data

### Database Schema
Key tables include:
- `products`: Core product information
- `variants`: Product variants and options
- `regional_pricing`: Location-based pricing
- `distribution_areas`: Geographic coverage
- `applications`: Distributor registrations

## Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and test thoroughly
4. Commit with descriptive messages
5. Push to your fork and create a Pull Request

### Code Standards
- Follow TypeScript best practices
- Use ESLint configuration provided
- Maintain component structure consistency
- Document complex business logic
- Test UOM conversions and calculations

### Database Changes
- Create migration scripts in `/scripts` directory
- Document schema changes in `/docs`
- Test with sample data before deployment

## Contact & Support

### Getting Help
- **In-App Support**: Use the "Hubungi" page in the application
- **Technical Issues**: Check the Known Issues section below
- **Business Inquiries**: Contact through the distributor registration form

### Documentation
- Database setup guides in `/docs` directory
- Language support documentation available
- API integration examples in `/scripts`

## License

This project is proprietary software owned by Baskit. All rights reserved.

---

## About Baskit

Platform distribusi FMCG terdepan di Indonesia yang menghubungkan produsen dengan distributor untuk ekosistem perdagangan efisien dan menguntungkan.

**Misi:** Memudahkan akses distribusi produk FMCG berkualitas ke seluruh Indonesia dengan teknologi modern dan layanan terpercaya.

**Visi:** Menjadi platform distribusi FMCG nomor satu di Indonesia yang menghubungkan ribuan produsen dan distributor.

---

© 2025 Baskit. All rights reserved.
