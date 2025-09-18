// Temporary utility to fix database schema
// Run this file with: npm run dev and open browser console, then call setupDatabase()

import { supabase } from '@/integrations/supabase/client';

// Function to set up missing database tables and fix permissions
export async function setupDatabase() {
  console.log('Starting database setup...');
  
  try {
    // First, check if brands table exists
    const { error: brandsTestError } = await supabase
      .from('brands')
      .select('id')
      .limit(1);
    
    if (brandsTestError) {
      console.error('Brands table issue:', brandsTestError);
    } else {
      console.log('Brands table exists and accessible');
    }
    
    // Check if product_categories table exists
    const { error: categoriesTestError } = await supabase
      .from('product_categories')
      .select('id')
      .limit(1);
    
    if (categoriesTestError) {
      console.error('Product categories table issue:', categoriesTestError);
    } else {
      console.log('Product categories table exists and accessible');
    }
    
    // Try to create a test category to see what happens
    console.log('Attempting to create test category...');
    try {
      // Use any type to bypass TypeScript errors for this test
      const response = await supabase
        .from('product_categories')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert([{ name: 'Test Category ' + Date.now() }] as any)
        .select();
        
      if (response.error) {
        console.error('Test category creation failed:', response.error);
        console.error('Error details:', {
          code: response.error.code,
          message: response.error.message,
          details: response.error.details,
          hint: response.error.hint
        });
      } else {
        console.log('Test category created successfully:', response.data);
      }
    } catch (insertError) {
      console.error('Insert operation failed:', insertError);
    }
    
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

// Make the function available globally for browser console
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).setupDatabase = setupDatabase;

console.log('Database setup utility loaded. Call setupDatabase() in browser console to test.');