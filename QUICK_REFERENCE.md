# Quick Reference - Multilingual Implementation

## 📋 Cheat Sheet for Developers

### Use Translation in Component

```jsx
import { useTranslation } from 'react-i18next';

export default function MyComponent() {
  const { t, i18n } = useTranslation();
  
  return <h1>{t('page.section.key')}</h1>;
}
```

### Change Language

```javascript
import i18n from 'i18next';

i18n.changeLanguage('ta');  // Switch to Tamil
i18n.changeLanguage('en');  // Switch to English
```

### Get Current Language

```javascript
const { i18n } = useTranslation();
const currentLang = i18n.language;  // Returns 'en' or 'ta'
```

## 📂 File Locations

| What | Where |
|------|-------|
| i18n Config | `src/utils/i18n.js` |
| Language Sync Hook | `src/hooks/useLanguageSync.js` |
| Language Switcher | `src/components/LanguageSwitcher.jsx` |
| English Translations | `public/locales/en/translation.json` |
| Tamil Translations | `public/locales/ta/translation.json` |

## 🔄 Workflow: Add New UI Text

### 1. Add Translation Key to Component
```jsx
<button>{t('settings.saveChanges')}</button>
```

### 2. Add to English JSON
```json
{
  "settings": {
    "saveChanges": "Save Changes"
  }
}
```

### 3. Add to Tamil JSON
```json
{
  "settings": {
    "saveChanges": "மாற்றங்களைச் சேமிக்க"
  }
}
```

### 4. Test
```javascript
i18n.changeLanguage('ta');  // Text should show in Tamil
```

## 🎨 Language Switcher Modes

```jsx
// Dropdown (recommended for settings)
<LanguageSwitcher mode="dropdown" />

// Buttons
<LanguageSwitcher mode="buttons" />

// Compact (small flags)
<LanguageSwitcher mode="compact" />

// With callback
<LanguageSwitcher 
  mode="dropdown"
  onChange={(lang) => console.log(lang)}
/>
```

## 🧪 Testing Commands

```javascript
// In browser console:

// Check language
i18n.language

// Check if key exists
i18n.t('dashboard.greeting')

// Check localStorage
localStorage.getItem('i18nextLng')

// Switch language
i18n.changeLanguage('ta')

// Get supported languages
i18n.languages  // ['en', 'ta']
```

## ⚠️ Common Mistakes

| ❌ Wrong | ✅ Right |
|---------|---------|
| `"Save"` | `{t('common.save')}` |
| `t('greeting')` | `t('dashboard.greeting')` |
| No translation file | Both `en` and `ta` files |
| Hardcoded text | Always use i18n keys |

## 📊 Translation Key Structure

```
common/
├── appName
├── language
├── save
└── cancel

dashboard/
├── greeting
├── youAreSafe
├── sosAlert
└── medicalInfo

auth/
├── login
├── phoneNumber
└── sendOTP

settings/
├── language
├── notifications
└── logout
```

## 🚀 Adding New Language (Quick)

```javascript
// 1. Create file: public/locales/hi/translation.json
// 2. Copy from en/translation.json and translate
// 3. Import in src/utils/i18n.js:
import hiTranslations from '../../public/locales/hi/translation.json';

// 4. Add to resources:
resources: {
  en: { translation: enTranslations },
  ta: { translation: taTranslations },
  hi: { translation: hiTranslations },  // Add this
}

// 5. Add to supported languages:
{ code: 'hi', label: 'हिन्दी', flag: '🇮🇳', dir: 'ltr' }
```

## 🔗 Related Files Modified

- `src/main.jsx` - i18n initialization
- `src/App.jsx` - useLanguageSync hook
- `src/pages/Dashboard.jsx` - All text uses i18n
- `src/pages/Settings.jsx` - Language selection
- `src/index.css` - Tamil font support
- `package.json` - i18next dependencies

## 📱 Mobile-Specific Tips

```jsx
// Tamil text is longer - use smaller text on mobile
<h1 className="text-lg sm:text-2xl">
  {t('dashboard.greeting')}
</h1>

// Adjust padding for longer text
<button className="px-2 sm:px-4 py-2 sm:py-3">
  {t('common.save')}
</button>

// Ensure text wraps properly
<p className="flex-wrap whitespace-normal">
  {t('messages.longMessage')}
</p>
```

## 🔊 Voice with Translation

```jsx
import { useTranslation } from 'react-i18next';
import { speakText } from '../utils/helpers';

const { t, i18n } = useTranslation();

// Speak translated text in current language
speakText(t('dashboard.sosAlert'), i18n.language);
```

## 💾 Data Flow

```
User selects language in Settings
         ↓
i18n.changeLanguage('ta')
         ↓
localStorage.setItem('i18nextLng', 'ta')
         ↓
HTML lang attribute: <html lang="ta">
         ↓
Font switches to Noto Sans Tamil
         ↓
All components re-render with Tamil text
         ↓
Change persists on page refresh
```

## 🎯 Supported Languages

| Code | Language | Flag | Status |
|------|----------|------|--------|
| `en` | English | 🇺🇸 | ✅ Complete |
| `ta` | Tamil | 🇮🇳 | ✅ Complete |

## 📚 Full Documentation

- **MULTILINGUAL_GUIDE.md** - Detailed setup & configuration
- **MULTILINGUAL_EXAMPLES.md** - Code samples & patterns
- **IMPLEMENTATION_SUMMARY.md** - What was implemented

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Text shows as key | Add key to translation JSON files |
| Language not persisting | Check localStorage, clear cache |
| Tamil looks cut off | Adjust padding, use `text-sm` |
| Font not rendering | Check Google Fonts import in `index.css` |
| i18n not initialized | Verify import in `main.jsx` |

## 🔗 Useful Links

- [i18next Documentation](https://www.i18next.com/)
- [React-i18next](https://react.i18next.com/)
- [Noto Sans Tamil Font](https://fonts.google.com/noto/specimen/Noto+Sans+Tamil)

## 📝 Template: New Feature Translation

When adding new feature, use this template:

```json
{
  "feature": {
    "title": "Feature Title",
    "description": "Feature description",
    "button": "Button text",
    "message": "Message text",
    "error": "Error message"
  }
}
```

---

**Last Updated**: April 2026
**Status**: Production Ready ✅
