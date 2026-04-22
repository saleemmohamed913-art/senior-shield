import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log the real tech error to console, hide it from the user
    console.error('💥 App Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div 
          className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center"
          style={{ animation: 'fadeIn 0.4s ease-out' }}
        >
          <style>
            {`
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}
          </style>

          <div className="space-y-6 max-w-sm w-full bg-white p-8 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col items-center">
            <div className="text-[56px] leading-none text-gray-800 mb-2">⚠️</div>
            
            <div className="space-y-2">
              <h1 className="text-[20px] font-bold text-gray-900 tracking-tight">Oops! Something went wrong</h1>
              <p className="text-[15px] font-medium text-gray-500 leading-relaxed px-2">
                We couldn’t process your request. Please try again or go back to safety.
              </p>
            </div>

            {/* Hidden actual error - user friendly message shown instead */}
            <div className="w-full pt-1">
              <p className="text-[12px] font-mono text-gray-400 bg-gray-50 p-2.5 rounded-xl w-full text-center truncate border border-gray-100">
                Unexpected error occurred
              </p>
            </div>

            <div className="space-y-3 pt-2 w-full">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3.5 bg-[#ef4444] text-white font-bold rounded-[14px] hover:bg-red-600 active:scale-[0.96] transition-all shadow-sm"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.href = '/dashboard';
                }}
                className="w-full py-3.5 bg-[#f1f5f9] text-[#1f2937] font-bold rounded-[14px] hover:bg-gray-200 active:scale-[0.96] transition-all"
              >
                Go to Home
              </button>
            </div>
          </div>

          <div className="mt-8 bg-red-50 border border-red-100 text-red-600 px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm">
            <span className="text-xl">🚨</span> 
            <span>If emergency, press SOS</span>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
