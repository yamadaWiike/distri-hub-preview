import { useCallback } from 'react';

/**
 * Custom hook for Hotjar functionality in React components
 */
export function useHotjar() {
  /**
   * Identify a user in Hotjar
   * 
   * @param userId - The user's unique identifier
   * @param userProperties - Additional user properties
   */
  const identifyUser = useCallback((userId: string, userProperties?: Record<string, string>) => {
    if (!window.hj) {
      console.warn('Hotjar not loaded yet');
      return;
    }

    window.hj('identify', userId, userProperties);
  }, []);

  /**
   * Trigger a Hotjar event
   * 
   * @param eventName - The name of the event to track
   */
  const triggerEvent = useCallback((eventName: string) => {
    if (!window.hj) {
      console.warn('Hotjar not loaded yet');
      return;
    }

    window.hj('event', eventName);
  }, []);

  /**
   * Manually trigger Hotjar recording
   */
  const triggerRecording = useCallback(() => {
    if (!window.hj) {
      console.warn('Hotjar not loaded yet');
      return;
    }

    window.hj('trigger');
  }, []);

  return { identifyUser, triggerEvent, triggerRecording };
}