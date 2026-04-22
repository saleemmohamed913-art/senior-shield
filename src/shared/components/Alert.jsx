import React from 'react';

/**
 * Mobile-First Alert Component
 * - Outlined style
 * - High contrast
 * - Clear error/success messaging
 */
export function Alert({
  type = 'error', // error, success, warning
  message,
  className = '',
}) {
  const variantClasses = {
    error: 'bg-red-50 border-red-300 text-red-800',
    success: 'bg-green-50 border-green-300 text-green-800',
    warning: 'bg-yellow-50 border-yellow-300 text-yellow-800',
  };

  return (
    <div className={`w-full p-4 border-2 rounded-lg ${variantClasses[type]} ${className}`}>
      <p className="text-base font-semibold">
        {message}
      </p>
    </div>
  );
}
