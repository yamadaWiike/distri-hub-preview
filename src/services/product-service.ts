import { supabase } from '@/integrations/supabase/client';
import { Product, RegionPricing } from '@/data/products';

// Define database types to match our schema
export type ProductFromDB = {
  id: string;
  sku: string;
  category_id: string;
  brand_id: string;
  name: string;
  size: string;
  base_distributor_price: number;
  consumer_price: number;
  base_moq: number;
  description: string;
  image_url?: string;
  stock_quantity?: number;
  created_at?: string;
  brands?: { name: string };
  product_categories?: { name: string };
};

export type RegionPricingFromDB = {
  id: string;
  product_id: string;
  area: string;
  distributor_price: number;
  moq: number;
  created_at?: string;
};

// Convert database product to frontend product format
export function mapDBProductToProduct(
  dbProduct: ProductFromDB, 
  regionPricing: RegionPricingFromDB[]
): Product {
  return {
    id: dbProduct.sku, // Use SKU as ID for frontend
    category: dbProduct.product_categories?.name || 'Uncategorized',
    brand: dbProduct.brands?.name || 'Unknown Brand',
    name: dbProduct.name,
    size: dbProduct.size,
    distributorPrice: dbProduct.base_distributor_price,
    consumerPrice: dbProduct.consumer_price,
    moq: dbProduct.base_moq,
    description: dbProduct.description,
    stock: dbProduct.stock_quantity || 0,
    image: dbProduct.image_url,
    regions: regionPricing.map(region => ({
      area: region.area,
      distributorPrice: region.distributor_price,
      moq: region.moq
    }))
  };
}

// Get all products with their region pricing
export async function getAllProducts(): Promise<Product[]> {
  try {
    // Fetch all products with brand and category names
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select(`
        *,
        brands(name),
        product_categories(name)
      `);
      
    if (productsError || !productsData) {
      console.error('Error fetching products:', productsError);
      return [];
    }
    
    // Fetch all region pricing
    const { data: regionsData, error: regionsError } = await supabase
      .from('region_pricing')
      .select('*');
      
    if (regionsError || !regionsData) {
      console.error('Error fetching region pricing:', regionsError);
      return [];
    }
    
    // Map the data to our frontend format
    return (productsData as ProductFromDB[]).map(product => {
      const productRegions = (regionsData as RegionPricingFromDB[]).filter(
        region => region.product_id === product.id
      );
      
      return mapDBProductToProduct(product, productRegions);
    });
  } catch (error) {
    console.error('Unexpected error fetching products:', error);
    return [];
  }
}

// Get a single product by ID
export async function getProductById(id: string): Promise<Product | null> {
  try {
    // Fetch the product with joined brand and category data
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        brands:brand_id(*),
        product_categories:category_id(*)
      `)
      .eq('id', id)
      .single();
      
    if (productError || !product) {
      console.error(`Error fetching product ${id}:`, productError);
      return null;
    }
    
    // Fetch the region pricing for this product
    const { data: regions, error: regionsError } = await supabase
      .from('region_pricing')
      .select('*')
      .eq('product_id', id);
      
    if (regionsError || !regions) {
      console.error(`Error fetching region pricing for product ${id}:`, regionsError);
      return null;
    }
    
    return mapDBProductToProduct(product as ProductFromDB, regions as RegionPricingFromDB[]);
  } catch (error) {
    console.error(`Unexpected error fetching product ${id}:`, error);
    return null;
  }
}

// Get areas where products are available (distinct list)
export async function getAllAreas(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('region_pricing')
      .select('area');
      
    if (error || !data) {
      console.error('Error fetching areas:', error);
      return [];
    }
    
    // Create unique list of areas
    const areas = [...new Set(data.map(item => (item as { area: string }).area))];
    return areas.sort();
  } catch (error) {
    console.error('Unexpected error fetching areas:', error);
    return [];
  }
}

// Get all available brands (distinct list)
export async function getAllBrands(): Promise<string[]> {
  try {
    // Query the brands table directly - not the products table
    const { data, error } = await supabase
      .from('brands')  // Use the brands table, not products
      .select('name'); // Select only the name column
      
    if (error || !data) {
      console.error('Error fetching brands:', error);
      return [];
    }
    
    // Create list of brand names
    const brands = data.map(item => (item as { name: string }).name);
    return brands.sort();
  } catch (error) {
    console.error('Unexpected error fetching brands:', error);
    return [];
  }
}
