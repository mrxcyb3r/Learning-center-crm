import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../types';
import { getTranslation } from '../translations';
import { formatCount, CounterNoun, COUNT_NOUNS } from '../utils/counter';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: ReturnType<typeof getTranslation>;
  translate: (uz: string, en?: string, ru?: string) => string;
  counter: (count: number, noun: CounterNoun | keyof typeof COUNT_NOUNS | string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Check if user has explicitly chosen a language
    const explicit = typeof window !== 'undefined' ? localStorage.getItem('app_language_user_explicit') : null;
    if (explicit === 'true') {
      const saved = (localStorage.getItem('app_language') || localStorage.getItem('language')) as Language | null;
      if (saved === 'UZ' || saved === 'RU' || saved === 'EN') {
        return saved;
      }
    }
    // Strict default: UZ (clean Uzbek UI by default)
    return 'UZ';
  });

  useEffect(() => {
    localStorage.setItem('app_language', language);
    localStorage.setItem('language', language);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language.toLowerCase();
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    localStorage.setItem('app_language_user_explicit', 'true');
    setLanguageState(lang);
  };

  const t = getTranslation(language);

  const translate = (uz: string, en?: string, ru?: string): string => {
    if (language === 'RU') return ru || en || uz;
    if (language === 'EN') return en || uz;
    return uz;
  };

  const counter = (count: number, noun: CounterNoun | keyof typeof COUNT_NOUNS | string): string => {
    return formatCount(count, noun, language);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translate, counter }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
