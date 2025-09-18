import React, { createContext, useEffect, useMemo, useState, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Database } from "@/integrations/supabase/types";
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

export type User = {
  id?: string;
  email: string;
  namaBisnis?: string;
  kota?: string;
  role: 'user' | 'admin';
};

type DistributorProfile = Database['public']['Tables']['distributor_profiles']['Row'];

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { 
    email: string; 
    password: string; 
    namaBisnis: string; 
    alamatLengkap: string; 
    provinsiId: string; 
    kota: string; 
    namaPemilik: string; 
    kontakPemilik: string; 
  }) => Promise<void>;
  logout: () => void;
};

// Creating context in its own file to avoid fast refresh issues
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          try {
            // Get user profile from database using maybeSingle to avoid PGRST116 errors
            const { data: profile, error: profileError } = await supabase
              .from('distributor_profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .maybeSingle<Database['public']['Tables']['distributor_profiles']['Row']>();
              
            if (profileError && profileError.code !== 'PGRST116') {
              // Only log errors that aren't "no rows returned"
              console.error('Error fetching profile:', profileError);
            }
            
            // Set user data with or without profile
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              namaBisnis: profile?.nama_bisnis,
              kota: profile?.kota,
              role: session.user.app_metadata?.role || 'user'
            });
          } catch (err) {
            console.error('Profile fetch error:', err);
            // Fall back to basic user info
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              role: session.user.app_metadata?.role || 'user'
            });
          }
        } else {
          // Check local storage for fallback (for development until auth is fully implemented)
          const stored = localStorage.getItem('baskit_user');
          if (stored) setUser(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      if (data.user) {
        let userData: User = {
          id: data.user.id,
          email: data.user.email || '',
          role: data.user.app_metadata?.role || 'user'
        };
        
        try {
          const { data: profile, error: profileError } = await supabase
            .from('distributor_profiles')
            .select('*')
            .eq('user_id', data.user.id)
            .maybeSingle<Database['public']['Tables']['distributor_profiles']['Row']>();
            
          if (profileError && profileError.code !== 'PGRST116') {
            // Only log errors that aren't "no rows returned"
            console.error('Error fetching profile during login:', profileError);
          }
          
          if (profile) {
            userData = {
              ...userData,
              namaBisnis: profile.nama_bisnis,
              kota: profile.kota,
            };
          }
        } catch (err) {
          console.error('Profile fetch error during login:', err);
        }
        
        setUser(userData);
        // Keep local storage for fallback/development
        localStorage.setItem('baskit_user', JSON.stringify(userData));
        return;
      }
      
      throw new Error('Login failed. No user data returned.');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan";
      console.error('Login error:', errorMessage);
      toast({
        title: "Login Gagal",
        description: errorMessage || "Terjadi kesalahan saat login. Silakan coba lagi.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const register = async (data: { 
    email: string; 
    password: string; 
    namaBisnis: string; 
    alamatLengkap: string; 
    provinsiId: string; 
    kota: string; 
    namaPemilik: string; 
    kontakPemilik: string; 
  }) => {
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: 'user'
          }
        }
      });
      
      if (authError) throw authError;
      
      // Create distributor profile
      if (authData.user) {
        // Insert profile data into distributor_profiles table
        // Due to TypeScript issues with the Supabase types, we'll use a more direct approach
        let profileError = null;
        
        // Create the profile data object
        const profileData = {
          user_id: authData.user.id,
          email: data.email, // Add email to distributor_profiles
          nama_bisnis: data.namaBisnis,
          alamat_lengkap: data.alamatLengkap,
          kota: data.kota,
          nama_pemilik: data.namaPemilik,
          kontak_pemilik: data.kontakPemilik,
          status: 'pending'
          // Note: Removed provinsi_id for now since it expects UUID but we're sending string
          // The province data is stored as string in kota field for now
        };
        
        try {
          console.log('Creating distributor profile with data:', profileData);
          
          // Create profile - bypass TypeScript issues with explicit any
          const { data: insertResult, error } = await supabase
            .from('distributor_profiles')
            .insert(profileData as never)
            .select();
            
          console.log('Profile creation result:', { insertResult, error });
          profileError = error;
        } catch (err) {
          console.error('Profile creation error:', err);
          profileError = { message: 'Failed to create profile' };
        }
        
        if (profileError) {
          console.error('Profile creation error:', profileError);
          console.error('Profile error details:', {
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
            code: profileError.code
          });
          
          // If profile creation fails, still continue since the auth account was created
          toast({
            title: "Pendaftaran Berhasil",
            description: `Akun Anda berhasil dibuat tetapi ada masalah dengan data profil: ${profileError.message}. Silakan hubungi admin.`,
            variant: "default"
          });
        } else {
          toast({
            title: "Pendaftaran Berhasil",
            description: "Akun distributor Anda telah berhasil dibuat.",
            variant: "default"
          });
        }
        
        // Set user data in state
        const userData: User = {
          id: authData.user.id,
          email: data.email,
          namaBisnis: data.namaBisnis,
          kota: data.kota,
          role: 'user'
        };
        
        setUser(userData);
        // Keep local storage for fallback/development
        localStorage.setItem('baskit_user', JSON.stringify(userData));
      }
    } catch (error: unknown) {
      console.error('Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan";
      toast({
        title: "Pendaftaran Gagal",
        description: errorMessage || "Terjadi kesalahan saat mendaftar. Silakan coba lagi.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('baskit_user');
    setUser(null);
  };

  const value = useMemo(() => ({ user, isLoading, login, register, logout }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// useAuth moved to src/hooks/use-auth.ts
