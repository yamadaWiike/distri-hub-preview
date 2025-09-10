import { supabase } from '@/integrations/supabase/client';

/**
 * Utility function to create a new brand with minimal TypeScript interference
 * @param brandName The name of the brand to create
 * @returns An object with the new brand's id and name, or null if it failed
 */
export async function createBrandRaw(brandName: string): Promise<{ id: string; name: string } | null> {
  try {
    // First check if the brand already exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typedSupabaseSelect1 = supabase as any;
    const { data: existingBrand } = await typedSupabaseSelect1
      .from('brands')
      .select('id, name')
      .ilike('name', brandName.trim())
      .maybeSingle();

    // Return the existing brand if found
    if (existingBrand) {
      // Type assertion to ensure we have the properties we need
      const typedExistingBrand = existingBrand as unknown as { id: string; name: string };
      return {
        id: typedExistingBrand.id,
        name: typedExistingBrand.name
      };
    }

    // Insert the new brand using a raw approach
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typedSupabase = supabase as any;
    await typedSupabase.from('brands').insert({ name: brandName.trim() });
    
    // Fetch the newly created brand
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typedSupabaseSelect2 = supabase as any;
    const { data: newBrand } = await typedSupabaseSelect2
      .from('brands')
      .select('id, name')
      .ilike('name', brandName.trim())
      .single();
    
    if (newBrand) {
      // Type assertion for the new brand data
      const typedNewBrand = newBrand as unknown as { id: string; name: string };
      return {
        id: typedNewBrand.id,
        name: typedNewBrand.name
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error in createBrandRaw:", error);
    return null;
  }
}
