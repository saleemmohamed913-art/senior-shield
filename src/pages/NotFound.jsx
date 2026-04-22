import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
      <div className="space-y-6 max-w-sm">
        <div className="text-8xl">🛡️</div>
        <div>
          <h1 className="text-6xl font-black text-gray-900">404</h1>
          <p className="text-xl font-bold text-gray-700 mt-2">Page Not Found</p>
          <p className="text-sm text-gray-500 mt-3">
            This page doesn't exist or may have been moved.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 active:scale-95 transition-all text-lg shadow-md"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-full py-4 bg-gray-100 text-gray-700 font-semibold rounded-2xl hover:bg-gray-200 active:scale-95 transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
