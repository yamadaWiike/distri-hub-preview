/**
 * Google Analytics Integration Component
 * Adds Google Analytics tracking to the application
 */

// Third-party imports
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Type definitions for Google Analytics global variables
 */
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

/**
 * Google Analytics Measurement ID
 * Used to identify the GA property for tracking
 */
const GA_MEASUREMENT_ID = 'G-ZQB310JSEZ';

/**
 * Google Analytics Component
 * Initializes GA tracking and monitors route changes
 */
const GoogleAnalytics: React.FC = () => {
  const location = useLocation();
  
  /**
   * Initialize Google Analytics on component mount
   * Loads the gtag.js script and configures the tracking ID
   */
  useEffect(() => {
    // Load the gtag.js script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    }
    
    // Configure analytics
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: false // Disable automatic page views, we'll handle them manually
    });

    // Make gtag available globally
    window.gtag = gtag;

    // Cleanup on unmount
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  /**
   * Track page views when route changes
   */
  useEffect(() => {
    if (!window.gtag) return;

    // Send a page view to Google Analytics when the route changes
    window.gtag('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: location.pathname + location.search
    });
  }, [location]);

  // This component doesn't render anything visible
  return null;
};

export default GoogleAnalytics;