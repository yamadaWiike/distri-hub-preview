// React
import React, { useEffect } from 'react';

// Hooks
import { useAuth } from '@/hooks/use-auth';

declare global {
  interface Window {
    hj: {
      (...args: unknown[]): void;
      q?: unknown[][];
    };
    _hjSettings: {
      hjid: number;
      hjsv: number;
    };
  }
}

const HOTJAR_ID = 5266624;
const HOTJAR_SNIPPET_VERSION = 6;

const Hotjar: React.FC = () => {
  const { user } = useAuth();

  // Initial Hotjar setup
  useEffect(() => {
    // Initialize Hotjar
    window.hj = window.hj || function(...args: unknown[]) {
      (window.hj.q = window.hj.q || []).push(args);
    };
    window._hjSettings = {
      hjid: HOTJAR_ID,
      hjsv: HOTJAR_SNIPPET_VERSION
    };

    // Create and add the script with error handling
    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.src = `https://static.hotjar.com/c/hotjar-${HOTJAR_ID}.js?sv=${HOTJAR_SNIPPET_VERSION}`;
    
    // Add error handling - silently fail if blocked
    script.onerror = () => {
      // Silently handle - Hotjar may be blocked by ad blockers or network policies
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
    
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      // Remove the script when component unmounts
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Identify user when they log in
  useEffect(() => {
    if (user && window.hj && user.id) {
      // Anonymize the actual user ID for privacy but still allow session tracking
      const anonymizedId = `user-${user.id.slice(-6)}`;
      
      // You can add additional user properties that are useful for segmentation
      const userProperties = {
        userType: user.role || 'customer',
        location: user.kota || 'unknown',
        business: user.namaBisnis ? 'yes' : 'no'
      };
      
      // Identify the user in Hotjar
      window.hj('identify', anonymizedId, userProperties);
    }
  }, [user]);

  return null; // This component doesn't render anything
};

export default Hotjar;