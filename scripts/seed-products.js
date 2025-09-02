import { createClient } from '@supabase/supabase-js';
import { PRODUCTS } from '../src/data/products';

// Initialize the Supabase client
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_SERVICE_ROLE_KEY'; // Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedProductsData() {
  // Function to map our frontend product format to database format
  const mapProductToDB = (product) => ({
    id: product.id,
    category: product.category,
    brand: product.brand,
    name: product.name,
    size: product.size,
    distributor_price: product.distributorPrice,
    consumer_price: product.consumerPrice,
    moq: product.moq,
    description: product.description,
    image: product.image || '/placeholder.svg'
  });

  // Function to map region pricing data
  const mapRegionPricingToDB = (productId, regions) => {
    return regions.map(region => ({
      product_id: productId,
      area: region.area,
      distributor_price: region.distributorPrice,
      moq: region.moq
    }));
  };

  console.log('Starting data seeding...');
  
  // First, clear any existing data to avoid duplicates
  console.log('Clearing existing data...');
  
  const { error: deleteRegionsError } = await supabase.from('region_pricing').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (deleteRegionsError) {
    console.error('Error clearing region_pricing:', deleteRegionsError.message);
    return;
  }
  
  const { error: deleteProductsError } = await supabase.from('products').delete().neq('id', '');
  if (deleteProductsError) {
    console.error('Error clearing products:', deleteProductsError.message);
    return;
  }
  
  // Insert products
  console.log('Inserting products...');
  
  for (const product of PRODUCTS) {
    // Insert product
    const { error: productError } = await supabase
      .from('products')
      .insert(mapProductToDB(product));
      
    if (productError) {
      console.error(`Error inserting product ${product.id}:`, productError.message);
      continue;
    }
    
    // Insert region pricing
    if (product.regions && product.regions.length > 0) {
      const { error: regionError } = await supabase
        .from('region_pricing')
        .insert(mapRegionPricingToDB(product.id, product.regions));
        
      if (regionError) {
        console.error(`Error inserting regions for product ${product.id}:`, regionError.message);
      }
    }
  }
  
  console.log('Data seeding completed!');
}

// Run the seeding function
seedProductsData().catch(console.error);
