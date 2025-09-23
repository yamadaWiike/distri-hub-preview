import { useCallback } from 'react';

/**
 * Custom hook for using Google Analytics in React components
 */
export function useAnalytics() {
  /**
   * Track a custom event in Google Analytics
   * 
   * @param eventName - The name of the event to track
   * @param eventParams - Optional parameters to include with the event
   */
  const trackEvent = useCallback((eventName: string, eventParams?: Record<string, unknown>) => {
    if (!window.gtag) {
      console.warn('Google Analytics not loaded yet');
      return;
    }

    window.gtag('event', eventName, eventParams);
  }, []);

  return { trackEvent };
}