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

/**
 * Mobile-First Bottom Navigation Component
 * - 3–5 items maximum
 * - Large icons + text labels
 * - Active tab clearly highlighted
 * - Fixed bottom position
 * - SOS kept separate as floating button
 */
export function BottomNav({
  items = [],
  activeItem = null,
  onItemClick = () => {},
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-3 border-gray-300 px-2 py-3 safe-area-inset-bottom">
      <div className="flex justify-around gap-1 max-w-none">
        {items.slice(0, 5).map((item, index) => (
          <button
            key={index}
            onClick={() => onItemClick(item.id || index)}
            className={`
              flex-1 flex flex-col items-center justify-center
              min-h-[64px] rounded-2xl font-bold text-xs
              transition-all active:scale-95
              leading-tight
              ${activeItem === (item.id || index)
                ? 'bg-blue-100 border-2 border-blue-600'
                : 'bg-white border-2 border-gray-300 hover:border-blue-300'
              }
            `}
          >
            <span className="text-3xl mb-1">{item.icon}</span>
            <span className="text-center">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Mobile-First SOS Button Component
 * - 80px–120px height (maximum tappable area)
 * - Fixed position (bottom center/floating)
 * - Bright red with pulsing animation
 * - Shadow glow to draw attention
 * - Label: "EMERGENCY SOS"
 * - Reachable with one thumb
 * - Scale feedback on press (tactile)
 * 
 * MOST IMPORTANT BUTTON IN THE APP
 */
export function SOSButton({
  onClick,
  disabled = false,
  loading = false,
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        w-full min-h-[120px] px-6 py-8 text-xl font-bold
        text-white bg-red-600 rounded-xl
        border-2 border-red-700
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all active:scale-95
        sos-pulse
        shadow-lg
      `}
      style={{
        boxShadow: '0 0 30px rgba(220, 38, 38, 0.7), 0 0 60px rgba(220, 38, 38, 0.4)',
      }}
    >
      {loading ? 'ALERTING...' : 'EMERGENCY SOS'}
    </button>
  );
}

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

/**
 * Mobile-First SOS Countdown Component
 * - Circular progress indicator
 * - Countdown timer (seconds)
 * - Large, clearly visible
 * - Cancel action
 * - Vibration-like visual cues
 */
export function SOSCountdown({
  isActive = false,
  seconds = 10,
  onCancel = () => {},
  onComplete = () => {},
}) {
  const [remaining, setRemaining] = React.useState(seconds);

  React.useEffect(() => {
    if (!isActive) {
      setRemaining(seconds);
      return;
    }

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, seconds]);

  if (!isActive) return null;

  const progress = (remaining / seconds) * 100;
  const circumference = 2 * Math.PI * 45; // radius = 45
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 z-40 animate-fade-in">
      <div className="flex flex-col items-center space-y-8">
        {/* Circular Progress */}
        <div className="relative w-40 h-40">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="4"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#dc2626"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-100"
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-900 text-white">{remaining}</span>
          </div>
        </div>

        {/* Message */}
        <p className="text-2xl font-bold text-white text-center leading-relaxed">
          SOS Alert Sending...
        </p>

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          className={`
            min-h-[56px] px-8 py-3
            text-xl font-bold rounded-2xl
            border-3 border-white bg-white text-red-600
            transition-all active:scale-95
            leading-relaxed
          `}
        >
          Cancel Alert
        </button>
      </div>
    </div>
  );
}
