import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from '../locales/en/translation.json';
import taTranslations from '../locales/ta/translation.json';
import hiTranslations from '../locales/hi/translation.json';
import mlTranslations from '../locales/ml/translation.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸', dir: 'ltr' },
  { code: 'ta', label: 'தமிழ்', flag: '🇮🇳', dir: 'ltr' },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳', dir: 'ltr' },
  { code: 'ml', label: 'മലയാളം', flag: '🇮🇳', dir: 'ltr' },
];

// Initialize i18next
if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: enTranslations },
        ta: { translation: taTranslations },
        hi: { translation: hiTranslations },
        ml: { translation: mlTranslations },
      },
      fallbackLng: 'en',           // ✅ Fixed typo: was fallbackLanguage
      supportedLngs: ['en', 'ta', 'hi', 'ml'],
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
        lookupLocalStorage: 'i18nextLng',
      },
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
        bindI18n: 'languageChanged loaded',
        bindI18nStore: 'added removed',
        transEmptyNodeValue: '',
        transSupportBasicHtmlNodes: true,
        transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'],
      },
    });

  // Persist language changes to localStorage
  i18n.on('languageChanged', (lng) => {
    console.log('🌐 Language changed to:', lng);
    localStorage.setItem('i18nextLng', lng);
    document.documentElement.lang = lng;
  });
}

/**
 * Get the saved language from localStorage or browser default
 * Returns language code (e.g., 'en', 'ta')
 */
export const getSavedLanguage = () => {
  return localStorage.getItem('i18nextLng') || 'en';
};

/**
 * Change the active language and persist it
 */
export const changeLanguage = (languageCode) => {
  console.log('📝 Attempting to change language to:', languageCode);
  return i18n.changeLanguage(languageCode).then((t) => {
    console.log('✅ Successfully changed language to:', languageCode);
    console.log('📊 Current i18n.language:', i18n.language);
    return t;
  }).catch((err) => {
    console.error('❌ Failed to change language:', err);
    throw err;
  });
};

/**
 * Get all supported languages
 */
export const getLanguages = () => SUPPORTED_LANGUAGES;

/**
 * Get language object by code
 */
export const getLanguageByCode = (code) => {
  return SUPPORTED_LANGUAGES.find((lang) => lang.code === code);
};

/**
 * Legacy function for backward compatibility
 * Maps old language codes to new ones
 */
export const t = (langCode, key, ...args) => {
  // Map old codes to new ones for backward compatibility
  const codeMap = {
    'en-US': 'en',
    'ta-IN': 'ta',
    'hi-IN': 'hi',
    'te-IN': 'te',
    'es-ES': 'es',
    'fr-FR': 'fr',
    'de-DE': 'de',
    'ar-SA': 'ar',
  };

  const mappedCode = codeMap[langCode] || langCode;
  return i18n.t(key, { lng: mappedCode, defaultValue: key });
};

export default i18n;
