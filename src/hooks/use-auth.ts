/**
 * Authentication hook
 * Used to access the current user and auth functions
 */

import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContextDefinition";

/**
 * Custom hook for accessing the authentication context
 * Must be used within an AuthProvider
 * 
 * @returns The auth context containing user, isLoading, login, register, and logout
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
