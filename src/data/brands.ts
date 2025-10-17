// This file contains brand data types and utility functions
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export type Brand = {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  created_at?: string;
  updated_at?: string;
};

// Cache for brand names to avoid repeated lookups
const brandCache: Record<string, string> = {};

/**
 * Function to get a brand name by ID
 * Uses a cache to avoid repeated lookups for the same ID
 */
export async function fetchBrandName(brandId: string): Promise<string> {
  // Check cache first
  if (brandCache[brandId]) {
    return brandCache[brandId];
  }
  
  try {
    // Fetch from the brands table
    const { data, error } = await supabase
      .from('brands')
      .select('name')
      .eq('id', brandId)
      .single();
    
    if (error) {
      console.error('Error fetching brand name:', error);
      return 'Unknown Brand';
    }
    
    if (data) {
      // Cache the result
      const brandData = data as { name: string };
      brandCache[brandId] = brandData.name;
      return brandData.name;
    }
    
    return 'Unknown Brand';
  } catch (error) {
    console.error('Error in brand lookup:', error);
    return 'Unknown Brand';
  }
}

/**
 * Get brand name synchronously from cache
 * Use this when you already have the brands loaded
 */
export function getBrandNameFromCache(brandId: string): string {
  return brandCache[brandId] || 'Unknown Brand';
}

/**
 * Function to fetch all brands from the database
 */
export async function fetchAllBrands(): Promise<Brand[]> {
  try {
    // Check if the brands table exists first
    const { error: tableCheckError } = await supabase
      .from('brands')
      .select('id')
      .limit(1);
      
    if (tableCheckError) {
      // If table doesn't exist or we can't access it, return mock brands
      return getMockBrands();
    }
    
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching brands:', error);
      return getMockBrands();
    }
    
    if (!data || data.length === 0) {
      return getMockBrands();
    }
    
    // Update cache with all brands
    data.forEach((brand: unknown) => {
      const typedBrand = brand as Brand;
      brandCache[typedBrand.id] = typedBrand.name;
    });
    
    return data;
  } catch (error) {
    console.error('Error fetching all brands:', error);
    return getMockBrands();
  }
}

/**
 * Get mock brands when database is not available
 */
function getMockBrands(): Brand[] {
  const mockBrands: Brand[] = [
    { id: 'brand-1', name: 'Baskit' },
    { id: 'brand-2', name: 'Nusantara' },
    { id: 'brand-3', name: 'Jaya Raya' },
    { id: 'brand-4', name: 'Indonesia Maju' }
  ];
  
  // Add to cache
  mockBrands.forEach(brand => {
    brandCache[brand.id] = brand.name;
  });
  
  return mockBrands;
}

/**
 * Function to create a new brand in the database
 * @param brandName The name of the brand to create
 * @returns The newly created brand or null if failed
 */
export async function createNewBrand(brandName: string): Promise<Brand | null> {
  try {
    // This is a workaround for TypeScript typings
    // Create the Supabase client with minimal type checking for this specific operation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typedSupabase = supabase as any;
    
    // Now we can insert without TypeScript errors
    const { data, error } = await typedSupabase
      .from('brands')
      .insert([{ name: brandName }])
      .select();
      
    if (error) {
      console.error('Error creating brand:', error);
      return null;
    }
    
    if (data && data.length > 0) {
      // We need to explicitly type the data since TypeScript doesn't know its structure
      const brandData = data[0] as unknown as { id: string; name: string };
      
      // Create a brand object from the result
      const newBrand: Brand = {
        id: brandData.id,
        name: brandData.name
      };
      
      // Add to cache
      brandCache[newBrand.id] = newBrand.name;
      return newBrand;
    }
    
    return null;
    
    return null;
  } catch (error) {
    console.error('Error creating brand:', error);
    return null;
  }
}
