import React from 'react';

/**
 * Mobile-First Navigation Tab Component
 * - 56px minimum height
 * - Touch-friendly
 * - Visual feedback
 */
export function NavTab({
  icon,
  label,
  active = false,
  highlight = false,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 flex flex-col items-center justify-center
        min-h-[56px] rounded-lg font-bold text-sm
        transition-all active:scale-95
        ${highlight 
          ? 'bg-red-100 border-2 border-red-600' 
          : active 
          ? 'bg-blue-100 border-2 border-blue-600' 
          : 'border-2 border-gray-300 hover:border-blue-400'
        }
      `}
    >
      <span className="text-2xl mb-1">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
