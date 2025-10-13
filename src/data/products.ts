export type RegionPricing = {
  area: string; // Kota/Kabupaten
  distributorPrice: number; // in IDR per unit
  moq: number;
  // UOM fields for regional pricing
  price_uom?: string;
  moq_uom?: string;
  // Mix variants fields
  skuLevelMoq?: number; // MOQ at the SKU level (across all variants)
  allowMixVariants?: boolean; // Whether variants can be mixed for this region
  // UOM conversion factors for regional pricing
  moq_conversion_factor?: number;
  pricing_conversion_factor?: number;
};

export type VariantOption = {
  option_name: string;
  option_values: string[];
};

export type ProductVariant = {
  id: string;
  variantName: string;
  variantDescription?: string;
  additionalPrice: number;
  isActive: boolean;
  options?: {
    name: string;
    value: string;
  }[];
};

export type Product = {
  id: string;
  category: string;
  brand: string;
  name: string;
  size: string;
  distributorPrice: number; // base
  consumerPrice: number;
  moq: number;
  description: string;
  regions: RegionPricing[];
  variants?: ProductVariant[]; // Product variants
  variantOptions?: VariantOption[]; // Available options for variants
  hasVariants?: boolean; // Quick flag to check if product has variants
  image?: string; // URL or imported asset path
  stock?: number; // Stock quantity
  margin?: number;
  area?: string;
  units?: number;
  sku?: string; // Product SKU (may be different from ID in some cases)
  // UOM fields
  base_uom?: string;
  moq_uom?: string;
  pricing_uom?: string;
  enable_uom_conversions?: boolean;
  // Mix variants fields
  singleSkuMoq?: number; // Minimum order quantity for the entire SKU
  allowMixVariants?: boolean; // Whether different variants can be mixed to reach MOQ
  // UOM conversion factors
  base_conversion_factor?: number;
  moq_conversion_factor?: number;
  pricing_conversion_factor?: number;
};

export const PRODUCTS: Product[] = [
  {
    id: 'SKU-CHIPS-10',
    category: 'Makanan Ringan',
    brand: 'Baskit',
    name: 'Keripik Kentang Original',
    size: '50gr',
    distributorPrice: 4500,
    consumerPrice: 8000,
    moq: 100,
    description: 'Keripik kentang renyah rasa original dengan kualitas premium.',
    regions: [
      { area: 'Jakarta Pusat', distributorPrice: 4700, moq: 120 },
      { area: 'Kota Bandung', distributorPrice: 4600, moq: 100 },
      { area: 'Kota Surabaya', distributorPrice: 4550, moq: 100 },
    ],
    image: '/placeholder.svg',
    hasVariants: true,
    variantOptions: [
      { option_name: 'Size', option_values: ['Small', 'Medium', 'Large'] },
      { option_name: 'Packaging', option_values: ['Standard Box', 'Gift Box', 'Eco-friendly'] }
    ],
    variants: [
      {
        id: 'var-chips-10-1',
        variantName: 'Small - Standard Box',
        additionalPrice: 0,
        isActive: true,
        options: [
          { name: 'Size', value: 'Small' },
          { name: 'Packaging', value: 'Standard Box' }
        ]
      },
      {
        id: 'var-chips-10-2',
        variantName: 'Medium - Standard Box',
        additionalPrice: 1000,
        isActive: true,
        options: [
          { name: 'Size', value: 'Medium' },
          { name: 'Packaging', value: 'Standard Box' }
        ]
      },
      {
        id: 'var-chips-10-3',
        variantName: 'Large - Standard Box',
        additionalPrice: 2000,
        isActive: true,
        options: [
          { name: 'Size', value: 'Large' },
          { name: 'Packaging', value: 'Standard Box' }
        ]
      },
      {
        id: 'var-chips-10-4',
        variantName: 'Small - Gift Box',
        additionalPrice: 1500,
        isActive: true,
        options: [
          { name: 'Size', value: 'Small' },
          { name: 'Packaging', value: 'Gift Box' }
        ]
      },
      {
        id: 'var-chips-10-5',
        variantName: 'Medium - Gift Box',
        additionalPrice: 2500,
        isActive: true,
        options: [
          { name: 'Size', value: 'Medium' },
          { name: 'Packaging', value: 'Gift Box' }
        ]
      },
      {
        id: 'var-chips-10-6',
        variantName: 'Eco-friendly Package',
        variantDescription: 'Environmentally friendly packaging using biodegradable materials',
        additionalPrice: 1200,
        isActive: true,
        options: [
          { name: 'Packaging', value: 'Eco-friendly' }
        ]
      }
    ]
  },
  {
    id: 'SKU-CHIPS-11',
    category: 'Makanan Ringan',
    brand: 'Baskit',
    name: 'Keripik Kentang BBQ',
    size: '50gr',
    distributorPrice: 4700,
    consumerPrice: 8500,
    moq: 100,
    description: 'Keripik kentang rasa BBQ gurih dan lezat.',
    regions: [
      { area: 'Kota Bandung', distributorPrice: 4800, moq: 110 },
      { area: 'Kota Semarang', distributorPrice: 4750, moq: 100 },
    ],
    image: '/placeholder.svg',
  },
  {
    id: 'SKU-CHIPS-12',
    category: 'Makanan Ringan',
    brand: 'Baskit',
    name: 'Keripik Kentang Seaweed',
    size: '50gr',
    distributorPrice: 4800,
    consumerPrice: 9000,
    moq: 100,
    description: 'Keripik kentang dengan taburan rumput laut yang nikmat.',
    regions: [
      { area: 'Kota Tangerang', distributorPrice: 4850, moq: 100 },
      { area: 'Jakarta Selatan', distributorPrice: 4900, moq: 120 },
    ],
    image: '/placeholder.svg',
  },
  {
    id: 'SKU-TEA-20',
    category: 'Minuman',
    brand: 'Baskit',
    name: 'Teh Botol Jasmine',
    size: '350ml',
    distributorPrice: 5500,
    consumerPrice: 10000,
    moq: 80,
    description: 'Teh melati menyegarkan, manis seimbang untuk semua kalangan.',
    regions: [
      { area: 'Kota Tangerang', distributorPrice: 5400, moq: 80 },
      { area: 'Jakarta Barat', distributorPrice: 5600, moq: 90 },
      { area: 'Kota Semarang', distributorPrice: 5450, moq: 80 },
    ],
    image: '/placeholder.svg',
  },
  {
    id: 'SKU-TEA-21',
    category: 'Minuman',
    brand: 'Baskit',
    name: 'Teh Botol Less Sugar',
    size: '350ml',
    distributorPrice: 5600,
    consumerPrice: 10500,
    moq: 80,
    description: 'Varian teh melati dengan gula lebih rendah.',
    regions: [
      { area: 'Jakarta Timur', distributorPrice: 5700, moq: 90 },
      { area: 'Kota Bogor', distributorPrice: 5650, moq: 80 },
    ],
    image: '/placeholder.svg',
  },
  {
    id: 'SKU-SAUCE-15',
    category: 'Bumbu Dapur',
    brand: 'Baskit',
    name: 'Saus Sambal Pedas',
    size: '250gr',
    distributorPrice: 6000,
    consumerPrice: 12000,
    moq: 60,
    description: 'Saus sambal pedas nikmat dengan campuran cabai pilihan.',
    regions: [
      { area: 'Kabupaten Bandung', distributorPrice: 6100, moq: 60 },
      { area: 'Kota Malang', distributorPrice: 5900, moq: 70 },
    ],
    image: '/placeholder.svg',
  },
  {
    id: 'SKU-SAUCE-16',
    category: 'Bumbu Dapur',
    brand: 'Baskit',
    name: 'Saus Tomat Klasik',
    size: '250gr',
    distributorPrice: 5800,
    consumerPrice: 11000,
    moq: 60,
    description: 'Saus tomat dengan rasa klasik cocok untuk berbagai hidangan.',
    regions: [
      { area: 'Kota Solo', distributorPrice: 5900, moq: 60 },
      { area: 'Kota Yogyakarta', distributorPrice: 6000, moq: 60 },
    ],
    image: '/placeholder.svg',
  },
  {
    id: 'SKU-NOODLE-30',
    category: 'Mi Instan',
    brand: 'Baskit',
    name: 'Mi Instan Ayam Bawang',
    size: '70gr',
    distributorPrice: 2500,
    consumerPrice: 4000,
    moq: 200,
    description: 'Mi instan rasa ayam bawang favorit keluarga.',
    regions: [
      { area: 'Kota Bekasi', distributorPrice: 2550, moq: 200 },
      { area: 'Kota Surabaya', distributorPrice: 2600, moq: 220 },
      { area: 'Jakarta Utara', distributorPrice: 2650, moq: 240 },
    ],
    image: '/placeholder.svg',
  },
  {
    id: 'SKU-NOODLE-31',
    category: 'Mi Instan',
    brand: 'Baskit',
    name: 'Mi Instan Goreng Spesial',
    size: '85gr',
    distributorPrice: 2700,
    consumerPrice: 4500,
    moq: 200,
    description: 'Mi goreng dengan bumbu spesial yang menggugah selera.',
    regions: [
      { area: 'Kota Serang', distributorPrice: 2800, moq: 220 },
      { area: 'Kota Depok', distributorPrice: 2750, moq: 200 },
    ],
    image: '/placeholder.svg',
  },
  {
    id: 'SKU-BISCUIT-40',
    category: 'Biskuit',
    brand: 'Baskit',
    name: 'Biskuit Cokelat',
    size: '90gr',
    distributorPrice: 5000,
    consumerPrice: 9000,
    moq: 90,
    description: 'Biskuit renyah dengan lapisan cokelat.',
    regions: [
      { area: 'Jakarta Pusat', distributorPrice: 5100, moq: 100 },
      { area: 'Kota Semarang', distributorPrice: 5050, moq: 90 },
    ],
    image: '/placeholder.svg',
  },
  {
    id: 'SKU-BISCUIT-41',
    category: 'Biskuit',
    brand: 'Baskit',
    name: 'Biskuit Keju',
    size: '90gr',
    distributorPrice: 5200,
    consumerPrice: 9500,
    moq: 90,
    description: 'Biskuit gurih dengan rasa keju.',
    regions: [
      { area: 'Kota Malang', distributorPrice: 5250, moq: 100 },
      { area: 'Kota Denpasar', distributorPrice: 5400, moq: 100 },
    ],
    image: '/placeholder.svg',
  },
  {
    id: 'SKU-DRINK-50',
    category: 'Minuman Energi',
    brand: 'Baskit',
    name: 'Minuman Energi 250ml',
    size: '250ml',
    distributorPrice: 6500,
    consumerPrice: 12000,
    moq: 80,
    description: 'Minuman energi untuk mendukung aktivitas padat.',
    regions: [
      { area: 'Kota Medan', distributorPrice: 6600, moq: 90 },
      { area: 'Jakarta Selatan', distributorPrice: 6700, moq: 80 },
    ],
    image: '/placeholder.svg',
  },
  {
    id: 'SKU-DRINK-51',
    category: 'Minuman',
    brand: 'Baskit',
    name: 'Minuman Isotonik 350ml',
    size: '350ml',
    distributorPrice: 6000,
    consumerPrice: 11000,
    moq: 80,
    description: 'Minuman isotonik menyegarkan setelah berolahraga.',
    regions: [
      { area: 'Kota Cimahi', distributorPrice: 6100, moq: 80 },
      { area: 'Kota Yogyakarta', distributorPrice: 6150, moq: 80 },
    ],
    image: '/placeholder.svg',
  },
  {
    id: 'SKU-COFFEE-60',
    category: 'Kopi',
    brand: 'Baskit',
    name: 'Kopi Susu 200ml',
    size: '200ml',
    distributorPrice: 7000,
    consumerPrice: 13000,
    moq: 70,
    description: 'Kopi susu siap minum dengan rasa seimbang.',
    regions: [
      { area: 'Jakarta Barat', distributorPrice: 7100, moq: 80 },
      { area: 'Kota Surabaya', distributorPrice: 7050, moq: 70 },
    ],
    image: '/placeholder.svg',
  },
  {
    id: 'SKU-CEREAL-70',
    category: 'Camilan Sehat',
    brand: 'Baskit',
    name: 'Sereal Bar Cokelat',
    size: '25gr',
    distributorPrice: 3500,
    consumerPrice: 6500,
    moq: 150,
    description: 'Sereal bar praktis untuk energi saat bepergian.',
    regions: [
      { area: 'Kabupaten Tangerang', distributorPrice: 3600, moq: 150 },
      { area: 'Kota Bandung', distributorPrice: 3550, moq: 150 },
    ],
    image: '/placeholder.svg',
  },
  {
    id: 'SKU-CEREAL-71',
    category: 'Camilan Sehat',
    brand: 'Baskit',
    name: 'Sereal Bar Kacang',
    size: '25gr',
    distributorPrice: 3600,
    consumerPrice: 7000,
    moq: 150,
    description: 'Sereal bar dengan kacang untuk tambahan protein.',
    regions: [
      { area: 'Kota Magelang', distributorPrice: 3650, moq: 150 },
      { area: 'Kabupaten Badung', distributorPrice: 3800, moq: 150 },
    ],
    image: '/placeholder.svg',
  },
  {
    id: 'SKU-SNACK-80',
    category: 'Makanan Ringan',
    brand: 'Baskit',
    name: 'Kacang Panggang',
    size: '100gr',
    distributorPrice: 5000,
    consumerPrice: 9500,
    moq: 120,
    description: 'Kacang panggang gurih cocok untuk camilan.',
    regions: [
      { area: 'Jakarta Timur', distributorPrice: 5100, moq: 120 },
      { area: 'Kota Bogor', distributorPrice: 5050, moq: 120 },
    ],
    image: '/placeholder.svg',
  },
  {
    id: 'SKU-SNACK-81',
    category: 'Makanan Ringan',
    brand: 'Baskit',
    name: 'Kerupuk Udang',
    size: '80gr',
    distributorPrice: 4200,
    consumerPrice: 8000,
    moq: 120,
    description: 'Kerupuk udang renyah dengan rasa khas.',
    regions: [
      { area: 'Kota Mojokerto', distributorPrice: 4300, moq: 120 },
      { area: 'Kota Solo', distributorPrice: 4250, moq: 120 },
    ],
    image: '/placeholder.svg',
  },
];

// Indonesian cities/regencies for distribution areas
export const ALL_AREAS = [
  // Jakarta
  'Jakarta Pusat', 'Jakarta Timur', 'Jakarta Selatan', 'Jakarta Barat', 'Jakarta Utara',
  
  // Jawa Barat
  'Kota Bandung', 'Kabupaten Bandung', 'Kota Bogor', 'Kota Bekasi', 'Kota Depok', 'Kota Cimahi',
  'Kota Sukabumi', 'Kota Cirebon', 'Kota Tasikmalaya', 'Kabupaten Bogor', 'Kabupaten Bekasi',
  
  // Banten
  'Kota Tangerang', 'Kabupaten Tangerang', 'Kota Serang', 'Kota Cilegon',
  
  // Jawa Tengah
  'Kota Semarang', 'Kota Solo', 'Kota Yogyakarta', 'Kota Magelang', 'Kota Surakarta',
  'Kota Pekalongan', 'Kota Tegal', 'Kabupaten Semarang', 'Kabupaten Klaten',
  
  // Jawa Timur
  'Kota Surabaya', 'Kota Malang', 'Kota Mojokerto', 'Kota Kediri', 'Kota Blitar',
  'Kota Madiun', 'Kota Pasuruan', 'Kabupaten Malang', 'Kabupaten Sidoarjo',
  
  // Sumatera Utara
  'Kota Medan', 'Kota Binjai', 'Kota Pematangsiantar', 'Kabupaten Deli Serdang',
  
  // Bali
  'Kota Denpasar', 'Kabupaten Badung', 'Kabupaten Gianyar', 'Kabupaten Tabanan',
  
  // Other major cities
  'Kota Palembang', 'Kota Batam', 'Kota Makassar', 'Kota Banjarmasin', 'Kota Balikpapan'
].sort();

export const ALL_PROVINCES = ALL_AREAS; // For backward compatibility
