import React, { useState } from 'react';

const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', label: 'India' },
  { code: '+1',  flag: '🇺🇸', label: 'USA' },
  { code: '+44', flag: '🇬🇧', label: 'UK' },
  { code: '+61', flag: '🇦🇺', label: 'Australia' },
  { code: '+971', flag: '🇦🇪', label: 'UAE' },
  { code: '+65', flag: '🇸🇬', label: 'Singapore' },
  { code: '+60', flag: '🇲🇾', label: 'Malaysia' },
  { code: '+49', flag: '🇩🇪', label: 'Germany' },
  { code: '+33', flag: '🇫🇷', label: 'France' },
  { code: '+81', flag: '🇯🇵', label: 'Japan' },
];

/**
 * PhoneInput — country code selector + number field
 * Props:
 *   value: full phone string e.g. "+91 9876543210"
 *   onChange: (fullPhone: string) => void
 *   disabled?: boolean
 *   placeholder?: string
 */
export default function PhoneInput({ value = '', onChange, disabled, placeholder = '98765 43210' }) {
  // Split saved value into code + number if possible
  const detectCode = () => {
    for (const c of COUNTRY_CODES) {
      if (value.startsWith(c.code)) return c.code;
    }
    return '+91';
  };

  const [countryCode, setCountryCode] = useState(detectCode);
  const [number, setNumber] = useState(() => {
    const code = detectCode();
    return value.startsWith(code) ? value.slice(code.length).trim() : value;
  });

  const handleCodeChange = (e) => {
    const code = e.target.value;
    setCountryCode(code);
    onChange(`${code} ${number}`.trim());
  };

  const handleNumberChange = (e) => {
    const num = e.target.value.replace(/[^\d\s\-]/g, ''); // allow digits, spaces, dashes
    setNumber(num);
    onChange(`${countryCode} ${num}`.trim());
  };

  return (
    <div className="flex w-full rounded-xl border-2 border-gray-300 overflow-hidden focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 bg-white transition-all">
      {/* Country Code Selector */}
      <select
        value={countryCode}
        onChange={handleCodeChange}
        disabled={disabled}
        className="h-14 pl-3 pr-2 text-sm font-bold text-gray-800 bg-gray-100 border-r-2 border-gray-300 focus:outline-none cursor-pointer disabled:opacity-50 shrink-0"
      >
        {COUNTRY_CODES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.code}
          </option>
        ))}
      </select>

      {/* Phone Number Field */}
      <input
        type="tel"
        value={number}
        onChange={handleNumberChange}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 h-14 px-4 text-lg text-gray-900 bg-white focus:outline-none placeholder:text-gray-400 disabled:opacity-50"
      />
    </div>
  );
}
