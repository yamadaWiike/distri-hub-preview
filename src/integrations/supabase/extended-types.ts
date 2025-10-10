// Define types for catalog export analytics
import { Database as ExistingDatabase } from '@/integrations/supabase/types';

// Extend the existing Database type to include catalog_exports
export interface ExtendedDatabase extends ExistingDatabase {
  public: ExistingDatabase['public'] & {
    Tables: ExistingDatabase['public']['Tables'] & {
      catalog_exports: {
        Row: {
          id: string;
          user_id: string;
          exported_at: string;
          products_count: number;
          area: string | null;
          brand: string | null;
          min_price: number | null;
          max_price: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          exported_at?: string;
          products_count: number;
          area?: string | null;
          brand?: string | null;
          min_price?: number | null;
          max_price?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          exported_at?: string;
          products_count?: number;
          area?: string | null;
          brand?: string | null;
          min_price?: number | null;
          max_price?: number | null;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          status: 'pending' | 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
          total_amount: number;
          shipping_address: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          created_at: string;
          updated_at: string;
          order_number?: string | null;
          payment_status?: 'unpaid' | 'partially_paid' | 'paid' | null;
          payment_method?: string | null;
          distributor_id?: string | null;
          notes?: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          status: 'pending' | 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
          total_amount: number;
          shipping_address: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          created_at?: string;
          updated_at?: string;
          order_number?: string | null;
          payment_status?: 'unpaid' | 'partially_paid' | 'paid' | null;
          payment_method?: string | null;
          distributor_id?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?: 'pending' | 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
          total_amount?: number;
          shipping_address?: string;
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string;
          created_at?: string;
          updated_at?: string;
          order_number?: string | null;
          payment_status?: 'unpaid' | 'partially_paid' | 'paid' | null;
          payment_method?: string | null;
          distributor_id?: string | null;
          notes?: string | null;
        };
      };
    };
    Views: ExistingDatabase['public']['Views'] & {
      distributor_order_analytics: {
        Row: {
          distributor_id: string | null;
          business_name: string | null;
          status: string | null;
          order_count: number | null;
          total_value: number | null;
          first_order_date: string | null;
          latest_order_date: string | null;
        };
      };
      export_analytics: {
        Row: {
          user_id: string | null;
          email: string | null;
          business_name: string | null;
          export_count: number | null;
          total_products_exported: number | null;
          first_export_date: string | null;
          latest_export_date: string | null;
          exported_areas: string | null;
        };
      };
    };
  };
}