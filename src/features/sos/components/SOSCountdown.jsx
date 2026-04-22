import React from 'react';

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
}) {
  const [remaining, setRemaining] = React.useState(seconds);
  const [showConfirmCancel, setShowConfirmCancel] = React.useState(false);

  React.useEffect(() => {
    if (!isActive) {
      setRemaining(seconds);
      return;
    }

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
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

        {/* Cancel Button - Less Prominent */}
        <button
          onClick={() => setShowConfirmCancel(true)}
          className={`
            min-h-[40px] px-6 py-2
            text-sm font-semibold rounded-lg
            border-2 border-white bg-transparent text-white
            transition-all active:scale-95 hover:bg-white hover:bg-opacity-10
            leading-relaxed
          `}
        >
          Stop Alert
        </button>

        {/* Confirmation Dialog */}
        {showConfirmCancel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 animate-fade-in">
              <h3 className="text-xl font-bold text-gray-900">Cancel SOS?</h3>
              <p className="text-gray-600 text-sm">Are you sure? This will stop the emergency alert and emergency services will not be notified.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmCancel(false)}
                  className="flex-1 py-3 px-4 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 transition-all active:scale-95"
                >
                  Keep Sending
                </button>
                <button
                  onClick={() => {
                    setShowConfirmCancel(false);
                    onCancel();
                  }}
                  className="flex-1 py-3 px-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
