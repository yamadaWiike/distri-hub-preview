import { supabase } from '@/integrations/supabase/client';
import { Product, RegionPricing } from '@/data/products';

// Define types for database responses
interface ProductRecord {
  id: string;
  sku: string;
  name: string;
  size: string;
  base_distributor_price: number;
  consumer_price: number;
  base_moq: number;
  description: string;
  image_url: string | null;
  stock_quantity: number | null;
  brands: { name: string } | null;
  product_categories: { name: string } | null;
}

interface RegionPricingRecord {
  product_id: string;
  area: string;
  distributor_price: number;
  moq: number;
}

// Function to fetch products from Supabase
export async function fetchProductsFromSupabase(): Promise<Product[]> {
  try {
    // Fetch products
    const { data: products, error: productsError } = await supabase
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
        stock_quantity,
        brands(name),
        product_categories(name)
      `);
    
    if (productsError || !products) {
      console.error('Error fetching products:', productsError);
      return [];
    }

    // Fetch region pricing for all products
    const { data: regionPricing, error: regionError } = await supabase
      .from('region_pricing')
      .select('product_id, area, distributor_price, moq');
    
    if (regionError || !regionPricing) {
      console.error('Error fetching region pricing:', regionError);
      return [];
    }

    // Map database products to frontend Product format
    return (products as ProductRecord[]).map(product => {
      // Get region pricing for this product
      const productRegions = (regionPricing as RegionPricingRecord[])
        .filter(rp => rp.product_id === product.id)
        .map(rp => ({
          area: rp.area,
          distributorPrice: rp.distributor_price,
          moq: rp.moq
        }));

      return {
        id: product.sku, // Use SKU as the ID for frontend
        category: product.product_categories?.name || 'Uncategorized',
        brand: product.brands?.name || 'Unknown Brand',
        name: product.name,
        size: product.size,
        distributorPrice: product.base_distributor_price,
        consumerPrice: product.consumer_price,
        moq: product.base_moq,
        description: product.description,
        stock: product.stock_quantity || 0,
        regions: productRegions,
        image: product.image_url || '/placeholder.svg'
      };
    });
  } catch (error) {
    console.error('Unexpected error fetching products:', error);
    return [];
  }
}

// Function to fetch a single product by SKU
export async function fetchProductBySku(sku: string): Promise<Product | null> {
  try {
    // Fetch product
    const { data: product, error: productError } = await supabase
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
        stock_quantity,
        brands(name),
        product_categories(name)
      `)
      .eq('sku', sku)
      .single();
    
    if (productError) {
      // Only log actual errors, not "product not found" errors
      if (productError.code !== 'PGRST116') {
        console.error('Error fetching product:', productError);
      } else {
        console.log(`Product with SKU "${sku}" not found`);
      }
      return null;
    }
    
    if (!product) {
      return null;
    }

    // Fetch region pricing for this product
    const { data: regionPricing, error: regionError } = await supabase
      .from('region_pricing')
      .select('area, distributor_price, moq')
      .eq('product_id', (product as ProductRecord).id);
    
    if (regionError) {
      console.error('Error fetching region pricing:', regionError);
      // Continue with empty regions rather than failing
    }

    const productRecord = product as ProductRecord;
    const regions = regionPricing ? regionPricing : [];

    // Map database product to frontend Product format
    return {
      id: productRecord.sku, // Use SKU as the ID for frontend
      category: productRecord.product_categories?.name || 'Uncategorized',
      brand: productRecord.brands?.name || 'Unknown Brand',
      name: productRecord.name,
      size: productRecord.size,
      distributorPrice: productRecord.base_distributor_price,
      consumerPrice: productRecord.consumer_price,
      moq: productRecord.base_moq,
      description: productRecord.description,
      stock: productRecord.stock_quantity || 0,
      regions: (regions as RegionPricingRecord[]).map(rp => ({
        area: rp.area,
        distributorPrice: rp.distributor_price,
        moq: rp.moq
      })),
      image: productRecord.image_url || '/placeholder.svg'
    };
  } catch (error) {
    console.error('Unexpected error fetching product:', error);
    return null;
  }
}
