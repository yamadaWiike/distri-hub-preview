/**
 * Authentication Context Provider for Baskit Distributor Hub
 * Manages user authentication state, login, registration and session management
 */

// Third-party imports
import React, { useEffect, useMemo, useState } from "react";
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

// Supabase client
import { supabase } from "@/integrations/supabase/client";

// UI components
import { toast } from "@/components/ui/use-toast";

// Import context and types from definition file
import { 
  AuthContext,
  User,
  RegistrationData,
  DistributorProfile
} from "./AuthContextDefinition";

// Import database types
import { Database } from "@/integrations/supabase/types";

/**
 * Authentication Provider Component
 * Manages authentication state and provides methods for login, register, and logout
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Check for existing user session on component mount
   * Retrieves user session from Supabase and loads associated profile data
   */
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Get current session from Supabase Auth
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
            const userStatus = profile?.status as 'pending' | 'active' | 'inactive' | 'rejected' || 'pending';
            
            // Check if profile is complete (required fields filled)
            const profileComplete = Boolean(
              profile?.nama_bisnis &&
              profile?.alamat_lengkap &&
              profile?.kota &&
              profile?.nama_pemilik &&
              profile?.kontak_pemilik &&
              profile?.email_pemilik
            );
            
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              namaBisnis: profile?.nama_bisnis,
              kota: profile?.kota,
              role: session.user.app_metadata?.role || 'user',
              status: userStatus,
              isApproved: userStatus === 'active',
              profileComplete: profileComplete
            });
          } catch (err) {
            console.error('Profile fetch error:', err);
            // Fall back to basic user info
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              role: session.user.app_metadata?.role || 'user',
              status: 'pending',
              isApproved: false
            });
          }
        } else {
          // Check local storage for fallback (for development until auth is fully implemented)
          const stored = localStorage.getItem('baskit_user');
          if (stored) {
            try {
              const userData = JSON.parse(stored);
              // Validate that user ID is a proper UUID format
              const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
              
              if (userData.id && uuidRegex.test(userData.id)) {
                setUser(userData);
              } else {
                console.warn('Invalid user ID in localStorage, clearing stored user data');
                localStorage.removeItem('baskit_user');
              }
            } catch (err) {
              console.error('Error parsing stored user data:', err);
              localStorage.removeItem('baskit_user');
            }
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
  }, []);

  /**
   * User login function
   * Signs in with Supabase Auth and retrieves associated profile data
   * 
   * @param email - User email address
   * @param password - User password
   */
  const login = async (email: string, password: string) => {
    try {
      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Initialize user data with basic auth info
        let userData: User = {
          id: data.user.id,
          email: data.user.email || '',
          role: data.user.app_metadata?.role || 'user',
          status: 'pending',
          isApproved: false
        };
        
        try {
          // Fetch associated profile data
          const { data: profile, error: profileError } = await supabase
            .from('distributor_profiles')
            .select('*')
            .eq('user_id', data.user.id)
            .maybeSingle<Database['public']['Tables']['distributor_profiles']['Row']>();
            
          if (profileError && profileError.code !== 'PGRST116') {
            // Only log errors that aren't "no rows returned"
            console.error('Error fetching profile during login:', profileError);
          }
          
          // Enhance user data with profile info if available
          if (profile) {
            const profileStatus = profile.status as 'pending' | 'active' | 'inactive' | 'rejected' || 'pending';
            
            // Check if profile is complete (required fields filled)
            const profileComplete = Boolean(
              profile.nama_bisnis &&
              profile.alamat_lengkap &&
              profile.kota &&
              profile.nama_pemilik &&
              profile.kontak_pemilik &&
              profile.email_pemilik
            );
            
            userData = {
              ...userData,
              namaBisnis: profile.nama_bisnis,
              kota: profile.kota,
              status: profileStatus,
              isApproved: profileStatus === 'active',
              profileComplete: profileComplete
            };
          }
        } catch (err) {
          console.error('Profile fetch error during login:', err);
        }
        
        // Update application state
        setUser(userData);
        
        // Keep local storage for fallback/development
        localStorage.setItem('baskit_user', JSON.stringify(userData));
        return;
      }
      
      throw new Error('Login failed. No user data returned.');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan";
      console.error('Login error:', errorMessage);
      
      // Show error toast
      toast({
        title: "Login Gagal",
        description: errorMessage || "Terjadi kesalahan saat login. Silakan coba lagi.",
        variant: "destructive"
      });
      
      throw error;
    }
  };

  /**
   * User registration function
   * Creates new account in Supabase Auth and associated distributor profile
   * 
   * @param data - Registration data object containing user and profile information
   */
  const register = async (data: RegistrationData) => {
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
      
      // Create distributor profile if user was created successfully
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
          status: 'pending',
          // New address fields for Indonesia regions
          province_id: data.provinsiId || null,
          province_name: data.provinceName || null,
          regency_id: data.regencyId || null,
          regency_name: data.regencyName || null,
          district_id: data.districtId || null,
          district_name: data.districtName || null,
          // Additional company information
          email_perusahaan: data.emailPerusahaan || null,
          nomor_telp_perusahaan: data.nomorTelpPerusahaan || null,
          nama_direktur: data.namaDirektur || null,
          status_pkp: data.statusPkp || 'Non-PKP',
          npwp_number: data.npwpNumber || null,
          nib_number: data.nibNumber || null,
          // KYB Documents
          store_photo_url: data.storePhotoUrl || null,
          ktp_url: data.ktpUrl || null,
          akta_url: data.aktaUrl || null,
          npwp_url: data.npwpUrl || null,
        };
        
        try {
          // Create profile with proper error logging
          const { data: insertResult, error } = await supabase
            .from('distributor_profiles')
            .insert(profileData)
            .select();
            
          if (error) {
            console.error('Profile creation error:', error);
            console.log('Profile data that failed:', profileData);
          }
          profileError = error;
        } catch (err) {
          console.error('Profile creation exception:', err);
          profileError = { message: 'Failed to create profile due to exception' };
        }
        
        // Handle profile creation result
        if (profileError) {
          // If profile creation fails, throw an error so Daftar.tsx can handle it
          throw new Error(`Profile creation failed: ${profileError.message}`);
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
          role: 'user',
          status: 'pending',
          isApproved: false // New registrations need approval
        };
        
        setUser(userData);
        // Keep local storage for fallback/development
        localStorage.setItem('baskit_user', JSON.stringify(userData));
      }
    } catch (error: unknown) {
      console.error('Registration error:', error);
      
      // Don't show toast here - let the component handle the error display
      // This prevents double error messages
      
      // Re-throw error for component handling
      throw error;
    }
  };

  /**
   * User logout function
   * Clears user data from state and local storage
   */
  const logout = () => {
    // Remove from local storage
    localStorage.removeItem('baskit_user');
    
    // Clear user from state
    setUser(null);
    
    // Note: In a full implementation, this would also call supabase.auth.signOut()
  };

  // Create memoized context value
  const value = useMemo(
    () => ({ user, isLoading, login, register, logout }), 
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Note: useAuth hook implementation moved to src/hooks/use-auth.ts
