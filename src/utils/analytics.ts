/* eslint-disable @typescript-eslint/no-explicit-any */
// Analytics helper functions for use with catalog exports and order statistics
import { supabase } from "@/integrations/supabase/client";
import { PostgrestError } from "@supabase/supabase-js";

/**
 * Define types for catalog export tracking
 * These match the structure of the catalog_exports table in the database
 */
export type CatalogExportData = {
  user_id: string;
  exported_at?: string;
  products_count: number;
  area?: string | null;
  brand?: string | null;
  min_price?: number;
  max_price?: number;
};

/**
 * Response type for analytics operations
 */
export type AnalyticsResponse = {
  success?: boolean;
  error?: PostgrestError | Error | unknown;
};

export type OrderStatus = 'pending' | 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

/**
 * Track a catalog export event in the analytics system
 * 
 * @param userId - The ID of the user who exported the catalog
 * @param productCount - Number of products in the export
 * @param area - Area filter used (if any)
 * @param brand - Brand filter used (if any)
 * @param priceRange - Price range used [min, max]
 * @returns Promise with the result of the operation
 */
export async function trackCatalogExport(
  userId: string,
  productCount: number,
  area: string | null = 'all', 
  brand: string | null = null,
  priceRange: [number, number] = [0, 0]
) {
  try {
    const exportData: CatalogExportData = {
      user_id: userId,
      exported_at: new Date().toISOString(),
      products_count: productCount,
      area,
      brand,
      min_price: priceRange[0],
      max_price: priceRange[1]
    };
    
    // This requires that the catalog_exports table exists in the database
    // Using type assertion to work around Supabase's typing limitations
    const { error } = await supabase
      .from('catalog_exports')
      .insert(exportData as any);
    
    if (error) {
      console.error('Error tracking catalog export:', error);
      return { error } as AnalyticsResponse;
    }
    
    return { success: true } as AnalyticsResponse;
  } catch (error) {
    console.error('Unexpected error tracking export:', error);
    return { error } as AnalyticsResponse;
  }
}