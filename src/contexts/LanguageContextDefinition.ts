/**
 * Language Context Definition
 * Defines types and context for language functionality
 */

import { createContext } from "react";

/**
 * Supported language codes
 * 'id' - Indonesian
 * 'en' - English
 */
export type Lang = 'id' | 'en';

/**
 * Language context interface
 */
export type LanguageContextType = {
  /** Current language code */
  lang: Lang;
  /** Function to change the language */
  setLang: (l: Lang) => void;
  /** Function to toggle between languages */
  toggle: () => void;
};

/**
 * Language context object
 */
export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * Storage key for persisting language preference
 */
export const STORAGE_KEY = 'baskit_lang';