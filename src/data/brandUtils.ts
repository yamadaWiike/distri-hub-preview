/**
 * Brand utility functions for Supabase operations
 * This file provides type-safe wrappers around Supabase calls
 */
import { supabase } from '@/integrations/supabase/client';
import { Brand } from './brands';

/**
 * Special helper for inserting a brand while avoiding TypeScript issues
 */
export async function insertBrand(brandName: string): Promise<Brand | null> {
  try {
    // Use the raw method to avoid TypeScript errors with Supabase client
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typedSupabase = supabase as any;
    const result = await typedSupabase.rpc('insert_brand', {
      brand_name: brandName
    });
    
    if (result.error) {
      console.error('Error inserting brand via RPC:', result.error);
      
      // Fallback to direct insert if RPC fails
      try {
        // Direct SQL insert as a fallback
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const typedSupabaseInsert = supabase as any;
        const { data, error } = await typedSupabaseInsert.from('brands')
          .insert({ name: brandName })
          .select();
          
        if (error || !data || !Array.isArray(data) || data.length === 0) {
          console.error('Fallback insert failed:', error);
          return null;
        }
        
        const brandData = data[0] as unknown as { id: string; name: string };
        
        return {
          id: brandData.id,
          name: brandData.name
        };
      } catch (directError) {
        console.error('Error in fallback brand insert:', directError);
        return null;
      }
    }
    
    if (!result.data) {
      return null;
    }
    
    // RPC should return the created brand ID
    const brandId = result.data as unknown as string;
    
    // Fetch the complete brand data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typedSupabaseSelect = supabase as any;
    const { data: brandData } = await typedSupabaseSelect
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .single();
    
    if (!brandData) {
      return null;
    }
    
    // Type assertion to ensure we have the properties we need
    const typedBrandData = brandData as unknown as { id: string; name: string };
    
    return {
      id: typedBrandData.id,
      name: typedBrandData.name
    };
  } catch (error) {
    console.error('Error in insertBrand:', error);
    return null;
  }
}

/**
 * Check if the brands table exists in the database
 */
export async function checkBrandsTableExists(): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typedSupabaseCheck = supabase as any;
    const { error } = await typedSupabaseCheck
      .from('brands')
      .select('id')
      .limit(1);
      
    return !error;
  } catch (error) {
    console.error('Error checking brands table:', error);
    return false;
  }
}

/**
 * Create a brand table if it doesn't exist
 * Note: This requires database admin permissions
 */
export async function createBrandsTable(): Promise<boolean> {
  try {
    // Check if table exists first
    const tableExists = await checkBrandsTableExists();
    if (tableExists) {
      return true;
    }
    
    // This would typically be done in a migration, not client-side
    // Included here as a reference
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typedSupabaseRpc = supabase as any;
    const { error } = await typedSupabaseRpc.rpc('create_brands_table');
    
    return !error;
  } catch (error) {
    console.error('Error creating brands table:', error);
    return false;
  }
}
