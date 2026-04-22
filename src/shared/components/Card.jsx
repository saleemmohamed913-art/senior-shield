import React from 'react';

/**
 * Mobile-First Card Component
 * - Vertical stack only
 * - Consistent padding (p-4)
 * - Rounded corners
 * - Soft shadow
 * - Color-coded by type (blue, purple, green, etc)
 */
export function Card({
  title,
  children,
  variant = 'blue', // blue, purple, green, orange, red
  className = '',
}) {
  const variantClasses = {
    blue: 'border-blue-400 bg-white',
    purple: 'border-purple-400 bg-white',
    green: 'border-green-400 bg-white',
    orange: 'border-orange-400 bg-white',
    red: 'border-red-400 bg-white',
  };

  const titleColors = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
  };

  return (
    <div className={`w-full p-4 border-2 rounded-lg shadow-sm space-y-3 ${variantClasses[variant]} ${className}`}>
      {title && (
        <h3 className={`text-lg font-semibold ${titleColors[variant]}`}>
          {title}
        </h3>
      )}
      <div className="text-gray-800 text-base leading-relaxed">
        {children}
      </div>
    </div>
  );
}
