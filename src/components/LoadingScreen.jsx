import React from 'react';

export default function LoadingScreen({ message = 'Loading…' }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-5">
      <div className="relative">
        {/* Outer ring */}
        <div className="w-16 h-16 rounded-full border-4 border-blue-100" />
        {/* Spinning arc */}
        <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        {/* Shield icon center */}
        <div className="absolute inset-0 flex items-center justify-center text-xl">🛡️</div>
      </div>
      <p className="text-base font-semibold text-gray-600">{message}</p>
    </div>
  );
}
