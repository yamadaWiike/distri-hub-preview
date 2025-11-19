/**
 * Authentication Guards and API Security Utilities
 * Provides comprehensive protection for API access and sensitive operations
 */

import { supabase } from '@/integrations/supabase/client';
import { User } from '@/contexts/AuthContextDefinition';

/**
 * User profile interface for type safety
 */
interface UserProfile {
  status: string;
  nama_bisnis?: string;
  kota?: string;
}

/**
 * Authentication status and user data validation result
 */
export interface AuthValidationResult {
  isAuthenticated: boolean;
  user: User | null;
  hasRole: (role: string) => boolean;
  isAdmin: boolean;
  isApproved: boolean;
  canAccessAPI: boolean;
}

/**
 * Validates current authentication state and returns comprehensive auth info
 * @returns Promise<AuthValidationResult> Complete authentication validation result
 */
export async function validateAuth(): Promise<AuthValidationResult> {
  try {
    // Get current session from Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return createUnauthenticatedResult();
    }

    // Get fresh user data with profile
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return createUnauthenticatedResult();
    }

    // Fetch user profile for status validation
    const { data: profile } = await supabase
      .from('distributor_profiles')
      .select('status, nama_bisnis, kota')
      .eq('user_id', user.id)
      .maybeSingle();

    const userRole = user.app_metadata?.role || 'user';
    const userStatus: 'pending' | 'active' | 'inactive' | 'rejected' = 
      (profile as UserProfile)?.status as 'pending' | 'active' | 'inactive' | 'rejected' || 'pending';
    const isApproved = userStatus === 'active';
    const isAdmin = userRole === 'admin';

    // Create validated user object
    const validatedUser: User = {
      id: user.id,
      email: user.email || '',
      namaBisnis: (profile as UserProfile)?.nama_bisnis || undefined,
      kota: (profile as UserProfile)?.kota || undefined,
      role: userRole,
      status: userStatus,
      isApproved
    };

    return {
      isAuthenticated: true,
      user: validatedUser,
      hasRole: (role: string) => userRole === role,
      isAdmin,
      isApproved,
      canAccessAPI: isApproved || isAdmin // Admin can access even if not approved
    };

  } catch (error) {
    console.error('Auth validation error:', error);
    return createUnauthenticatedResult();
  }
}

/**
 * Creates a default unauthenticated result
 */
function createUnauthenticatedResult(): AuthValidationResult {
  return {
    isAuthenticated: false,
    user: null,
    hasRole: () => false,
    isAdmin: false,
    isApproved: false,
    canAccessAPI: false
  };
}

/**
 * Authentication guard for API operations
 * Throws error if user is not authenticated or not approved
 */
export async function requireAuth(): Promise<AuthValidationResult> {
  const authResult = await validateAuth();
  
  if (!authResult.isAuthenticated) {
    throw new Error('Authentication required. Please log in to access this resource.');
  }
  
  if (!authResult.canAccessAPI) {
    throw new Error('Account approval required. Your account is pending approval by an administrator.');
  }
  
  return authResult;
}

/**
 * Authentication guard for viewing products (allows pending users)
 * Only requires authentication, not approval
 */
export async function requireAuthForViewing(): Promise<AuthValidationResult> {
  const authResult = await validateAuth();
  
  if (!authResult.isAuthenticated) {
    throw new Error('Authentication required. Please log in to access this resource.');
  }
  
  // Allow pending users to view products (just not prices/order)
  return authResult;
}

/**
 * Admin-only authentication guard
 * Throws error if user is not an admin
 */
export async function requireAdmin(): Promise<AuthValidationResult> {
  const authResult = await requireAuth();
  
  if (!authResult.isAdmin) {
    throw new Error('Administrator privileges required. Access denied.');
  }
  
  return authResult;
}

/**
 * Role-based authentication guard
 * @param requiredRole The role required for access
 */
export async function requireRole(requiredRole: string): Promise<AuthValidationResult> {
  const authResult = await requireAuth();
  
  if (!authResult.hasRole(requiredRole) && !authResult.isAdmin) {
    throw new Error(`Role '${requiredRole}' required. Access denied.`);
  }
  
  return authResult;
}

/**
 * Middleware to wrap API functions with authentication
 * @param apiFunction The API function to protect
 * @param requiresApproval Whether the function requires approved status (default: true)
 * @param requiredRole Optional specific role requirement
 */
export function withAuth<T extends unknown[], R>(
  apiFunction: (...args: T) => Promise<R>,
  options: {
    requiresApproval?: boolean;
    requiredRole?: string;
    adminOnly?: boolean;
  } = {}
) {
  return async (...args: T): Promise<R> => {
    try {
      // Determine which guard to use based on options
      if (options.adminOnly) {
        await requireAdmin();
      } else if (options.requiredRole) {
        await requireRole(options.requiredRole);
      } else if (options.requiresApproval !== false) {
        await requireAuth();
      } else {
        // Just validate authentication without approval requirement
        const authResult = await validateAuth();
        if (!authResult.isAuthenticated) {
          throw new Error('Authentication required');
        }
      }
      
      // Execute the protected function
      return await apiFunction(...args);
      
    } catch (error) {
      // Re-throw auth errors
      if (error instanceof Error && (
        error.message.includes('Authentication required') ||
        error.message.includes('approval required') ||
        error.message.includes('privileges required') ||
        error.message.includes('Access denied')
      )) {
        throw error;
      }
      
      // Wrap other errors
      throw new Error(`API access failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
}

/**
 * Check if current session token is valid and not expired
 */
export async function validateSessionToken(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      return false;
    }
    
    // Check if token is expired
    const tokenExp = session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    
    if (tokenExp && tokenExp < now) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Refresh authentication token if needed
 */
export async function ensureValidToken(): Promise<void> {
  const isValid = await validateSessionToken();
  
  if (!isValid) {
    const { error } = await supabase.auth.refreshSession();
    if (error) {
      throw new Error('Session expired. Please log in again.');
    }
  }
}