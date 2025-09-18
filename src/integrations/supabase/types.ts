// Minimal valid Supabase types for distributor_profiles and orders
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
          created_at?: string;
          updated_at?: string;
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
          created_at?: string;
          updated_at?: string;
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
          created_at?: string;
          updated_at?: string;
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
          payment_status: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
      };
    };
  };
}