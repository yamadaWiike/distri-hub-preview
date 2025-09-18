import { supabase } from '@/integrations/supabase/client';
import { Product, RegionPricing, ProductVariant } from '@/data/products';

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
  variant_count?: number;
  has_variants?: boolean; // Add this field
};

export type RegionPricingFromDB = {
  id: string;
  product_id: string;
  area: string;
  distributor_price: number;
  moq: number;
  created_at?: string;
};

// Define the new DB structure for variants - updated to match actual schema
export type ProductVariantFromDB = {
  id: string;
  product_id: string;
  variant_name: string;
  variant_description?: string;
  additional_price: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

// Define a structure for variants view that returns complete information
export type VariantViewFromDB = {
  id: string;
  product_id: string;
  product_name: string;
  group_id: string;
  group_name: string;
  option_id: string;
  option_name: string;
  additional_price: number;
  is_active: boolean;
};

// Interface to handle various variant formats
interface GenericVariant {
  id: string;
  option_name?: string;
  variantName?: string;
  variant_name?: string;
  group_name?: string;
  variantDescription?: string;
  variant_description?: string;
  additional_price: number;
  is_active: boolean;
}

// Convert database product to frontend product format
export function mapDBProductToProduct(
  dbProduct: ProductFromDB, 
  regionPricing: RegionPricingFromDB[],
  variants?: GenericVariant[] // Using generic interface to handle both old and new variant formats
): Product {
  return {
    id: dbProduct.id, // Using actual UUID as ID for better compatibility
    sku: dbProduct.sku, // Add SKU separately
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
    hasVariants: (dbProduct.variant_count || 0) > 0,
    // Handle both new variant view format and old product_variants format
    variants: variants?.map(variant => ({
      id: variant.id,
      variantName: variant.option_name || variant.variantName || variant.variant_name,
      variantDescription: variant.group_name ? 
        `${variant.group_name}: ${variant.option_name}` : 
        (variant.variantDescription || variant.variant_description),
      additionalPrice: variant.additional_price,
      isActive: variant.is_active
    })),
    regions: regionPricing.map(region => ({
      area: region.area,
      distributorPrice: region.distributor_price,
      moq: region.moq
    }))
  };
}

// Define interface for product variant options
export type VariantOptionFromDB = {
  option_name: string;
  option_values: string[];
};

// Define type for product variant with option name
type ProductVariantWithOption = ProductVariantFromDB & {
  product_variant_options?: {
    id: string;
    name: string;
  };
};

// Fetch product variants for a specific product
export async function fetchProductVariants(productId: string) {
  try {
    console.log(`Fetching variants for product: ${productId}`);
    
    // Query the product_variants table directly - this matches your actual schema
    const { data, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true);
    
    if (error) {
      console.error('Error fetching product variants:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      console.log(`No variants found for product ${productId}`);
      return [];
    }
    
    console.log(`Found ${data.length} real variants for product ${productId}:`, data);
    
    // Convert to the format needed by the frontend using the actual variant_name field
    return data.map((variant: ProductVariantFromDB) => ({
      id: variant.id,
      variantName: variant.variant_name || 'Unnamed Variant',
      variantDescription: variant.variant_description || `Variant: ${variant.variant_name}`,
      additionalPrice: variant.additional_price || 0,
      isActive: variant.is_active
    }));
  } catch (error) {
    console.error('Exception fetching product variants:', error);
    return [];
  }
}

// Interface for product response with has_variants
interface ProductWithVariants {
  id: string;
  has_variants: boolean;
}

// Interface for variant view response
interface VariantViewOption {
  group_name: string;
  option_name: string;
}

// Fetch variant options for a specific product
export async function fetchProductVariantOptions(productId: string) {
  try {
    // Check if product exists and has variants
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, has_variants')
      .eq('id', productId)
      .single();
    
    if (productError || !product || !(product as ProductWithVariants).has_variants) {
      console.error('Error finding product or product has no variants:', productError);
      return [];
    }

    // Get unique groups and their options from variants_view
    const { data: optionsData, error: optionsError } = await supabase
      .from('variants_view')
      .select('group_name, option_name')
      .eq('product_id', productId)
      .eq('is_active', true);
    
    if (optionsError || !optionsData) {
      console.error('Error fetching product variant options:', optionsError);
      return [];
    }
    
    // Group options by name with their values
    const optionMap: Record<string, string[]> = {};
    (optionsData as VariantViewOption[]).forEach(opt => {
      const groupName = opt.group_name;
      const optionName = opt.option_name;
      
      if (!optionMap[groupName]) {
        optionMap[groupName] = [];
      }
      
      if (!optionMap[groupName].includes(optionName)) {
        optionMap[groupName].push(optionName);
      }
    });
    
    // Convert to array format
    const options: VariantOptionFromDB[] = Object.entries(optionMap).map(([name, values]) => ({
      option_name: name,
      option_values: values.sort() // Sort option values alphabetically
    }));
    
    return options;
  } catch (error) {
    console.error('Exception fetching product variant options:', error);
    return [];
  }
}

// Fetch all variant groups and options in the system
export async function getAllVariantOptions() {
  try {
    const { data, error } = await supabase
      .from('product_variant_groups')
      .select(`
        id,
        name,
        product_variant_options (
          id,
          name
        )
      `)
      .order('name')
      .order('name', { referencedTable: 'product_variant_options' });
    
    if (error) {
      console.error('Error fetching all variant options:', error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Exception fetching all variant options:', error);
    return [];
  }
}

// Define type for products with variants
interface ProductWithVariantCount {
  id: string;
  category: string;
  brand: string;
  name: string;
  size: string;
  distributor_price: number;
  consumer_price: number;
  moq: number;
  description: string;
  image?: string;
  variant_count: number;
}

interface RegionPricingDB {
  id: string;
  product_id: string;
  area: string;
  distributor_price: number;
  moq: number;
  created_at?: string;
}

// Define interface for fallback product data
interface FallbackProduct {
  id: string;
  sku: string;
  name: string;
  size: string;
  base_distributor_price: number;
  consumer_price: number;
  base_moq: number;
  description: string;
  image_url?: string;
  has_variants: boolean;
  brands?: { name: string };
  product_categories?: { name: string };
}

// Fetch all products with variant information
export async function fetchProductsWithVariants(): Promise<Product[]> {
  try {
    // First try to get products from the products_with_variants view
    const { data: viewProducts, error: productsError } = await supabase
      .from('products_with_variants')
      .select(`
        id,
        sku,
        category,
        brand,
        name,
        size,
        distributor_price,
        consumer_price,
        moq,
        description,
        image,
        variant_count
      `);
    
    // Variable to hold our final products list
    let productsData: ProductWithVariantCount[] = [];
    
    // If the view doesn't exist, fallback to joining the tables directly
    if (productsError) {
      console.error('Error fetching from products_with_variants view, falling back to direct query:', productsError);
      
      // Use a direct query to get the same information
      const { data: fallbackProducts, error: fallbackError } = await supabase
        .from('products')
        .select(`
          id,
          sku,
          name,
          size,
          base_distributor_price,
          consumer_price,
          base_moq,
          description,
          image_url,
          has_variants,
          brands:brand_id(name),
          product_categories:category_id(name)
        `);
      
      if (fallbackError || !fallbackProducts) {
        console.error('Error with fallback products query:', fallbackError);
        return [];
      }
      
      // Transform the fallback data to match the expected format
      productsData = (fallbackProducts as FallbackProduct[]).map(p => ({
        id: p.id,
        category: p.product_categories?.name || 'Uncategorized',
        brand: p.brands?.name || 'Unknown',
        name: p.name,
        size: p.size,
        distributor_price: p.base_distributor_price,
        consumer_price: p.consumer_price,
        moq: p.base_moq,
        description: p.description,
        image: p.image_url,
        variant_count: p.has_variants ? 1 : 0 // Assume has_variants flag means at least one variant
      }));
    } else {
      // Use the view data if available
      productsData = viewProducts as ProductWithVariantCount[];
    }
    
    if (!productsData || productsData.length === 0) {
      console.error('No product data available');
      return [];
    }
    
    // Then get region pricing for all products
    const { data: regionPricing, error: regionError } = await supabase
      .from('region_pricing')
      .select('*');
    
    if (regionError || !regionPricing) {
      console.error('Error fetching region pricing:', regionError);
      return [];
    }
    
    // Map the DB products to our frontend Product type
    return productsData.map((dbProduct) => {
      const productRegions = (regionPricing as RegionPricingDB[])
        .filter((r) => r.product_id === dbProduct.id);
      
      return {
        id: dbProduct.id,
        category: dbProduct.category,
        brand: dbProduct.brand,
        name: dbProduct.name,
        size: dbProduct.size,
        distributorPrice: dbProduct.distributor_price,
        consumerPrice: dbProduct.consumer_price,
        moq: dbProduct.moq,
        description: dbProduct.description,
        image: dbProduct.image,
        hasVariants: dbProduct.variant_count > 0,
        regions: productRegions.map((region) => ({
          area: region.area,
          distributorPrice: region.distributor_price,
          moq: region.moq
        }))
      };
    });
  } catch (error) {
    console.error('Exception fetching products with variants:', error);
    return [];
  }
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
    // Check if the id looks like a UUID or a SKU
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    // Fetch the product with joined brand and category data
    const query = supabase
      .from('products')
      .select(`
        *,
        brands:brand_id(*),
        product_categories:category_id(*)
      `);
      
    // Apply filter based on whether id is a UUID or SKU
    const { data: product, error: productError } = await (
      isUuid ? query.eq('id', id).single() : query.eq('sku', id).single()
    );
      
    if (productError || !product) {
      console.error(`Error fetching product ${id}:`, productError);
      return null;
    }
    
    // Explicitly type the product
    const typedProduct = product as ProductFromDB;
    
    // Fetch the region pricing for this product
    const { data: regions, error: regionsError } = await supabase
      .from('region_pricing')
      .select('*')
      .eq('product_id', typedProduct.id); // Always use product.id here
      
    if (regionsError || !regions) {
      console.error(`Error fetching region pricing for product ${id}:`, regionsError);
      return null;
    }
    
    // Fetch variants if the product has any
    let variants = [];
    if (typedProduct.has_variants) {
      const { data: variantData, error: variantError } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', typedProduct.id)
        .eq('is_active', true);
        
      if (!variantError) {
        variants = variantData;
      }
    }
    
    return mapDBProductToProduct(
      typedProduct, 
      regions as RegionPricingFromDB[],
      variants
    );
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

// Extended Product type that includes variant information in the main product data
export interface ProductWithVariant extends Omit<Product, 'variants' | 'hasVariants'> {
  variantInfo?: {
    id: string;
    variantName: string;
    variantDescription?: string;
    additionalPrice: number;
  };
  isVariant: boolean;
  baseProductId: string; // For variant products, this points to the base product
  displayName: string; // Combined product name + variant name for variants
}

// Fetch products expanded by variants - each variant becomes a separate product entry
export async function fetchProductsExpandedByVariants(): Promise<ProductWithVariant[]> {
  try {
    console.log('Starting fetchProductsExpandedByVariants...');
    // First get all base products
    const baseProducts = await fetchProductsWithVariants();
    console.log('Base products fetched:', baseProducts.length);
    const expandedProducts: ProductWithVariant[] = [];
    
    for (const product of baseProducts) {
      console.log(`Processing product: ${product.name}, hasVariants: ${product.hasVariants}`);
      if (product.hasVariants) {
        // Fetch variants for this product
        const variants = await fetchProductVariants(product.id);
        console.log(`Variants found for ${product.name}:`, variants.length);
        
        // For testing - only add real variants, no test data
        if (variants.length > 0) {
          // Create a separate product entry for each variant
          for (const variant of variants) {
            console.log(`Creating variant product for: ${variant.variantName}`);
            const variantProduct: ProductWithVariant = {
              ...product,
              // Create a unique ID for the variant product entry
              id: `${product.id}_variant_${variant.id}`,
              baseProductId: product.id,
              isVariant: true,
              displayName: `${product.name} - ${variant.variantName}`,
              variantInfo: {
                id: variant.id,
                variantName: variant.variantName,
                variantDescription: variant.variantDescription,
                additionalPrice: variant.additionalPrice
              },
              // Update pricing to include variant additional price
              distributorPrice: product.distributorPrice + variant.additionalPrice,
              consumerPrice: product.consumerPrice + variant.additionalPrice,
              // Update regional pricing to include variant additional price
              regions: product.regions.map(region => ({
                ...region,
                distributorPrice: region.distributorPrice + variant.additionalPrice
              }))
            };
            expandedProducts.push(variantProduct);
          }
        } else {
          // If product has variants flag but no actual variants, show as regular product
          const regularProduct: ProductWithVariant = {
            ...product,
            baseProductId: product.id,
            isVariant: false,
            displayName: product.name
          };
          expandedProducts.push(regularProduct);
        }
      } else {
        // For products without variants, add as regular product
        const regularProduct: ProductWithVariant = {
          ...product,
          baseProductId: product.id,
          isVariant: false,
          displayName: product.name
        };
        expandedProducts.push(regularProduct);
      }
    }
    
    console.log('Final expanded products:', expandedProducts.length);
    console.log('Variant products:', expandedProducts.filter(p => p.isVariant).length);
    return expandedProducts;
  } catch (error) {
    console.error('Error fetching products expanded by variants:', error);
    return [];
  }
}
