// Enhanced Supabase types with comprehensive UOM integration
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      distributor_profiles: {
        Row: {
          id: string;
          user_id: string;
          nama_bisnis: string;
          alamat_lengkap: string;
          kota: string;
          nama_pemilik: string;
          kontak_pemilik: string;
          email?: string | null;
          status: string;
          role?: string | null;
          created_at?: string;
          updated_at?: string;
          // Extended fields
          omzet?: string | null;
          alamat_kantor?: string | null;
          alamat_gudang?: string | null;
          bentuk_usaha?: string | null;
          foto_gudang?: string | null;
          koordinat?: string | null;
          bank?: string | null;
          norek?: string | null;
          nama_rek?: string | null;
          nib?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          email_pemilik?: string | null;
          website_perusahaan?: string | null;
          jumlah_karyawan?: number | null;
          npwp?: string | null;
          province_id?: string | null;
          business_name?: string | null;
          contact_person?: string | null;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          province?: string | null;
          postal_code?: string | null;
          business_type?: string | null;
          distributor_license?: string | null;
          tax_id?: string | null;
          bank_account?: string | null;
          bank_name?: string | null;
          // New address fields for Indonesia regions
          province_name?: string | null;
          regency_id?: string | null;
          regency_name?: string | null;
          district_id?: string | null;
          district_name?: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          nama_bisnis: string;
          alamat_lengkap: string;
          kota: string;
          nama_pemilik: string;
          kontak_pemilik: string;
          email?: string | null;
          status?: string;
          role?: string | null;
          created_at?: string;
          updated_at?: string;
          // Extended fields
          omzet?: string | null;
          alamat_kantor?: string | null;
          alamat_gudang?: string | null;
          bentuk_usaha?: string | null;
          foto_gudang?: string | null;
          koordinat?: string | null;
          bank?: string | null;
          norek?: string | null;
          nama_rek?: string | null;
          nib?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          email_pemilik?: string | null;
          website_perusahaan?: string | null;
          jumlah_karyawan?: number | null;
          npwp?: string | null;
          province_id?: string | null;
          business_name?: string | null;
          contact_person?: string | null;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          province?: string | null;
          postal_code?: string | null;
          business_type?: string | null;
          distributor_license?: string | null;
          tax_id?: string | null;
          bank_account?: string | null;
          bank_name?: string | null;
          // New address fields for Indonesia regions
          province_name?: string | null;
          regency_id?: string | null;
          regency_name?: string | null;
          district_id?: string | null;
          district_name?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          nama_bisnis?: string;
          alamat_lengkap?: string;
          kota?: string;
          nama_pemilik?: string;
          kontak_pemilik?: string;
          email?: string | null;
          status?: string;
          role?: string | null;
          created_at?: string;
          updated_at?: string;
          // Extended fields
          omzet?: string | null;
          alamat_kantor?: string | null;
          alamat_gudang?: string | null;
          bentuk_usaha?: string | null;
          foto_gudang?: string | null;
          koordinat?: string | null;
          bank?: string | null;
          norek?: string | null;
          nama_rek?: string | null;
          nib?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          email_pemilik?: string | null;
          website_perusahaan?: string | null;
          jumlah_karyawan?: number | null;
          npwp?: string | null;
          province_id?: string | null;
          business_name?: string | null;
          contact_person?: string | null;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          province?: string | null;
          postal_code?: string | null;
          business_type?: string | null;
          distributor_license?: string | null;
          tax_id?: string | null;
          bank_account?: string | null;
          bank_name?: string | null;
          // New address fields for Indonesia regions
          province_name?: string | null;
          regency_id?: string | null;
          regency_name?: string | null;
          district_id?: string | null;
          district_name?: string | null;
        };
      };
      products: {
        Row: {
          id: string;
          sku: string;
          category_id: string | null;
          brand_id: string | null;
          name: string;
          size: string | null;
          base_distributor_price: number;
          consumer_price: number;
          base_moq: number;
          description: string | null;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          stock_quantity: number;
          province_id: number | null;
          distribution_area_id: number | null;
          regional_group_id: number | null;
          has_variants: boolean;
          // UOM fields
          base_uom: string;
          moq_uom: string;
          pricing_uom: string;
          enable_uom_conversions: boolean;
        };
        Insert: {
          id?: string;
          sku: string;
          category_id?: string | null;
          brand_id?: string | null;
          name: string;
          size?: string | null;
          base_distributor_price: number;
          consumer_price: number;
          base_moq?: number;
          description?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          stock_quantity?: number;
          province_id?: number | null;
          distribution_area_id?: number | null;
          regional_group_id?: number | null;
          has_variants?: boolean;
          // UOM fields
          base_uom?: string;
          moq_uom?: string;
          pricing_uom?: string;
          enable_uom_conversions?: boolean;
        };
        Update: {
          id?: string;
          sku?: string;
          category_id?: string | null;
          brand_id?: string | null;
          name?: string;
          size?: string | null;
          base_distributor_price?: number;
          consumer_price?: number;
          base_moq?: number;
          description?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          stock_quantity?: number;
          province_id?: number | null;
          distribution_area_id?: number | null;
          regional_group_id?: number | null;
          has_variants?: boolean;
          // UOM fields
          base_uom?: string;
          moq_uom?: string;
          pricing_uom?: string;
          enable_uom_conversions?: boolean;
        };
      };
      brands: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_categories: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      region_pricing: {
        Row: {
          id: string;
          product_id: string;
          area: string;
          distributor_price: number;
          moq: number;
          created_at: string;
          // Enhanced with UOM
          price_uom: string;
          moq_uom: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          area: string;
          distributor_price: number;
          moq: number;
          created_at?: string;
          // Enhanced with UOM
          price_uom?: string;
          moq_uom?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          area?: string;
          distributor_price?: number;
          moq?: number;
          created_at?: string;
          // Enhanced with UOM
          price_uom?: string;
          moq_uom?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          distributor_id: string;
          total_amount: number;
          status: string;
          order_number: string;
          shipping_address: string;
          shipping_city: string;
          shipping_notes: string | null;
          payment_method: string | null;
          payment_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          distributor_id: string;
          total_amount: number;
          status?: string;
          order_number: string;
          shipping_address: string;
          shipping_city: string;
          shipping_notes?: string | null;
          payment_method?: string | null;
          payment_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          distributor_id?: string;
          total_amount?: number;
          status?: string;
          order_number?: string;
          shipping_address?: string;
          shipping_city?: string;
          shipping_notes?: string | null;
          payment_method?: string | null;
          payment_status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          consumer_price: number;
          subtotal: number;
          created_at: string;
          // Enhanced with UOM
          uom: string;
          unit_uom: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          consumer_price: number;
          subtotal: number;
          created_at?: string;
          // Enhanced with UOM
          uom?: string;
          unit_uom?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          quantity?: number;
          unit_price?: number;
          consumer_price?: number;
          subtotal?: number;
          created_at?: string;
          // Enhanced with UOM
          uom?: string;
          unit_uom?: string;
        };
      };
      uom_units: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          symbol: string | null;
          category: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          symbol?: string | null;
          category?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          symbol?: string | null;
          category?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      uom_conversions: {
        Row: {
          id: string;
          product_id: string;
          from_uom: string;
          to_uom: string;
          conversion_factor: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          from_uom: string;
          to_uom: string;
          conversion_factor: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          from_uom?: string;
          to_uom?: string;
          conversion_factor?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      uom_pricing: {
        Row: {
          id: string;
          product_id: string;
          uom: string;
          area: string;
          distributor_price: number;
          moq: number;
          moq_uom: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          uom: string;
          area: string;
          distributor_price: number;
          moq: number;
          moq_uom: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          uom?: string;
          area?: string;
          distributor_price?: number;
          moq?: number;
          moq_uom?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          variant_name: string;
          variant_description: string | null;
          additional_price: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          variant_name: string;
          variant_description?: string | null;
          additional_price?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          variant_name?: string;
          variant_description?: string | null;
          additional_price?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      variant_options: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          type?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          type?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      products_with_uom: {
        Row: {
          id: string;
          sku: string;
          name: string;
          base_uom: string;
          moq_uom: string;
          pricing_uom: string;
          enable_uom_conversions: boolean;
          base_uom_description: string | null;
          base_uom_symbol: string | null;
          moq_uom_description: string | null;
          moq_uom_symbol: string | null;
          pricing_uom_description: string | null;
          pricing_uom_symbol: string | null;
        };
      };
      product_pricing_with_uom: {
        Row: {
          id: string;
          sku: string;
          name: string;
          base_uom: string;
          pricing_uom: string;
          enable_uom_conversions: boolean;
          region_area: string | null;
          region_price: number | null;
          region_moq: number | null;
          region_price_uom: string | null;
          region_moq_uom: string | null;
          uom_name: string | null;
          uom_area: string | null;
          uom_price: number | null;
          uom_moq: number | null;
          uom_moq_unit: string | null;
          uom_description: string | null;
          uom_symbol: string | null;
          uom_category: string | null;
        };
      };
    };
    Functions: {
      get_product_pricing_by_uom: {
        Args: {
          p_product_id: string;
          p_uom: string;
          p_area: string;
        };
        Returns: {
          product_id: string;
          uom: string;
          area: string;
          distributor_price: number;
          moq: number;
          moq_uom: string;
        }[];
      };
      convert_quantity_uom: {
        Args: {
          p_product_id: string;
          p_quantity: number;
          p_from_uom: string;
          p_to_uom: string;
        };
        Returns: number;
      };
    };
  };
}