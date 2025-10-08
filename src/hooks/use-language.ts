/**
 * Language context hook
 * Used to access the current language and language changing functions
 */

import { useContext } from "react";
import { LanguageContext } from "@/contexts/LanguageContextDefinition";

/**
 * Custom hook for accessing the language context
 * Must be used within a LanguageProvider
 * 
 * @returns The language context containing lang, setLang and toggle functions
 */
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}