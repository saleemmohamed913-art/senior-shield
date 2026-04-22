import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSOS } from '../hooks/useSOS';
import { speakText } from '../utils/helpers';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile } = useAuth();
  const { triggerEmergencyAlert, sosLoading } = useSOS();

  const navItems = [
    { path: '/dashboard', label: '📊 Dashboard', icon: '📊' },
    { path: '/navigate', label: '🗺️ Navigate', icon: '🗺️' },
    { path: '/ocr', label: '📸 OCR', icon: '📸' },
    { path: '/profile', label: '👤 Profile', icon: '👤' },
    { path: '/sos-history', label: '📋 SOS History', icon: '📋' },
  ];

  const handleSOS = async () => {
    await speakText('Emergency services activated', userProfile?.preferences?.preferredLanguage || 'en-US');
    await triggerEmergencyAlert(userProfile);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col w-64 bg-blue-900 text-white min-h-screen p-6 border-r-4 border-blue-950 fixed left-0 top-0">
        <div className="mb-10">
          <h2 className="text-3xl font-bold mb-2">🛡️</h2>
          <p className="text-sm text-blue-200">Senior Shield</p>
          <p className="text-xs text-blue-300 mt-1">{userProfile?.name || 'User'}</p>
        </div>

        <nav className="flex-1 space-y-4">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full text-left px-4 py-4 rounded-lg text-lg font-semibold transition-all border-2 ${
                location.pathname === item.path
                  ? 'bg-blue-600 border-blue-400 text-white'
                  : 'bg-blue-800 border-blue-700 text-blue-100 hover:bg-blue-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* SOS Button */}
        <button
          onClick={handleSOS}
          disabled={sosLoading}
          className="w-full py-5 px-4 text-2xl font-bold text-white bg-red-600 rounded-lg border-3 border-red-800 hover:bg-red-700 disabled:opacity-50 transition-all mb-4 transform hover:scale-105"
        >
          🆘 SOS
        </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-blue-900 text-white border-t-4 border-blue-950 z-40">
        <div className="flex overflow-x-auto gap-2 p-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex-shrink-0 px-4 py-3 rounded-lg text-sm font-semibold transition-all border-2 whitespace-nowrap ${
                location.pathname === item.path
                  ? 'bg-blue-600 border-blue-400 text-white'
                  : 'bg-blue-800 border-blue-700 text-blue-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Mobile SOS */}
        <button
          onClick={handleSOS}
          disabled={sosLoading}
          className="w-full py-4 px-4 text-xl font-bold text-white bg-red-600 border-t-2 border-red-800 hover:bg-red-700 disabled:opacity-50 transition-all"
        >
          🆘 SOS 🆘
        </button>
      </div>
    </>
  );
}
