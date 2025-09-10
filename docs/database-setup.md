# Database Setup Guide

This guide explains how to set up and populate the Supabase database for the Baskit Distributor Hub application.

## Prerequisites

1. A Supabase project
2. Service key for the Supabase project
3. Node.js and npm installed

## Environment Setup

Create a `.env` file in the root of your project with the following variables:

```
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_KEY="your-service-key"
```

The `SUPABASE_SERVICE_KEY` should be the service role key from your Supabase project settings.

## Create Database Tables

Run the migration script to create all required tables:

```bash
npm run db:migrate
```

This will:
1. Read all SQL files in the `supabase/migrations` directory
2. Apply them to your Supabase project in sequence
3. Set up tables for:
   - Distributor profiles
   - SKUs (products)
   - Region pricing
   - Orders and order items

## Seed Sample Data

To populate the database with sample data:

```bash
npm run db:seed
```

This will add:
- Sample products (SKUs)
- Region-specific pricing
- (Optional) Sample distributor profiles and orders

## Row Level Security (RLS)

The migrations include Row Level Security policies that:
- Allow distributors to view their own profiles and orders
- Allow admins to view and manage all profiles, orders, and products
- Allow anyone to view the product catalog

## Admin Setup

To create an admin user:

1. Register a user with email `rudy@baskit.app` (or another email defined in your admin list)
2. Run the following SQL in the Supabase SQL Editor:

```sql
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  raw_app_meta_data, 
  '{role}', 
  '"admin"'
)
WHERE email = 'rudy@baskit.app';
```

This adds the admin role claim to the user's JWT token.

## Troubleshooting

If you encounter database connection issues:

1. Check your environment variables are correct
2. Ensure your Supabase project is active
3. Verify that the migrations ran successfully by checking the tables in the Supabase dashboard
4. Confirm that RLS policies are not blocking your application's access to data
