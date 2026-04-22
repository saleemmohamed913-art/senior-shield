import React from 'react';
import Sidebar from '../../components/Sidebar';

export default function AuthLayout({ children }) {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white">
      {/* Sidebar - Hidden on mobile, visible on desktop (lg:) */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main Content - Full width on mobile */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>

      {/* Mobile Bottom Navigation - Visible only on mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 px-2 py-3">
        <div className="flex justify-around gap-1">
          <button className="flex-1 flex flex-col items-center justify-center p-3 rounded-lg bg-white border-2 border-blue-400">
            <span className="text-2xl">🏠</span>
            <span className="text-sm font-bold text-gray-900">Home</span>
          </button>
          <button className="flex-1 flex flex-col items-center justify-center p-3 rounded-lg bg-white border-2 border-gray-300 hover:border-blue-400">
            <span className="text-2xl">👤</span>
            <span className="text-sm font-bold text-gray-900">Profile</span>
          </button>
          <button className="flex-1 flex flex-col items-center justify-center p-3 rounded-lg bg-white border-2 border-gray-300 hover:border-blue-400">
            <span className="text-2xl">📍</span>
            <span className="text-sm font-bold text-gray-900">Navigate</span>
          </button>
          <button className="flex-1 flex flex-col items-center justify-center p-3 rounded-lg bg-white border-2 border-gray-300 hover:border-blue-400">
            <span className="text-2xl">📄</span>
            <span className="text-sm font-bold text-gray-900">OCR</span>
          </button>
          <button className="flex-1 flex flex-col items-center justify-center p-3 rounded-lg bg-white border-2 border-gray-300 hover:border-blue-400">
            <span className="text-2xl">📋</span>
            <span className="text-sm font-bold text-gray-900">History</span>
          </button>
        </div>
      </div>
    </div>
  );
}
