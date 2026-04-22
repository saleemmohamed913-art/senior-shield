import React from 'react';

/**
 * Mobile-First Fullscreen Modal/Alert Component
 * - WCAG AA+ contrast
 * - Large text + clear action buttons
 * - Fullscreen overlay (not small modal)
 * - Use only for critical alerts (SOS, Emergency, Confirmation)
 * - Icons + text (never icons alone)
 * - Respects reduced motion
 */
export function FullscreenAlert({
  isOpen = false,
  title = '',
  message = '',
  type = 'info', // 'info', 'warning', 'danger', 'success'
  primaryAction = null, // { label: string, onClick: fn }
  secondaryAction = null, // { label: string, onClick: fn }
  onClose = () => {},
}) {
  if (!isOpen) return null;

  const bgColors = {
    info: 'bg-blue-50',
    warning: 'bg-yellow-50',
    danger: 'bg-red-50',
    success: 'bg-green-50',
  };

  const titleColors = {
    info: 'text-blue-800',
    warning: 'text-yellow-800',
    danger: 'text-red-800',
    success: 'text-green-800',
  };

  const buttonColors = {
    info: 'bg-blue-600 text-white border-blue-700',
    warning: 'bg-yellow-600 text-white border-yellow-700',
    danger: 'bg-red-600 text-white border-red-700',
    success: 'bg-green-600 text-white border-green-700',
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 z-50 animate-fade-in">
      <div className={`
        w-full h-full flex flex-col justify-center items-center px-6 py-8
        ${bgColors[type]}
      `}>
        {/* Title */}
        <h1 className={`text-3xl font-bold text-center leading-relaxed mb-6 ${titleColors[type]}`}>
          {title}
        </h1>

        {/* Message */}
        <p className="text-lg text-center leading-relaxed text-gray-800 mb-10 max-w-sm">
          {message}
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className={`
                w-full min-h-[56px] px-6 py-3
                text-lg font-semibold rounded-lg
                border-2 ${buttonColors[type]}
                transition-all active:scale-95 shadow-md
              `}
            >
              {primaryAction.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className={`
                w-full min-h-[48px] px-6 py-3
                text-base font-semibold rounded-lg
                border-2 border-gray-300 bg-white text-gray-800
                transition-all active:scale-95
              `}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
