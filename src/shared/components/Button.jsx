import React from 'react';

/**
 * Mobile-First Button Component
 * - Minimum 56px height (WCAG AA+)
 * - Touch-friendly padding
 * - Large, clear text
 * - Strong visual appearance with shadow
 * - Action-driven labels
 */
export function Button({
  children,
  onClick,
  disabled = false,
  variant = 'primary', // primary, secondary, danger, success
  size = 'large', // large (56px), medium (48px), small (40px)
  className = '',
  ...props
}) {
  const baseClasses = 'w-full rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md';
  
  const sizeClasses = {
    large: 'py-4 px-6 text-xl min-h-[56px]',
    medium: 'py-3 px-4 text-lg min-h-[48px]',
    small: 'py-2 px-4 text-base min-h-[40px]',
  };

  const variantClasses = {
    primary: 'bg-blue-600 text-white border-2 border-blue-700 hover:bg-blue-700 hover:shadow-lg',
    secondary: 'bg-gray-100 text-gray-900 border-2 border-gray-300 hover:bg-gray-200',
    danger: 'bg-red-600 text-white border-2 border-red-700 hover:bg-red-700 hover:shadow-lg',
    success: 'bg-green-600 text-white border-2 border-green-700 hover:bg-green-700 hover:shadow-lg',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
