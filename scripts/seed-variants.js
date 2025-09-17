import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// Get Supabase credentials from environment variables (with or without VITE_ prefix)
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Make sure environment variables are loaded
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  console.error('Please check your .env file or set them manually');
  process.exit(1);
}

// Initialize the Supabase client
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/**
 * @typedef {Object} SupabaseResponseData
 * @property {string} id
 * @property {string} [name]
 * @property {string} [description]
 * @property {string} [group_id]
 * @property {string} [product_id]
 * @property {string} [option_id]
 * @property {string} [area]
 * @property {number} [distributor_price]
 * @property {number} [moq]
 * @property {string} [brand_id]
 * @property {string} [category_id]
 * @property {number} [base_distributor_price]
 * @property {number} [consumer_price]
 * @property {number} [base_moq]
 * @property {string} [size]
 * @property {boolean} [has_variants]
 * @property {number} [additional_price]
 * @property {boolean} [is_active]
 * @property {number} [stock_quantity]
 * @property {string} [image_url]
 * @property {string} [created_at]
 * @property {string} [updated_at]
 */

// Define schema structures as JSDoc comments instead of TypeScript types
/**
 * @typedef {Object} VariantGroup
 * @property {string} name
 * @property {string[]} options
 */

/**
 * @typedef {Object} Brand
 * @property {string} name
 * @property {string} [description]
 */

/**
 * @typedef {Object} Category
 * @property {string} name
 * @property {string} [description]
 */

/**
 * @typedef {Object} ProductVariant
 * @property {string} groupName
 * @property {string} optionName
 * @property {number} additionalPrice
 */

/**
 * @typedef {Object} RegionPricing
 * @property {string} area
 * @property {number} distributorPrice
 * @property {number} moq
 */

/**
 * @typedef {Object} Product
 * @property {string} sku
 * @property {string} name
 * @property {string} description
 * @property {string} size
 * @property {number} baseDistributorPrice
 * @property {number} consumerPrice
 * @property {number} baseMoq
 * @property {string} brandName
 * @property {string} categoryName
 * @property {RegionPricing[]} [regions]
 * @property {ProductVariant[]} [variants]
 */

// Sample data
/** @type {Brand[]} */
const brands = [
  { name: 'Baskit', description: 'Our in-house brand for quality products' },
  { name: 'FreshPick', description: 'Premium fresh products' },
  { name: 'EcoChoice', description: 'Environmentally friendly products' },
  { name: 'ValuePack', description: 'Affordable bulk options' },
  { name: 'GourmetSelect', description: 'High-end culinary products' }
];

/** @type {Category[]} */
const categories = [
  { name: 'Makanan Ringan', description: 'Snacks and light foods' },
  { name: 'Minuman', description: 'Beverages' },
  { name: 'Bumbu Dapur', description: 'Cooking spices and condiments' },
  { name: 'Mi Instan', description: 'Instant noodles' },
  { name: 'Biskuit', description: 'Cookies and biscuits' },
  { name: 'Minuman Energi', description: 'Energy drinks' },
  { name: 'Kopi', description: 'Coffee products' },
  { name: 'Camilan Sehat', description: 'Healthy snacks' }
];

/** @type {VariantGroup[]} */
const variantGroups = [
  {
    name: 'Flavor',
    options: ['Original', 'Spicy', 'BBQ', 'Cheese', 'Sour Cream']
  },
  {
    name: 'Size',
    options: ['Small', 'Medium', 'Large', 'Family']
  },
  {
    name: 'Packaging',
    options: ['Standard Box', 'Gift Box', 'Eco-friendly']
  },
  {
    name: 'Color',
    options: ['Red', 'Blue', 'Green', 'Black', 'White']
  }
];

/** @type {Product[]} */
const products = [
  {
    sku: 'SKU-CHIPS-10',
    name: 'Keripik Kentang Original',
    description: 'Keripik kentang renyah rasa original dengan kualitas premium.',
    size: '50gr',
    baseDistributorPrice: 4500,
    consumerPrice: 8000,
    baseMoq: 100,
    brandName: 'Baskit',
    categoryName: 'Makanan Ringan',
    regions: [
      { area: 'Jakarta Pusat', distributorPrice: 4700, moq: 120 },
      { area: 'Kota Bandung', distributorPrice: 4600, moq: 100 },
      { area: 'Kota Surabaya', distributorPrice: 4550, moq: 100 }
    ],
    variants: [
      { groupName: 'Flavor', optionName: 'Original', additionalPrice: 0 },
      { groupName: 'Flavor', optionName: 'Spicy', additionalPrice: 1000 },
      { groupName: 'Flavor', optionName: 'BBQ', additionalPrice: 1500 },
      { groupName: 'Flavor', optionName: 'Cheese', additionalPrice: 2000 }
    ]
  },
  {
    sku: 'SKU-CHIPS-11',
    name: 'Keripik Kentang BBQ',
    description: 'Keripik kentang rasa BBQ gurih dan lezat.',
    size: '50gr',
    baseDistributorPrice: 4700,
    consumerPrice: 8500,
    baseMoq: 100,
    brandName: 'Baskit',
    categoryName: 'Makanan Ringan',
    regions: [
      { area: 'Kota Bandung', distributorPrice: 4800, moq: 110 },
      { area: 'Kota Semarang', distributorPrice: 4750, moq: 100 }
    ]
  },
  {
    sku: 'SKU-WATER-10',
    name: 'Air Mineral Baskit',
    description: 'Air mineral murni dan sehat.',
    size: '500ml',
    baseDistributorPrice: 2500,
    consumerPrice: 5000,
    baseMoq: 200,
    brandName: 'Baskit',
    categoryName: 'Minuman',
    regions: [
      { area: 'Jakarta Pusat', distributorPrice: 2600, moq: 220 },
      { area: 'Kota Bandung', distributorPrice: 2550, moq: 200 }
    ],
    variants: [
      { groupName: 'Size', optionName: 'Small', additionalPrice: 0 },
      { groupName: 'Size', optionName: 'Medium', additionalPrice: 2000 },
      { groupName: 'Size', optionName: 'Large', additionalPrice: 4000 }
    ]
  }
];

// Main seeding function
async function seed() {
  try {
    console.log('Starting database seeding...');

    // Insert variant groups
    console.log('Inserting variant groups...');
    for (const group of variantGroups) {
      const { data: groupData, error: groupError } = await supabase
        .from('product_variant_groups')
        .insert({ name: group.name })
        .select()
        .single();

      if (groupError) {
        console.error(`Error inserting group ${group.name}:`, groupError);
        continue;
      }

      console.log(`Inserted group: ${group.name}`);

      // Insert options for this group
      for (const option of group.options) {
        const { error: optionError } = await supabase
          .from('product_variant_options')
          .insert({
            group_id: groupData.id,
            name: option
          });

        if (optionError) {
          console.error(`Error inserting option ${option}:`, optionError);
        } else {
          console.log(`  - Added option: ${option}`);
        }
      }
    }

    // Insert brands
    console.log('\nInserting brands...');
    for (const brand of brands) {
      const { error } = await supabase
        .from('brands')
        .insert({
          name: brand.name,
          description: brand.description
        })
        .select();

      if (error) {
        console.error(`Error inserting brand ${brand.name}:`, error);
      } else {
        console.log(`Inserted brand: ${brand.name}`);
      }
    }

    // Insert categories
    console.log('\nInserting categories...');
    for (const category of categories) {
      const { error } = await supabase
        .from('product_categories')
        .insert({
          name: category.name,
          description: category.description
        })
        .select();

      if (error) {
        console.error(`Error inserting category ${category.name}:`, error);
      } else {
        console.log(`Inserted category: ${category.name}`);
      }
    }

    // Insert products
    console.log('\nInserting products...');
    for (const product of products) {
      // Get brand ID
      const { data: brandData, error: brandError } = await supabase
        .from('brands')
        .select('id')
        .eq('name', product.brandName)
        .single();

      if (brandError) {
        console.error(`Error finding brand ${product.brandName}:`, brandError);
        continue;
      }

      // Get category ID
      const { data: categoryData, error: categoryError } = await supabase
        .from('product_categories')
        .select('id')
        .eq('name', product.categoryName)
        .single();

      if (categoryError) {
        console.error(`Error finding category ${product.categoryName}:`, categoryError);
        continue;
      }

      // Insert the product
      const hasVariants = product.variants && product.variants.length > 0;
      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert({
          sku: product.sku,
          name: product.name,
          description: product.description,
          size: product.size,
          base_distributor_price: product.baseDistributorPrice,
          consumer_price: product.consumerPrice,
          base_moq: product.baseMoq,
          brand_id: brandData.id,
          category_id: categoryData.id,
          has_variants: hasVariants
        })
        .select()
        .single();

      if (productError) {
        console.error(`Error inserting product ${product.name}:`, productError);
        continue;
      }

      console.log(`Inserted product: ${product.name}`);

      // Insert region pricing
      if (product.regions && product.regions.length > 0) {
        for (const region of product.regions) {
          const { error: regionError } = await supabase
            .from('product_region_pricing')
            .insert({
              product_id: productData.id,
              area: region.area,
              distributor_price: region.distributorPrice,
              moq: region.moq
            });

          if (regionError) {
            console.error(`Error inserting region pricing for ${region.area}:`, regionError);
          } else {
            console.log(`  - Added region pricing for ${region.area}`);
          }
        }
      }

      // Insert variants
      if (product.variants && product.variants.length > 0) {
        for (const variant of product.variants) {
          // Get group ID
          const { data: groupData, error: groupError } = await supabase
            .from('product_variant_groups')
            .select('id')
            .eq('name', variant.groupName)
            .single();

          if (groupError) {
            console.error(`Error finding variant group ${variant.groupName}:`, groupError);
            continue;
          }

          // Get option ID
          const { data: optionData, error: optionError } = await supabase
            .from('product_variant_options')
            .select('id')
            .eq('group_id', groupData.id)
            .eq('name', variant.optionName)
            .single();

          if (optionError) {
            console.error(`Error finding variant option ${variant.optionName}:`, optionError);
            continue;
          }

          // Insert the variant
          const { error: variantError } = await supabase
            .from('product_variants')
            .insert({
              product_id: productData.id,
              option_id: optionData.id,
              additional_price: variant.additionalPrice,
              is_active: true
            });

          if (variantError) {
            console.error(`Error inserting variant ${variant.optionName}:`, variantError);
          } else {
            console.log(`  - Added variant: ${variant.groupName} - ${variant.optionName}`);
          }
        }
      }
    }

    console.log('\nSeeding complete!');

  } catch (error) {
    // Handle errors with proper formatting
    if (error instanceof Error) {
      console.error('Unexpected error during seeding:', error.message);
    } else {
      console.error('Unexpected error during seeding:', String(error));
    }
  }
}

// Run the seed function
seed();
