import React from 'react';

/**
 * Mobile-First Input Component
 * - Minimum 56px height (h-14)
 * - Large text (18px+)
 * - Clear outlined style
 * - Strong focus state
 * - Labels above (not placeholders)
 */
export function Input({
  type = 'text',
  placeholder = '',
  value,
  onChange,
  disabled = false,
  label,
  error,
  autoFocus = false,
  className = '',
  required = false,
  ...props
}) {
  return (
    <div className="space-y-2 w-full">
      {label && (
        <label className="block text-lg font-semibold text-gray-900">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        autoFocus={autoFocus}
        className={`
          w-full h-14 px-4 py-3 text-lg text-gray-900
          border-2 border-gray-300 rounded-lg
          focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200
          disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-500
          transition-all
          ${error ? 'border-red-600 focus:border-red-600 focus:ring-red-200' : ''}
          ${className}
        `}
        aria-invalid={!!error}
        aria-describedby={error ? `${label}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${label}-error`} className="text-sm font-semibold text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
