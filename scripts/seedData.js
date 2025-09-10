/**
 * This script populates the Supabase database with sample data.
 * It adds sample products, users, and orders for development and testing.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase environment variables. Check your .env file.');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Sample data
const skuData = [
  {
    name: 'Baskit Fresh Noodles',
    description: 'Premium fresh noodles for restaurants and food service',
    size: '1kg',
    brand: 'Baskit Fresh',
    sku: 'BF-NDLS-1KG',
    image_url: 'https://example.com/images/noodles.jpg',
    consumer_price: 45000,
    is_active: true
  },
  {
    name: 'Baskit Premium Rice',
    description: 'High-quality rice for food service industry',
    size: '5kg',
    brand: 'Baskit Premium',
    sku: 'BP-RICE-5KG',
    image_url: 'https://example.com/images/rice.jpg',
    consumer_price: 120000,
    is_active: true
  },
  {
    name: 'Baskit Cooking Oil',
    description: 'Pure cooking oil for commercial kitchens',
    size: '2L',
    brand: 'Baskit Essentials',
    sku: 'BE-OIL-2L',
    image_url: 'https://example.com/images/oil.jpg',
    consumer_price: 55000,
    is_active: true
  }
];

const regionData = [
  { area: 'Jabodetabek', distributor_price: 40000, moq: 10 },
  { area: 'Jawa Barat', distributor_price: 41000, moq: 15 },
  { area: 'Jawa Tengah', distributor_price: 42000, moq: 15 },
  { area: 'Jawa Timur', distributor_price: 43000, moq: 20 }
];

/**
 * Insert sample SKUs and region pricing
 */
async function insertSampleSKUs() {
  console.log('Inserting sample SKUs...');
  
  for (const sku of skuData) {
    // Insert SKU
    const { data: skuResult, error: skuError } = await supabase
      .from('skus')
      .insert(sku)
      .select('id')
      .single();
    
    if (skuError) {
      console.error(`Error inserting SKU ${sku.name}:`, skuError);
      continue;
    }
    
    console.log(`Inserted SKU: ${sku.name} with ID: ${skuResult.id}`);
    
    // Insert region pricing for this SKU
    for (const region of regionData) {
      const regionPricing = {
        sku_id: skuResult.id,
        area: region.area,
        distributor_price: region.distributor_price,
        moq: region.moq
      };
      
      const { error: regionError } = await supabase
        .from('region_pricing')
        .insert(regionPricing);
      
      if (regionError) {
        console.error(`Error inserting region pricing for ${sku.name} in ${region.area}:`, regionError);
      } else {
        console.log(`  Added pricing for ${region.area}`);
      }
    }
  }
}

/**
 * Main function to run the seeding process
 */
async function seedData() {
  try {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // Ask for confirmation
    const answer = await new Promise((resolve) => {
      rl.question('This will add sample data to your database. Continue? (y/n) ', resolve);
    });
    
    rl.close();
    
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('Seeding cancelled.');
      return;
    }
    
    await insertSampleSKUs();
    console.log('Sample data seeded successfully.');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

// Run the seeding process
seedData();
