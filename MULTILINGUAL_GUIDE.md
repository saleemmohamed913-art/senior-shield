# Multilingual Support Guide - Senior Shield

This guide explains how the multilingual system works in Senior Shield and how to add support for more languages.

## Overview

The application uses **i18next** for internationalization (i18n), which provides:
- **Lazy loading** of translation files
- **Dynamic language switching** without page reload
- **LocalStorage persistence** of language preference
- **Automatic browser language detection**
- **Fallback to English** if translations are missing

## Current Supported Languages

- **English (en)** - Default language
- **Tamil (ta)** - நீங்கள் தமிழில் பேச முடியும்!

## Project Structure

```
src/
├── utils/
│   └── i18n.js                 # i18next configuration & setup
├── hooks/
│   └── useLanguageSync.js      # Hook to sync HTML lang attribute
├── components/
│   └── LanguageSwitcher.jsx    # Language switcher component
└── pages/
    ├── Dashboard.jsx           # Example: uses translations
    └── Settings.jsx            # Language selection page

public/
└── locales/
    ├── en/
    │   └── translation.json    # English translations
    └── ta/
        └── translation.json    # Tamil translations
```

## Using Translations in Components

### 1. Basic Usage with Hooks

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <h1>{t('dashboard.greeting')} {userName}</h1>
      <button onClick={() => i18n.changeLanguage('ta')}>
        Switch to Tamil
      </button>
    </div>
  );
}
```

### 2. Translation Keys Structure

The translation files are organized hierarchically by feature:

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel"
  },
  "dashboard": {
    "greeting": "Hi",
    "tapForHelp": "Tap for Help"
  },
  "auth": {
    "login": "Login",
    "phoneNumber": "Phone Number"
  }
}
```

### 3. Using the LanguageSwitcher Component

```jsx
import LanguageSwitcher from '../components/LanguageSwitcher';

// Dropdown mode (recommended for Settings)
<LanguageSwitcher mode="dropdown" />

// Button mode (good for home page)
<LanguageSwitcher mode="buttons" />

// Compact mode (small toggles)
<LanguageSwitcher mode="compact" />

// With custom callback
<LanguageSwitcher 
  mode="dropdown"
  onChange={(langCode) => console.log('Language changed to:', langCode)}
/>
```

### 4. Programmatic Language Change

```jsx
import i18n from 'i18next';
import { changeLanguage, getSavedLanguage } from '../utils/i18n';

// Change language
i18n.changeLanguage('ta');

// Or use the helper function
changeLanguage('ta');

// Get current language
const currentLang = i18n.language;
const savedLang = getSavedLanguage();
```

## Adding a New Language

### Step 1: Create Translation File

Create `public/locales/{lang-code}/translation.json`:

```
public/locales/hi/translation.json
public/locales/es/translation.json
```

### Step 2: Add Language to Constants

Update `src/utils/i18n.js`:

```javascript
export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸', dir: 'ltr' },
  { code: 'ta', label: 'தமிழ்', flag: '🇮🇳', dir: 'ltr' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳', dir: 'ltr' },  // New language
];
```

### Step 3: Import and Register in i18n Config

```javascript
import hiTranslations from '../../public/locales/hi/translation.json';

// In the i18n.init() config:
resources: {
  en: { translation: enTranslations },
  ta: { translation: taTranslations },
  hi: { translation: hiTranslations },  // Add new resource
}
```

### Step 4: (Optional) Add Font Support

For scripts with special rendering needs, update `src/index.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap');

html[lang="hi"] body {
  font-family: 'Noto Sans Devanagari', -apple-system, system-ui, sans-serif;
}
```

### Step 5: Add to Language Switcher

Update the select options in `src/components/LanguageSwitcher.jsx`:

```jsx
const languages = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },  // Add new option
];
```

## Example: Adding Tamil Translation

### File: `public/locales/ta/translation.json`

```json
{
  "dashboard": {
    "greeting": "வணக்கம்",
    "youAreSafe": "நீங்கள் பாதுகாப்பில் இருக்கிறீர்கள்",
    "sosAlert": "அவசரநிலை! SOS எச்சரிக்கை அனுப்புகிறது."
  }
}
```

## Font Rendering for Tamil

The app uses **Noto Sans Tamil** from Google Fonts for proper rendering:

- ✅ Supports all Tamil characters
- ✅ Good line spacing for longer Tamil text (line-height: 1.6)
- ✅ Automatic font switching based on language
- ✅ Fallback fonts for offline use

### Tamil Text Considerations

Tamil text is typically 20-30% longer than English. UI considerations:

- **Buttons**: Use `text-sm` or `px-3 py-2` (smaller padding)
- **Cards**: Ensure `flex-wrap` is allowed
- **Line breaks**: Use `line-clamp` carefully
- **Form labels**: Keep concise or use flex column layout

Example responsive button:

```jsx
<button className="px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base whitespace-nowrap">
  {t('common.save')}
</button>
```

## Language Persistence

Language preference is automatically saved to localStorage:

- Key: `i18nextLng`
- Persists across browser sessions
- Falls back to browser's language if not set
- Falls back to English if browser language not supported

## Testing Translations

### 1. Check Current Language

```jsx
import { useTranslation } from 'react-i18next';

const { i18n } = useTranslation();
console.log('Current language:', i18n.language);
console.log('HTML lang:', document.documentElement.lang);
```

### 2. Test Language Switch

```jsx
import i18n from 'i18next';

// In browser console:
i18n.changeLanguage('ta');
```

### 3. Check localStorage

```javascript
// In browser console:
localStorage.getItem('i18nextLng')  // Should show 'ta' if Tamil is selected
```

## Common Issues

### Translation Not Showing?

1. **Check translation key exists**:
   ```javascript
   const { t } = useTranslation();
   console.log(t('dashboard.greeting')); // Should show translated text
   ```

2. **Verify file location**: `public/locales/{lang}/translation.json`

3. **Clear browser cache**: localStorage and service worker cache

4. **Check i18n initialization**: Ensure `i18n.js` is imported in `main.jsx`

### Language Not Persisting?

1. **Check localStorage**: `localStorage.getItem('i18nextLng')`
2. **Verify localStorage is not disabled** in browser
3. **Check useLanguageSync hook** is called in AppRoutes

### Font Not Rendering?

1. **Check Google Fonts imported** in `index.css`
2. **Verify font-family** in CSS matches import
3. **Check HTML lang attribute**: `document.documentElement.lang`
4. **Hard refresh**: Ctrl+Shift+R or Cmd+Shift+R

## Best Practices

1. **Keep translation keys organized** by feature/page
2. **Use descriptive key names** that indicate context
3. **Never hardcode strings** in components
4. **Test all languages** before deployment
5. **Check text length** for RTL languages (Arabic, Hebrew)
6. **Use `dir="ltr"` or `dir="rtl"`** on containers if needed
7. **Test on mobile** - text length impacts mobile more
8. **Keep translations in sync** - update all language files together

## Example: Full Page Translation

```jsx
import { useTranslation } from 'react-i18next';
import { useLanguageSync } from '../hooks/useLanguageSync';

export default function MyPage() {
  const { t, i18n } = useTranslation();
  useLanguageSync();

  return (
    <div className="space-y-4">
      <h1>{t('common.appName')}</h1>
      <p>{t('dashboard.greeting')} User</p>
      
      <button onClick={() => i18n.changeLanguage('ta')}>
        {t('common.tamil')}
      </button>
      
      <button onClick={() => i18n.changeLanguage('en')}>
        {t('common.english')}
      </button>
    </div>
  );
}
```

## Advanced: Conditional Translations

```jsx
// Using variable in key
const messageKey = isError ? 'errors.networkError' : 'messages.actionSuccessful';
return <div>{t(messageKey)}</div>;

// Using interpolation
const { t } = useTranslation();
return <div>{t('dashboard.callPrimary', { name: 'John' })}</div>;

// Pluralization (if needed in future)
// {t('items', { count: itemCount })}
```

## Resources

- [i18next Documentation](https://www.i18next.com/)
- [React-i18next Documentation](https://react.i18next.com/)
- [Noto Sans Tamil Font](https://fonts.google.com/noto/specimen/Noto+Sans+Tamil)
- [Unicode Tamil Script](https://en.wikipedia.org/wiki/Tamil_script#Unicode)
