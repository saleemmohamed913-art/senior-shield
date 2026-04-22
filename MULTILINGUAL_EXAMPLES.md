# Multilingual Implementation Examples

## Quick Start - 5 Minute Setup

### 1. Using Translations in Any Component

```jsx
import { useTranslation } from 'react-i18next';

export default function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('dashboard.greeting')} 👋</h1>
      <p>{t('dashboard.youAreSafe')}</p>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

### 2. Switching Languages Programmatically

```jsx
import { useTranslation } from 'react-i18next';

export default function LanguageToggle() {
  const { i18n } = useTranslation();

  return (
    <div className="flex gap-2">
      <button 
        onClick={() => i18n.changeLanguage('en')}
        className={i18n.language === 'en' ? 'bg-blue-500 text-white' : ''}
      >
        English
      </button>
      <button
        onClick={() => i18n.changeLanguage('ta')}
        className={i18n.language === 'ta' ? 'bg-blue-500 text-white' : ''}
      >
        Tamil
      </button>
    </div>
  );
}
```

### 3. Using the Built-in LanguageSwitcher

```jsx
import LanguageSwitcher from '../components/LanguageSwitcher';

// In your Settings page:
<LanguageSwitcher mode="dropdown" />

// Or with callbacks:
<LanguageSwitcher 
  mode="buttons"
  onChange={(lang) => console.log('Switched to', lang)}
/>
```

## Real-World Examples

### Example 1: Translating a Form

```jsx
import { useTranslation } from 'react-i18next';

export default function LoginForm() {
  const { t } = useTranslation();

  return (
    <form className="space-y-4">
      <div>
        <label>{t('auth.phoneNumber')}</label>
        <input 
          type="tel"
          placeholder={t('auth.enterPhone')}
          className="w-full p-2 border rounded"
        />
      </div>

      <button className="w-full bg-blue-500 text-white py-2 rounded">
        {t('auth.sendOTP')}
      </button>

      <p className="text-sm text-gray-600">
        {t('auth.otpSent')}
      </p>
    </form>
  );
}
```

### Example 2: Translating Alert Messages

```jsx
import { useTranslation } from 'react-i18next';
import { FullscreenAlert } from '../components/MobileFirstComponents';

export default function SOSAlert({ isOpen }) {
  const { t } = useTranslation();

  return (
    <FullscreenAlert
      isOpen={isOpen}
      title={t('dashboard.sosSuccess')}
      message={t('dashboard.sosMessage')}
      type="success"
      primaryAction={{
        label: t('sos.gotIt'),
        onClick: () => console.log('Dismissed'),
      }}
    />
  );
}
```

### Example 3: Dynamic Text Based on Language

```jsx
import { useTranslation } from 'react-i18next';

export default function DashboardCard() {
  const { t, i18n } = useTranslation();
  
  // Tamil text is typically longer - adjust sizing
  const isTamil = i18n.language === 'ta';

  return (
    <div className={`p-4 rounded-lg ${isTamil ? 'text-sm' : 'text-base'}`}>
      <h2 className={`font-bold ${isTamil ? 'mb-2' : 'mb-3'}`}>
        {t('profile.medicalInfo')}
      </h2>
      <p>{t('profile.bloodType')}: O+</p>
    </div>
  );
}
```

### Example 4: Conditional Translation Keys

```jsx
import { useTranslation } from 'react-i18next';

export default function StatusMessage({ status }) {
  const { t } = useTranslation();

  const keyMap = {
    success: 'messages.actionSuccessful',
    error: 'errors.unknownError',
    warning: 'common.warning',
    info: 'common.info',
  };

  return <div>{t(keyMap[status] || 'common.info')}</div>;
}
```

### Example 5: Voice Announcement with Translation

```jsx
import { useTranslation } from 'react-i18next';
import { speakText } from '../utils/helpers';

export default function SOSButton() {
  const { t, i18n } = useTranslation();

  const handleSOS = async () => {
    // Get translated text
    const message = t('dashboard.sosAlert');
    
    // Speak in current language
    await speakText(message, i18n.language);
    
    // Trigger SOS
    triggerEmergencyAlert();
  };

  return (
    <button onClick={handleSOS}>
      {t('dashboard.tapForHelp')}
    </button>
  );
}
```

## Adding New Translation Keys

### Step 1: Identify Missing Keys

If you see a key like `settings.newFeature` in your component, add it to translations:

```jsx
<button>{t('settings.newFeature')}</button>
```

### Step 2: Add to English Translation

Edit `public/locales/en/translation.json`:

```json
{
  "settings": {
    "newFeature": "New Feature",
    // ... existing keys
  }
}
```

### Step 3: Add to Tamil Translation

Edit `public/locales/ta/translation.json`:

```json
{
  "settings": {
    "newFeature": "புதிய அம்சம்",
    // ... existing keys
  }
}
```

### Step 4: Test

```jsx
const { t } = useTranslation();
t('settings.newFeature'); // Returns "New Feature" or "புதிய அம்சம்"
```

## Updating Existing Translations

### Common Workflow

```bash
# 1. Find all components using a translation
# grep -r "t('dashboard" src/

# 2. Update the JSON file
# public/locales/en/translation.json

# 3. Update the Tamil version
# public/locales/ta/translation.json

# 4. Test in browser by switching language
# - Navigate to Settings
# - Switch between English and Tamil
# - Verify text changes
```

## Testing Multilingual Features

### In the Browser Console

```javascript
// Check current language
i18n.language  // 'en' or 'ta'

// Check saved preference
localStorage.getItem('i18nextLng')  // 'ta' if Tamil selected

// Change language programmatically
i18n.changeLanguage('ta')

// Check if translation key exists
i18n.t('dashboard.greeting')  // Returns translated text or the key name
```

### Debugging Translation Issues

```jsx
import { useTranslation } from 'react-i18next';

function DebugComponent() {
  const { t, i18n } = useTranslation();

  return (
    <div className="space-y-4 p-4 bg-gray-100 rounded">
      <p><strong>Current Language:</strong> {i18n.language}</p>
      <p><strong>HTML Lang:</strong> {document.documentElement.lang}</p>
      <p><strong>Test Key:</strong> {t('dashboard.greeting')}</p>
      <p><strong>Missing Key:</strong> {t('nonexistent.key')}</p>
      <p><strong>LocalStorage:</strong> {localStorage.getItem('i18nextLng')}</p>
    </div>
  );
}
```

## Performance Tips

### 1. Memoize Language-Dependent Components

```jsx
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const Card = React.memo(({ data }) => {
  const { t, i18n } = useTranslation();
  
  const layout = useMemo(() => ({
    spacing: i18n.language === 'ta' ? 'p-2' : 'p-4',
    textSize: i18n.language === 'ta' ? 'text-sm' : 'text-base',
  }), [i18n.language]);

  return <div className={`${layout.spacing} ${layout.textSize}`}>...</div>;
});
```

### 2. Lazy Load Translations (if files get large)

```jsx
// Already configured in i18n.js
// Translations are loaded on-demand with i18next-localstorage-backend
```

### 3. Preload Languages

```jsx
import i18n from 'i18next';

// Preload Tamil on app startup for faster switching
i18n.loadNamespaces('ta');
```

## Troubleshooting

### Issue: Translation showing as key name

**Solution**: Check that the key exists in BOTH translation files

```json
// public/locales/en/translation.json
{ "dashboard": { "greeting": "Hi" } }

// public/locales/ta/translation.json  
{ "dashboard": { "greeting": "வணக்கம்" } }
```

### Issue: Language not persisting after refresh

**Solution**: Check localStorage is enabled and not blocked

```javascript
localStorage.setItem('test', 'value');  // Should work
localStorage.getItem('test');           // Should return 'value'
```

### Issue: Tamil text looks cut off

**Solution**: Adjust padding/spacing and use proper line-height

```css
/* For Tamil text */
.tamil-text {
  line-height: 1.6;  /* Larger line-height */
  word-wrap: break-word;
  overflow-wrap: break-word;
}
```

## Production Checklist

- [ ] All UI text uses translation keys (no hardcoded strings)
- [ ] Translation files are complete for all languages
- [ ] Language switcher tested in Settings
- [ ] Language persists on page refresh
- [ ] All pages render correctly in all languages
- [ ] Fonts render correctly (especially Tamil)
- [ ] Mobile responsive with different text lengths
- [ ] Voice announcements use correct language
- [ ] Accessibility tested (screen readers detect language)

## Next Steps

1. **Add More Languages**: Follow the "Adding a New Language" guide
2. **Set as Default**: Change `fallbackLanguage: 'en'` in `src/utils/i18n.js`
3. **RTL Support**: For Arabic/Hebrew, implement RTL handling
4. **Translations Management**: Consider using a service like Crowdin or Lokalise
