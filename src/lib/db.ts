import { supabase } from '@/integrations/supabase/client';
import { Product, RegionPricing, ProductVariant } from '@/data/products';

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
  has_variants?: boolean;
  base_uom?: string;
  moq_uom?: string;
  pricing_uom?: string;
  enable_uom_conversions?: boolean;
  brands: { name: string } | null;
  product_categories: { name: string } | null;
}

// Define type for database variant responses
interface VariantRecord {
  id: string;
  sku: string;
  name: string;
  distributor_price: number;
  consumer_price: number;
  stock_quantity?: number | null;
  image_url?: string | null;
  parent_product_id?: string;
  variant_name?: string;
  additional_price?: number;
  is_active?: boolean;
}

interface RegionPricingRecord {
  product_id: string;
  area: string;
  distributor_price: number;
  moq: number;
  moq_uom?: string;
  price_uom?: string;
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
        base_uom,
        moq_uom,
        pricing_uom,
        enable_uom_conversions,
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
      .select('product_id, area, distributor_price, moq, moq_uom, price_uom');
    
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
          moq: rp.moq,
          moq_uom: rp.moq_uom,
          price_uom: rp.price_uom
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
        // UOM fields
        base_uom: product.base_uom,
        moq_uom: product.moq_uom,
        pricing_uom: product.pricing_uom,
        enable_uom_conversions: product.enable_uom_conversions,
        regions: productRegions,
        image: product.image_url || '/placeholder.svg'
      };
    });
  } catch (error) {
    console.error('Unexpected error fetching products:', error);
    return [];
  }
}

// Function to fetch a single product by SKU or ID
export async function fetchProductBySku(skuOrId: string): Promise<Product | null> {
  try {
    let product: ProductRecord | null = null;
    let productId: string | null = null;
    
    console.log('fetchProductBySku called with:', skuOrId);
    
    // Check if it looks like a short prefix (less than full SKU length)
    const isShortPrefix = skuOrId.length >= 6 && skuOrId.length <= 10 && !skuOrId.includes('-');
    
    console.log('isShortPrefix:', isShortPrefix, 'length:', skuOrId.length);
    
    if (isShortPrefix) {
      console.log('Searching by ID prefix:', `${skuOrId}%`);
      // It's likely a prefix from slug, search by ID prefix
      // We need to fetch all products and filter in memory since PostgreSQL UUID doesn't support ilike
      const { data: allProducts, error: prefixError } = await supabase
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
          has_variants,
          base_uom,
          moq_uom,
          pricing_uom,
          enable_uom_conversions,
          brands(name),
          product_categories(name)
        `);
      
      if (prefixError) {
        console.error('Error searching products:', prefixError);
        return null;
      }
      
      // Filter by ID prefix in JavaScript
      const productsByPrefix = (allProducts as ProductRecord[])?.filter((p: ProductRecord) => p.id.startsWith(skuOrId)) || [];
      console.log('Filtered products by prefix:', productsByPrefix.length);
        
      if (productsByPrefix && productsByPrefix.length > 0) {
        product = productsByPrefix[0] as ProductRecord;
        productId = product.id;
        console.log('Found product by prefix:', { sku: product.sku, id: product.id });
      } else {
        console.log('No product found by prefix');
        return null;
      }
    } else {
      // Try exact SKU match first
      const { data: productBySku, error: productSkuError } = await supabase
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
          has_variants,
          base_uom,
          moq_uom,
          pricing_uom,
          enable_uom_conversions,
          brands(name),
          product_categories(name)
        `)
        .eq('sku', skuOrId)
        .maybeSingle();
      
      if (productBySku) {
        product = productBySku as ProductRecord;
        productId = product.id;
      } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(skuOrId)) {
        // It looks like a UUID, so try by ID
        const { data: productById, error: productByIdError } = await supabase
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
            has_variants,
            base_uom,
            moq_uom,
            pricing_uom,
            enable_uom_conversions,
            brands(name),
            product_categories(name)
          `)
          .eq('id', skuOrId)
          .maybeSingle();
          
        if (productById) {
          product = productById as ProductRecord;
          productId = product.id;
        }
      }
    }
    
    if (!product || !productId) {
      return null;
    }

    // Check if product has variants and fetch them if needed
    let variants: ProductVariant[] = [];
    if (product.has_variants) {
      try {
        // Try to get variants from the view first
        const { data: variantsData, error: variantsViewError } = await supabase
          .from('variants_view')
          .select('*')
          .eq('parent_product_id', productId);
        
        if (!variantsViewError && variantsData) {
          variants = (variantsData as VariantRecord[]).map(v => ({
            id: v.sku,
            variantName: v.variant_name || v.name,
            additionalPrice: v.additional_price || 0,
            isActive: v.is_active !== false, // Default to true if undefined
          }));
        } else {
          // Fallback: try to get variants directly from product_variants table
          const { data: fallbackVariants, error: fallbackError } = await supabase
            .from('product_variants')
            .select(`
              id, 
              sku, 
              name, 
              variant_name,
              distributor_price, 
              consumer_price, 
              additional_price,
              is_active,
              stock_quantity, 
              image_url
            `)
            .eq('parent_product_id', productId);
          
          if (!fallbackError && fallbackVariants) {
            variants = (fallbackVariants as VariantRecord[]).map(v => ({
              id: v.sku,
              variantName: v.variant_name || v.name,
              additionalPrice: v.additional_price || 0,
              isActive: v.is_active !== false, // Default to true if undefined
            }));
          }
        }
      } catch (variantError) {
        console.error('Error fetching variants:', variantError);
      }
    }

    // Fetch region pricing for this product
    const { data: regionPricing, error: regionError } = await supabase
      .from('region_pricing')
      .select('area, distributor_price, moq, moq_uom, price_uom')
      .eq('product_id', productId);
    
    if (regionError) {
      console.error('Error fetching region pricing:', regionError);
      // Continue with empty regions rather than failing
    }

    const regions = regionPricing ? regionPricing as RegionPricingRecord[] : [];

    // Fetch all images for this product
    const { data: imagesData, error: imagesError } = await supabase
      .from('product_images')
      .select('image_url, is_primary, display_order')
      .eq('product_id', productId)
      .order('display_order', { ascending: true });
    let images: string[] = [];
    if (imagesData && imagesData.length > 0) {
      images = (imagesData as { image_url: string | null }[])
        .map((img) => img.image_url)
        .filter((url) => !!url && url !== 'null' && url.trim() !== '');
    } else if (product.image_url) {
      images = [product.image_url].filter((url) => !!url && url !== 'null' && url.trim() !== '');
    }

    // Map database product to frontend Product format
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
      hasVariants: product.has_variants,
      // UOM fields
      base_uom: product.base_uom,
      moq_uom: product.moq_uom,
      pricing_uom: product.pricing_uom,
      enable_uom_conversions: product.enable_uom_conversions,
      variants: variants.length > 0 ? variants : undefined,
      regions: regions.map(rp => ({
        area: rp.area,
        distributorPrice: rp.distributor_price,
        moq: rp.moq,
        moq_uom: rp.moq_uom,
        price_uom: rp.price_uom
      })),
      image: images[0] || '/placeholder.svg',
      images,
    };
  } catch (error) {
    console.error('Unexpected error fetching product:', error);
    return null;
  }
}
