/**
 * Distributor Approval Hook
 * Manages distributor approval status and access control
 */

import { useAuth } from "./use-auth";
import { useMemo } from "react";

export type AccessLevel = 'none' | 'limited' | 'full';

export interface DistributorAccess {
  // Status checks
  isPending: boolean;
  isActive: boolean;
  isRejected: boolean;
  isInactive: boolean;
  
  // Permission checks
  canViewPrices: boolean;
  canDownloadCatalog: boolean;
  canPlaceOrders: boolean;
  canAccessCart: boolean;
  canViewAnalytics: boolean;
  
  // Access level
  accessLevel: AccessLevel;
  
  // Status information
  statusMessage: string;
  statusColor: 'yellow' | 'green' | 'red' | 'gray';
}

/**
 * Hook to check distributor approval status and permissions
 */
export function useDistributorApproval(): DistributorAccess {
  const { user } = useAuth();
  
  return useMemo(() => {
    // No user logged in
    if (!user) {
      return {
        isPending: false,
        isActive: false,
        isRejected: false,
        isInactive: false,
        canViewPrices: false,
        canDownloadCatalog: false,
        canPlaceOrders: false,
        canAccessCart: false,
        canViewAnalytics: false,
        accessLevel: 'none' as AccessLevel,
        statusMessage: 'Please login to access distributor features',
        statusColor: 'gray' as const
      };
    }
    
    // Admin users have full access regardless of status
    if (user.role === 'admin') {
      return {
        isPending: false,
        isActive: true,
        isRejected: false,
        isInactive: false,
        canViewPrices: true,
        canDownloadCatalog: true,
        canPlaceOrders: true,
        canAccessCart: true,
        canViewAnalytics: true,
        accessLevel: 'full' as AccessLevel,
        statusMessage: 'Administrator Access',
        statusColor: 'green' as const
      };
    }
    
    const status = user.status || 'pending';
    const isApproved = user.isApproved || false;
    
    // Status checks
    const isPending = status === 'pending';
    const isActive = status === 'active' && isApproved;
    const isRejected = status === 'rejected';
    const isInactive = status === 'inactive';
    
    // Determine permissions based on status
    const canViewPrices = isActive;
    const canDownloadCatalog = isActive;
    const canPlaceOrders = isActive;
    const canAccessCart = isActive;
    const canViewAnalytics = false; // Only admins for now
    
    // Determine access level
    let accessLevel: AccessLevel = 'none';
    if (isActive) {
      accessLevel = 'full';
    } else if (isPending) {
      accessLevel = 'limited';
    }
    
    // Status message and color
    let statusMessage = '';
    let statusColor: 'yellow' | 'green' | 'red' | 'gray' = 'gray';
    
    if (isPending) {
      statusMessage = 'Account pending approval from administrator';
      statusColor = 'yellow';
    } else if (isActive) {
      statusMessage = 'Account active and approved';
      statusColor = 'green';
    } else if (isRejected) {
      statusMessage = 'Account application has been rejected';
      statusColor = 'red';
    } else if (isInactive) {
      statusMessage = 'Account has been deactivated';
      statusColor = 'red';
    } else {
      statusMessage = 'Account status unknown';
      statusColor = 'gray';
    }
    
    return {
      isPending,
      isActive,
      isRejected,
      isInactive,
      canViewPrices,
      canDownloadCatalog,
      canPlaceOrders,
      canAccessCart,
      canViewAnalytics,
      accessLevel,
      statusMessage,
      statusColor
    };
  }, [user]);
}

/**
 * Hook for components that require active/approved distributor status
 * Throws an error or redirects if user doesn't have proper access
 */
export function useRequireApproval() {
  const { user } = useAuth();
  const access = useDistributorApproval();
  
  return useMemo(() => ({
    ...access,
    requireActive: () => {
      if (!user) {
        throw new Error('Login required');
      }
      if (user.role !== 'admin' && !access.isActive) {
        throw new Error('Account approval required');
      }
    },
    requireLogin: () => {
      if (!user) {
        throw new Error('Login required');
      }
    }
  }), [user, access]);
}