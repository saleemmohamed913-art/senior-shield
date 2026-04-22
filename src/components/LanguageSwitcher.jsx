import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiGlobe } from 'react-icons/fi';

/**
 * LanguageSwitcher Component
 * Provides UI to select between available languages
 * Supports different display modes: dropdown, buttons, or custom
 */
export default function LanguageSwitcher({ mode = 'dropdown', showLabel = true, onChange }) {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
  ];

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    if (onChange) onChange(langCode);
  };

  if (mode === 'dropdown') {
    return (
      <div className="flex items-center gap-3">
        {showLabel && (
          <>
            <FiGlobe size={20} className="text-gray-400 shrink-0" />
            <span className="text-base font-medium">Language</span>
          </>
        )}
        <select
          value={i18n.language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (mode === 'buttons') {
    return (
      <div className="flex gap-2">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              i18n.language === lang.code
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {lang.flag} {lang.label}
          </button>
        ))}
      </div>
    );
  }

  if (mode === 'compact') {
    return (
      <div className="flex items-center gap-2">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              i18n.language === lang.code
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={lang.label}
          >
            {lang.flag}
          </button>
        ))}
      </div>
    );
  }

  // Custom render if needed
  return null;
}
