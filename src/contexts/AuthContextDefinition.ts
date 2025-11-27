/**
 * Auth Context Definition
 * Defines types and context for authentication functionality
 */

import { createContext } from "react";
import { Database } from "@/integrations/supabase/types";

/**
 * User type representing an authenticated user
 */
export type User = {
  id?: string;
  email: string;
  namaBisnis?: string;
  kota?: string;
  role: 'user' | 'admin';
  status?: 'pending' | 'active' | 'inactive' | 'rejected';
  isApproved?: boolean; // Computed field for easy access
  profileComplete?: boolean; // Profile completion status
};

/**
 * Type representing distributor profile data from database
 */
export type DistributorProfile = Database['public']['Tables']['distributor_profiles']['Row'];

/**
 * Registration data type for new user accounts
 */
export type RegistrationData = { 
  email: string; 
  password: string; 
  namaBisnis: string; 
  alamatLengkap: string; 
  provinsiId: string; 
  kota: string; 
  namaPemilik: string; 
  kontakPemilik: string;
  // Additional company information
  emailPerusahaan?: string;
  nomorTelpPerusahaan?: string;
  namaDirektur?: string;
  statusPkp?: string;
  npwpNumber?: string;
  nibNumber?: string;
  // KYB Documents
  ktpUrl?: string;
  aktaUrl?: string;
  npwpUrl?: string;
  storePhotoUrl?: string;
};

/**
 * Authentication context interface
 */
export type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegistrationData) => Promise<void>;
  logout: () => void;
};

/**
 * Auth context object
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);