import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

// Google Analytics Measurement ID
const GA_MEASUREMENT_ID = 'G-ZQB310JSEZ';

const GoogleAnalytics: React.FC = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Load the gtag.js script
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script1);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    }
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: false // Disable automatic page views, we'll handle them manually
    });

    // Make gtag available globally
    window.gtag = gtag;

    // Cleanup
    return () => {
      if (document.head.contains(script1)) {
        document.head.removeChild(script1);
      }
    };
  }, []);

  // Track page views
  useEffect(() => {
    if (!window.gtag) return;

    // Send a page view to Google Analytics when the route changes
    window.gtag('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: location.pathname + location.search
    });
  }, [location]);

  return null; // This component doesn't render anything
};

export default GoogleAnalytics;