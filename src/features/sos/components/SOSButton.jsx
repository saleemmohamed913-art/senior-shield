import React from 'react';

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
