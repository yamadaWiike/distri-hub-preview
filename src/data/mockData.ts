import { UserProfile } from "@/components/admin/UserManager";
import { Database } from "@/integrations/supabase/types";

// Create types for our mock data
export type SKU = Database['public']['Tables']['skus']['Row'];
export type Order = {
  id: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
  shipping_address: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product_name: string;
};

// Generate dates
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const lastWeek = new Date(today);
lastWeek.setDate(lastWeek.getDate() - 7);

// Mock SKUs
export const mockSKUs: SKU[] = [
  {
    id: '1',
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
    id: '2',
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
    id: '3',
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

// Mock Orders
export const mockOrders: Order[] = [
  {
    id: 'order-1',
    user_id: 'user-1',
    status: 'pending',
    total_amount: 250000,
    created_at: today.toISOString(),
    updated_at: today.toISOString(),
    shipping_address: 'Jl. Sudirman No. 123, Jakarta Pusat',
    customer_name: 'Budi Santoso',
    customer_email: 'budi@example.com',
    customer_phone: '081234567890',
    items: [
      {
        id: 'item-1',
        order_id: 'order-1',
        product_id: '1',
        quantity: 3,
        unit_price: 45000,
        product_name: 'Baskit Fresh Noodles'
      },
      {
        id: 'item-2',
        order_id: 'order-1',
        product_id: '2',
        quantity: 1,
        unit_price: 120000,
        product_name: 'Baskit Premium Rice'
      }
    ]
  },
  {
    id: 'order-2',
    user_id: 'user-2',
    status: 'confirmed',
    total_amount: 175000,
    created_at: yesterday.toISOString(),
    updated_at: yesterday.toISOString(),
    shipping_address: 'Jl. Gatot Subroto No. 45, Jakarta Selatan',
    customer_name: 'Siti Rahayu',
    customer_email: 'siti@example.com',
    customer_phone: '081298765432',
    items: [
      {
        id: 'item-3',
        order_id: 'order-2',
        product_id: '3',
        quantity: 2,
        unit_price: 55000,
        product_name: 'Baskit Cooking Oil'
      },
      {
        id: 'item-4',
        order_id: 'order-2',
        product_id: '1',
        quantity: 1,
        unit_price: 45000,
        product_name: 'Baskit Fresh Noodles'
      }
    ]
  }
];

// Mock User Profiles
export const mockUserProfiles: UserProfile[] = [
  {
    id: 'profile-1',
    user_id: 'user-1',
    nama_bisnis: 'Warung Makan Sejahtera',
    alamat_lengkap: 'Jl. Raya Bogor No. 123, Depok',
    provinsi_id: 'jawa-barat',
    kota: 'Depok',
    nama_pemilik: 'Budi Santoso',
    kontak_pemilik: '081234567890',
    email_pemilik: 'budi@example.com',
    status: 'active',
    bentuk_usaha: 'Perorangan',
    created_at: lastWeek.toISOString(),
    approved_at: today.toISOString(),
    approved_by: 'rudy@baskit.app',
    omzet: 15000000,
    jumlah_karyawan: 5,
    website_perusahaan: null,
    npwp: '12.345.678.9-012.000'
  },
  {
    id: 'profile-2',
    user_id: 'user-2',
    nama_bisnis: 'Restoran Bahagia',
    alamat_lengkap: 'Jl. Margonda Raya No. 45, Depok',
    provinsi_id: 'jawa-barat',
    kota: 'Depok',
    nama_pemilik: 'Siti Rahayu',
    kontak_pemilik: '081298765432',
    email_pemilik: 'siti@example.com',
    status: 'pending',
    bentuk_usaha: 'PT',
    created_at: today.toISOString(),
    approved_at: null,
    approved_by: null,
    omzet: 50000000,
    jumlah_karyawan: 15,
    website_perusahaan: 'https://restoranbahagia.com',
    npwp: '23.456.789.0-123.000'
  },
  {
    id: 'profile-3',
    user_id: 'user-3',
    nama_bisnis: 'Baskit Indonesia',
    alamat_lengkap: 'Jl. Sudirman No. 10, Jakarta Pusat',
    provinsi_id: 'jakarta',
    kota: 'Jakarta Pusat',
    nama_pemilik: 'Rudy',
    kontak_pemilik: '08111223344',
    email_pemilik: 'rudy@baskit.app',
    status: 'active',
    bentuk_usaha: 'PT',
    created_at: lastWeek.toISOString(),
    approved_at: lastWeek.toISOString(),
    approved_by: 'system',
    omzet: 100000000,
    jumlah_karyawan: 30,
    website_perusahaan: 'https://baskit.app',
    npwp: '34.567.890.1-234.000'
  }
];
