/**
 * Protected Route Components for Role-Based Access Control
 * Provides route-level security based on authentication and user roles
 */

// React & Router
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// External Libraries
import { Loader2, AlertTriangle, Lock } from 'lucide-react';

// UI Components
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

// Hooks
import { useAuth } from '@/hooks/use-auth';

// Utils
import { validateAuth, AuthValidationResult } from '@/utils/auth-guards';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresApproval?: boolean;
  requiredRole?: string;
  adminOnly?: boolean;
  fallbackPath?: string;
}

/**
 * Protected Route Component
 * Validates authentication and authorization before rendering children
 */
export function ProtectedRoute({
  children,
  requiresApproval = true,
  requiredRole,
  adminOnly = false,
  fallbackPath = '/masuk'
}: ProtectedRouteProps) {
  const [authState, setAuthState] = useState<AuthValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const validateRouteAccess = async () => {
      try {
        setIsValidating(true);
        const validation = await validateAuth();
        setAuthState(validation);

        // If not authenticated, redirect to login
        if (!validation.isAuthenticated) {
          navigate(fallbackPath, { replace: true });
          return;
        }

        // If admin access required but user is not admin
        if (adminOnly && !validation.isAdmin) {
          navigate('/unauthorized', { replace: true });
          return;
        }

        // If specific role required but user doesn't have it (and isn't admin)
        if (requiredRole && !validation.hasRole(requiredRole) && !validation.isAdmin) {
          navigate('/unauthorized', { replace: true });
          return;
        }

        // If approval required but user is not approved (and isn't admin)
        if (requiresApproval && !validation.canAccessAPI) {
          // Allow showing pending approval message instead of redirect
          return;
        }

      } catch (error) {
        console.error('Route validation error:', error);
        navigate(fallbackPath, { replace: true });
      } finally {
        setIsValidating(false);
      }
    };

    // Only validate if auth context is loaded
    if (!isLoading) {
      validateRouteAccess();
    }
  }, [user, isLoading, adminOnly, requiredRole, requiresApproval, navigate, fallbackPath]);

  // Show loading state while validating
  if (isLoading || isValidating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Validating access...</span>
        </div>
      </div>
    );
  }

  // Show error state if validation failed
  if (!authState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Validation Failed</AlertTitle>
          <AlertDescription>
            Unable to validate your access permissions. Please try logging in again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show pending approval message if user needs approval
  if (requiresApproval && !authState.canAccessAPI) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <Lock className="h-4 w-4" />
          <AlertTitle>Account Pending Approval</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>Your account is currently pending approval by an administrator.</p>
            <p>You will receive access once your account has been reviewed and approved.</p>
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              className="w-full mt-3"
            >
              Return to Dashboard
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Render children if all validations pass
  return <>{children}</>;
}

/**
 * Admin-only Route Component
 * Shorthand for routes that require admin privileges
 */
export function AdminRoute({ children, fallbackPath = '/dashboard' }: { 
  children: React.ReactNode;
  fallbackPath?: string;
}) {
  return (
    <ProtectedRoute 
      adminOnly={true} 
      requiresApproval={false} 
      fallbackPath={fallbackPath}
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * Approved User Route Component  
 * For routes that require approved status
 */
export function ApprovedRoute({ children, fallbackPath = '/masuk' }: {
  children: React.ReactNode;
  fallbackPath?: string;
}) {
  return (
    <ProtectedRoute 
      requiresApproval={true} 
      fallbackPath={fallbackPath}
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * Role-based Route Component
 * For routes that require specific roles
 */
export function RoleBasedRoute({ 
  children, 
  requiredRole, 
  fallbackPath = '/dashboard' 
}: {
  children: React.ReactNode;
  requiredRole: string;
  fallbackPath?: string;
}) {
  return (
    <ProtectedRoute 
      requiredRole={requiredRole}
      requiresApproval={true}
      fallbackPath={fallbackPath}
    >
      {children}
    </ProtectedRoute>
  );
}