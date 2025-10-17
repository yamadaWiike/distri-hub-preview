/**
 * API Access Security Hook
 * Provides secure API access with automatic authentication checks
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { validateAuth, requireAuth, requireAdmin } from '@/utils/auth-guards';
import { toast } from '@/components/ui/use-toast';

interface ApiAccessState {
  isAuthenticated: boolean;
  canAccessAPI: boolean;
  isAdmin: boolean;
  isValidating: boolean;
}

/**
 * Hook for secure API access
 * Automatically validates authentication before API calls
 */
export function useSecureAPI() {
  const { user, isLoading } = useAuth();
  const [apiState, setApiState] = useState<ApiAccessState>({
    isAuthenticated: false,
    canAccessAPI: false,
    isAdmin: false,
    isValidating: true
  });

  // Validate authentication state
  useEffect(() => {
    const validateAPIAccess = async () => {
      if (isLoading) return;

      try {
        const authResult = await validateAuth();
        setApiState({
          isAuthenticated: authResult.isAuthenticated,
          canAccessAPI: authResult.canAccessAPI,
          isAdmin: authResult.isAdmin,
          isValidating: false
        });
      } catch (error) {
        console.error('API access validation failed:', error);
        setApiState({
          isAuthenticated: false,
          canAccessAPI: false,
          isAdmin: false,
          isValidating: false
        });
      }
    };

    validateAPIAccess();
  }, [user, isLoading]);

  /**
   * Execute an API call with authentication checks
   */
  const secureCall = useCallback(async <T>(
    apiFunction: () => Promise<T>,
    options: {
      requiresApproval?: boolean;
      adminOnly?: boolean;
      errorMessage?: string;
    } = {}
  ): Promise<T | null> => {
    try {
      // Validate authentication based on requirements
      if (options.adminOnly) {
        await requireAdmin();
      } else if (options.requiresApproval !== false) {
        await requireAuth();
      }

      // Execute the API function
      return await apiFunction();

    } catch (error) {
      const message = error instanceof Error ? error.message : 'API access failed';
      
      // Show user-friendly error message
      toast({
        title: "Access Denied",
        description: options.errorMessage || message,
        variant: "destructive",
      });

      // Log the actual error for debugging
      console.error('Secure API call failed:', error);
      return null;
    }
  }, []);

  /**
   * Execute an admin-only API call
   */
  const adminCall = useCallback(async <T>(
    apiFunction: () => Promise<T>,
    errorMessage?: string
  ): Promise<T | null> => {
    return secureCall(apiFunction, { 
      adminOnly: true, 
      errorMessage: errorMessage || "Administrator privileges required for this operation."
    });
  }, [secureCall]);

  /**
   * Execute an approved-user API call
   */
  const approvedCall = useCallback(async <T>(
    apiFunction: () => Promise<T>,
    errorMessage?: string
  ): Promise<T | null> => {
    return secureCall(apiFunction, { 
      requiresApproval: true, 
      errorMessage: errorMessage || "Account approval required for this operation."
    });
  }, [secureCall]);

  return {
    ...apiState,
    secureCall,
    adminCall,
    approvedCall
  };
}

/**
 * Hook specifically for admin operations
 */
export function useAdminAPI() {
  const { adminCall, isAdmin, isValidating } = useSecureAPI();

  return {
    adminCall,
    isAdmin,
    isValidating,
    canAccessAdmin: isAdmin
  };
}

/**
 * Higher-order component to wrap components with API security
 */
export function withSecureAPI<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requiresApproval?: boolean;
    adminOnly?: boolean;
    fallbackComponent?: React.ComponentType;
  } = {}
) {
  return function SecureAPIWrapper(props: P) {
    const { canAccessAPI, isAdmin, isValidating } = useSecureAPI();

    // Show loading state
    if (isValidating) {
      const FallbackComponent = options.fallbackComponent;
      return FallbackComponent ? <FallbackComponent /> : <div>Loading...</div>;
    }

    // Check admin requirements
    if (options.adminOnly && !isAdmin) {
      const FallbackComponent = options.fallbackComponent;
      return FallbackComponent ? <FallbackComponent /> : <div>Access Denied</div>;
    }

    // Check approval requirements
    if (options.requiresApproval !== false && !canAccessAPI && !isAdmin) {
      const FallbackComponent = options.fallbackComponent;
      return FallbackComponent ? <FallbackComponent /> : <div>Approval Required</div>;
    }

    return <Component {...props} />;
  };
}