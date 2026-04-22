// Supported languages
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  ja: '日本語',
  zh: '中文',
  hi: 'हिन्दी',
  ar: 'العربية',
};

// Font size options
export const FONT_SIZES = {
  sm: '14px',
  md: '16px',
  lg: '18px',
  xl: '20px',
  xxl: '24px',
};

// Medical conditions (common ones - expandable)
export const MEDICAL_CONDITIONS = [
  'Diabetes',
  'Hypertension',
  'Heart Disease',
  'Asthma',
  'COPD',
  'Arthritis',
  'Alzheimer\'s',
  'Parkinson\'s',
  'Stroke History',
  'Cancer',
  'Kidney Disease',
  'Liver Disease',
  'Other',
];

// Inactivity timeout (10 minutes)
export const INACTIVITY_TIMEOUT = 10 * 60 * 1000;

// SOS countdown duration
export const SOS_COUNTDOWN = 15;

// Maps API
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
export const GOOGLE_TRANSLATE_API_KEY = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY;

// Validation patterns
export const PATTERNS = {
  phone: /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
};

// Firebase Collections
export const COLLECTIONS = {
  USERS: 'users',
  SOS_LOGS: 'sos_logs',
};
