import { supabase } from '@/integrations/supabase/client';
import { Product, RegionPricing, ProductVariant } from '@/data/products';
import { withAuth, requireAuth, requireAuthForViewing, validateAuth } from '@/utils/auth-guards';
import { getImageUrl } from '@/lib/s3-upload';

// Define database types to match our schema
export type ProductFromDB = {
  id: string;
  sku: string;
  category_id: string;
  brand_id: string;
  name: string;
  size: string;
  base_distributor_price: number;
  retail_price?: number;
  consumer_price: number;
  base_moq: number;
  description: string;
  image_url?: string;
  stock_quantity?: number;
  allow_negative_stock?: boolean;
  created_at?: string;
  brands?: { name: string };
  product_categories?: { name: string };
  variant_count?: number;
  has_variants?: boolean;
  // UOM fields
  base_uom?: string;
  moq_uom?: string;
  pricing_uom?: string;
  enable_uom_conversions?: boolean;
  // Mix variants fields
  single_sku_moq?: number;
  allow_mix_variants?: boolean;
  // UOM conversion factors
  base_conversion_factor?: number;
  moq_conversion_factor?: number;
  pricing_conversion_factor?: number;
};

export type RegionPricingFromDB = {
  id: string;
  product_id: string;
  area: string;
  distributor_price: number;
  moq: number;
  moq_uom?: string;
  price_uom?: string;
  // UOM conversion factors
  moq_conversion_factor?: number;
  pricing_conversion_factor?: number;
  created_at?: string;
  // Mix variants fields
  sku_level_moq?: number;
  allow_mix_variants?: boolean;
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
    retailPrice: dbProduct.retail_price,
    consumerPrice: dbProduct.consumer_price,
    moq: dbProduct.base_moq,
    description: dbProduct.description,
    stock: dbProduct.stock_quantity || 0,
    allow_negative_stock: dbProduct.allow_negative_stock ?? false,
    image: dbProduct.image_url,
    hasVariants: dbProduct.variant_count ? dbProduct.variant_count > 0 : (dbProduct.has_variants || false),
    // UOM fields
    base_uom: dbProduct.base_uom,
    moq_uom: dbProduct.moq_uom,
    pricing_uom: dbProduct.pricing_uom,
    enable_uom_conversions: dbProduct.enable_uom_conversions,
    // Mix variants fields
    singleSkuMoq: dbProduct.single_sku_moq || 0,
    allowMixVariants: dbProduct.allow_mix_variants || false,
    // UOM conversion factors
    base_conversion_factor: dbProduct.base_conversion_factor,
    moq_conversion_factor: dbProduct.moq_conversion_factor,
    pricing_conversion_factor: dbProduct.pricing_conversion_factor,
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
      moq: region.moq,
      moq_uom: region.moq_uom,
      price_uom: region.price_uom,
      // Mix variants fields for regions
      skuLevelMoq: region.sku_level_moq || 0,
      allowMixVariants: region.allow_mix_variants || false,
      // UOM conversion factors
      moq_conversion_factor: region.moq_conversion_factor,
      pricing_conversion_factor: region.pricing_conversion_factor
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
  // Only require authentication, not approval (allows pending users to view products)
  await requireAuthForViewing();
  
  try {
    
    // Query the product_variants table directly - this matches your actual schema
    const { data, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true);
    
    if (error) {
      return [];
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Convert to the format needed by the frontend using the actual variant_name field
    return data.map((variant: ProductVariantFromDB) => ({
      id: variant.id,
      variantName: variant.variant_name || 'Unnamed Variant',
      variantDescription: variant.variant_description || '', // Don't add "Variant:" prefix here
      additionalPrice: variant.additional_price || 0,
      isActive: variant.is_active
    }));
  } catch (error) {
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

    // Try variants_view first, fallback to product_variants
    let optionMap: Record<string, string[]> = {};
    const { data: optionsData, error: optionsError } = await supabase
      .from('variants_view')
      .select('group_name, option_name')
      .eq('product_id', productId)
      .eq('is_active', true);

    if (!optionsError && optionsData && Array.isArray(optionsData) && optionsData.length > 0) {
      (optionsData as VariantViewOption[]).forEach(opt => {
        const groupName = opt.group_name;
        const optionName = opt.option_name;
        if (!optionMap[groupName]) optionMap[groupName] = [];
        if (!optionMap[groupName].includes(optionName)) optionMap[groupName].push(optionName);
      });
    } else {
      const { data: pvData, error: pvError } = await supabase
        .from('product_variants')
        .select('variant_name, is_active')
        .eq('product_id', productId)
        .eq('is_active', true);
      if (pvError) {
        console.error('Error fetching product variants for options:', pvError);
        return [];
      }
      const names = (pvData || [])
        .map((v: any) => v.variant_name)
        .filter((v: any) => typeof v === 'string' && v.trim().length > 0);
      const uniqueNames = Array.from(new Set(names));
      if (uniqueNames.length > 0) {
        optionMap['Variant'] = uniqueNames;
      } else {
        return [];
      }
    }
    
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
  brand?: string;
  brand_id?: string;
  name: string;
  size: string;
  base_distributor_price: number;
  retail_price?: number;
  consumer_price: number;
  moq: number;
  description: string;
  image?: string;
  stock_quantity?: number;
  allow_negative_stock?: boolean;
  variant_count: number;
  base_uom?: string;
  moq_uom?: string;
  pricing_uom?: string;
  enable_uom_conversions?: boolean;
  // Mix variants fields
  single_sku_moq?: number;
  allow_mix_variants?: boolean;
}

interface RegionPricingDB {
  id: string;
  product_id: string;
  area: string;
  distributor_price: number;
  moq: number;
  created_at?: string;
  price_uom?: string;
  moq_uom?: string;
  // Mix variants fields
  sku_level_moq?: number;
  allow_mix_variants?: boolean;
}

// Define interface for fallback product data
interface FallbackProduct {
  id: string;
  sku: string;
  name: string;
  size: string;
  base_distributor_price: number;
  retail_price?: number;
  consumer_price: number;
  base_moq: number;
  description: string;
  image_url?: string;
  stock_quantity?: number;
  allow_negative_stock?: boolean;
  has_variants: boolean;
  base_uom?: string;
  moq_uom?: string;
  pricing_uom?: string;
  enable_uom_conversions?: boolean;
  // Mix variants fields
  single_sku_moq?: number;
  allow_mix_variants?: boolean;
  brands?: { name: string };
  product_categories?: { name: string };
}

// Fetch all products with variant information
export async function fetchProductsWithVariants(): Promise<Product[]> {
  // Only require authentication, not approval (allows pending users to view products)
  await requireAuthForViewing();
  
  try {
    // Query products directly from the products table (view doesn't exist in schema)
    const { data: fallbackProducts, error: fallbackError } = await supabase
      .from('products')
      .select(`
        id,
        sku,
        name,
        size,
        base_distributor_price,
        retail_price,
        consumer_price,
        base_moq,
        description,
        image_url,
        stock_quantity,
        allow_negative_stock,
        has_variants,
        base_uom,
        moq_uom,
        pricing_uom,
        enable_uom_conversions,
        single_sku_moq,
        allow_mix_variants,
        brands:brand_id(name),
        product_categories:category_id(name)
      `);
    
    // Variable to hold our final products list
    let productsData: ProductWithVariantCount[] = [];
    
    if (fallbackError || !fallbackProducts) {
      console.error('Error fetching products:', fallbackError);
      return [];
    }
    
    // Transform the data to match the expected format
    productsData = (fallbackProducts as FallbackProduct[]).map(p => ({
      id: p.id,
      category: p.product_categories?.name || 'Uncategorized',
      brand: p.brands?.name || 'Unknown',
      name: p.name,
      size: p.size,
      base_distributor_price: p.base_distributor_price,
      retail_price: p.retail_price,
      consumer_price: p.consumer_price,
      moq: p.base_moq,
      description: p.description,
      image: p.image_url,
      variant_count: p.has_variants ? 1 : 0,
      stock_quantity: p.stock_quantity,
      allow_negative_stock: p.allow_negative_stock,
      base_uom: p.base_uom || 'pcs',
      moq_uom: p.moq_uom || 'pcs',
      pricing_uom: p.pricing_uom || 'pcs',
      enable_uom_conversions: p.enable_uom_conversions || false,
      single_sku_moq: p.single_sku_moq || 0,
      allow_mix_variants: p.allow_mix_variants || false
    }));
    
    if (!productsData || productsData.length === 0) {
      console.error('No product data available');
      return [];
    }
    
    // Then get region pricing for all products
    const { data: regionPricing, error: regionError } = await supabase
      .from('region_pricing')
      .select('id, product_id, area, distributor_price, moq, moq_uom, price_uom, sku_level_moq, allow_mix_variants, created_at');
    
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
        brand: dbProduct.brand || 'Unknown',
        name: dbProduct.name,
        size: dbProduct.size,
        distributorPrice: dbProduct.base_distributor_price,
        retailPrice: dbProduct.retail_price,
        consumerPrice: dbProduct.consumer_price,
        moq: dbProduct.moq,
        description: dbProduct.description,
        image: dbProduct.image,
        stock: dbProduct.stock_quantity || 0,
        allow_negative_stock: dbProduct.allow_negative_stock ?? false,
        hasVariants: dbProduct.variant_count > 0,
        // UOM fields
        base_uom: dbProduct.base_uom || 'pcs',
        moq_uom: dbProduct.moq_uom || 'pcs',
        pricing_uom: dbProduct.pricing_uom || 'pcs',
        enable_uom_conversions: dbProduct.enable_uom_conversions || false,
        // Mix variants fields
        singleSkuMoq: dbProduct.single_sku_moq || 0,
        allowMixVariants: dbProduct.allow_mix_variants || false,
        regions: productRegions.map((region) => {
          const mappedRegion = {
            area: region.area,
            distributorPrice: region.distributor_price,
            moq: region.moq,
            // UOM fields for regional pricing - inherit from product if not set regionally
            price_uom: region.price_uom || dbProduct.pricing_uom || 'pcs',
            moq_uom: region.moq_uom || dbProduct.moq_uom || 'pcs',
            // Mix variants fields
            skuLevelMoq: region.sku_level_moq || 0,
            allowMixVariants: region.allow_mix_variants || false
          };
          
          return mappedRegion;
        })
      };
    });
  } catch (error) {
    return [];
  }
}

// Get all products with their region pricing
export async function getAllProducts(): Promise<Product[]> {
  // Only require authentication, not approval (allows pending users to view products)
  await requireAuthForViewing();
  
  try {
    // Fetch all products with brand and category names - explicitly select UOM fields
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        sku,
        name,
        size,
        base_distributor_price,
        retail_price,
        consumer_price,
        base_moq,
        description,
        image_url,
        stock_quantity,
        allow_negative_stock,
        has_variants,
        base_uom,
        moq_uom,
        pricing_uom,
        enable_uom_conversions,
        single_sku_moq,
        allow_mix_variants,
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
      .select('id, product_id, area, distributor_price, moq, moq_uom, price_uom, sku_level_moq, allow_mix_variants, created_at');
      
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
  // Only require authentication, not approval (allows pending users to view products)
  await requireAuthForViewing();
  
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
      .select('id, product_id, area, distributor_price, moq, moq_uom, price_uom, sku_level_moq, allow_mix_variants, created_at')
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
  // Only require authentication, not approval (allows pending users to view products)
  await requireAuthForViewing();
  
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
  // Only require authentication, not approval (allows pending users to view products)
  await requireAuthForViewing();
  
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
  // Make sure these fields are also included and properly typed
  singleSkuMoq?: number;
  allowMixVariants?: boolean;
  // S3 URL for images stored on S3
  image_url?: string;
}

// Fetch products expanded by variants - each variant becomes a separate product entry
export async function fetchProductsExpandedByVariants(): Promise<ProductWithVariant[]> {
  // Only require authentication, not approval (allows pending users to view products)
  await requireAuthForViewing();
  
  try {
    // Fetch all base products and all variants in parallel
    const [baseProducts, allVariantsData] = await Promise.all([
      fetchProductsWithVariants(),
      supabase
        .from('product_variants')
        .select('*')
        .eq('is_active', true)
    ]);
    
    // Create a map of variants by product_id for O(1) lookup
    const variantsByProduct = new Map<string, ProductVariantFromDB[]>();
    if (allVariantsData.data) {
      allVariantsData.data.forEach((variant: ProductVariantFromDB) => {
        if (!variantsByProduct.has(variant.product_id)) {
          variantsByProduct.set(variant.product_id, []);
        }
        variantsByProduct.get(variant.product_id)!.push(variant);
      });
    }
    
    const expandedProducts: ProductWithVariant[] = [];
    
    for (const product of baseProducts) {
      if (product.hasVariants) {
        const variants = variantsByProduct.get(product.id) || [];
        
        if (variants.length > 0) {
          // Create a separate product entry for each variant
          for (const variantData of variants) {
            const variant = {
              id: variantData.id,
              variantName: variantData.variant_name || 'Unnamed Variant',
              variantDescription: variantData.variant_description || '',
              additionalPrice: variantData.additional_price || 0,
              isActive: variantData.is_active
            };
            
            // Generate proper S3 URL for image if needed
            const imageUrl = product.image && !product.image.startsWith('http') && !product.image.startsWith('https')
              ? getImageUrl(product.image) || product.image
              : product.image;

            const variantProduct: ProductWithVariant = {
              ...product,
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
              distributorPrice: product.distributorPrice + variant.additionalPrice,
              consumerPrice: product.consumerPrice + variant.additionalPrice,
              singleSkuMoq: product.singleSkuMoq || 0,
              allowMixVariants: product.allowMixVariants || false,
              image_url: imageUrl,
              regions: product.regions.map(region => ({
                ...region,
                distributorPrice: region.distributorPrice + variant.additionalPrice,
                moq_uom: region.moq_uom || product.moq_uom,
                price_uom: region.price_uom || product.pricing_uom,
                skuLevelMoq: region.skuLevelMoq || 0,
                allowMixVariants: region.allowMixVariants || false
              }))
            };
            expandedProducts.push(variantProduct);
          }
        } else {
          // Generate proper S3 URL for image if needed
          const imageUrl = product.image && !product.image.startsWith('http') && !product.image.startsWith('https')
            ? getImageUrl(product.image) || product.image
            : product.image;

          const regularProduct: ProductWithVariant = {
            ...product,
            baseProductId: product.id,
            isVariant: false,
            displayName: product.name,
            image_url: imageUrl
          };
          expandedProducts.push(regularProduct);
        }
      } else {
        // Generate proper S3 URL for image if needed
        const imageUrl = product.image && !product.image.startsWith('http') && !product.image.startsWith('https')
          ? getImageUrl(product.image) || product.image
          : product.image;

        const regularProduct: ProductWithVariant = {
          ...product,
          baseProductId: product.id,
          isVariant: false,
          displayName: product.name,
          image_url: imageUrl
        };
        expandedProducts.push(regularProduct);
      }
    }
    
    return expandedProducts;
  } catch (error) {
    return [];
  }
}
