import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Hook that synchronizes the HTML lang attribute with the current i18n language
 * This is important for:
 * - Proper font rendering for different languages
 * - Screen reader language detection
 * - SEO and accessibility
 */
export function useLanguageSync() {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Update HTML lang attribute when language changes
    const htmlElement = document.documentElement;
    htmlElement.lang = i18n.language;
    
    // Also update dir for RTL languages if needed
    const rtlLanguages = ['ar', 'he', 'ur'];
    if (rtlLanguages.includes(i18n.language)) {
      htmlElement.dir = 'rtl';
    } else {
      htmlElement.dir = 'ltr';
    }
  }, [i18n.language]);
}

export default useLanguageSync;
