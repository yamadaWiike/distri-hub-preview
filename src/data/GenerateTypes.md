# Generate TypeScript Types from Supabase Schema

This script helps generate accurate TypeScript types from your Supabase database schema.
This will solve many of the TypeScript issues we're encountering with the current implementation.

## Prerequisites

1. Node.js installed
2. Supabase project set up
3. Supabase CLI installed

## Steps to Generate Types

1. Install the Supabase CLI if not already installed:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Generate the types:
   ```bash
   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
   ```

4. Update the Database interface in `types.ts` with the generated types:
   ```typescript
   import { Database as GeneratedDatabase } from './supabase';
   
   export type Database = GeneratedDatabase;
   ```

5. Use the generated types in your components:
   ```typescript
   import { Database } from '@/types/supabase';
   
   type Brand = Database['public']['Tables']['brands']['Row'];
   ```

## Temporary Workaround

Until proper types are generated, we can use the following approaches:

1. Use type assertions for insert/update operations:
   ```typescript
   await supabase
     .from('brands')
     .insert({ name: brandName } as unknown as any);
   ```

2. Use explicit type casting for returned data:
   ```typescript
   const { data } = await supabase.from('brands').select('*');
   const typedData = data as unknown as Brand[];
   ```

3. Create a custom database API wrapper that handles type issues internally

## Example Database Table Creation

If you need to create the brands table, here's the SQL:

```sql
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on the name column for faster lookups
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands (name);
```

You can run this SQL in the SQL Editor in the Supabase dashboard.
