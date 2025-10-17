import { createClient } from '@supabase/supabase-js';
import type { ExtendedDatabase } from './extended-types';

// Using environment variables for security
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate environment variables are set
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables. Check your .env file.');
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<ExtendedDatabase>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

/**
 * Check if the current user has admin role
 * @returns {Promise<boolean>} Whether the user is an admin
 */
export const isAdmin = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    // First check jwt claims if they exist
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      const claims = JSON.parse(atob(session.access_token.split('.')[1]));
      if (claims && claims.role === 'admin') {
        return true;
      }
    }
    
    // Check user app_metadata for admin role (server-side managed)
    if (user.app_metadata?.role === 'admin') {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};