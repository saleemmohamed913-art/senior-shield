import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Hook that listens to language changes and triggers re-renders
 * Ensures all UI text updates immediately when language is switched
 * 
 * Usage:
 * const currentLanguage = useLanguageChange();
 */
export function useLanguageChange() {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  // Update state whenever i18n.language changes
  useEffect(() => {
    setCurrentLanguage(i18n.language);
  }, [i18n.language]);

  // Listen for languageChanged event
  useEffect(() => {
    const handleLanguageChange = (lng) => {
      setCurrentLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  return currentLanguage;
}

export default useLanguageChange;
