/**
 * Language Context Provider for Baskit Distributor Hub
 * Provides language switching functionality between Indonesian and English
 */

// Third-party imports
import React, { useCallback, useEffect, useMemo, useState } from "react";

// Import context definition
import { 
  Lang, 
  LanguageContext, 
  STORAGE_KEY 
} from "./LanguageContextDefinition";

/**
 * Language Provider Component
 * Manages language state and provides language switching functionality
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Initialize with Indonesian as default language
  const [lang, setLangState] = useState<Lang>('id');

  /**
   * Load saved language preference from localStorage on mount
   */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved === 'id' || saved === 'en') setLangState(saved);
  }, []);

  /**
   * Set language and persist to localStorage
   */
  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  /**
   * Toggle between Indonesian and English
   */
  const toggle = useCallback(() => setLang(lang === 'id' ? 'en' : 'id'), [lang]);

  /**
   * Memoized context value to prevent unnecessary re-renders
   */
  const value = useMemo(() => ({ lang, setLang, toggle }), [lang, toggle]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

// useLanguage hook is now in src/hooks/use-language.ts
