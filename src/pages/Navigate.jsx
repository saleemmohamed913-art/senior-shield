import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiMapPin, FiShare2, FiHome, FiSearch, FiArrowRight, FiInfo, FiChevronDown } from 'react-icons/fi';
import { MdLocalHospital, MdLocalPolice, MdLocalPharmacy } from 'react-icons/md';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../hooks/useLocation';
import { speakText } from '../utils/helpers';
import { BottomNav } from '../shared/components';

export default function NavigatePage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { userProfile } = useAuth();
  const { location, error: locationError, getLocation } = useLocation();
  const [destination, setDestination] = useState('');
  const [error, setError] = useState(null);

  // Fetch location on mount
  useEffect(() => {
    getLocation();
  }, []);

  // Navigate via native Google Maps app intent
  const handleGetDirections = (e, quickDest = null) => {
    if (e) e.preventDefault();
    const dest = quickDest || destination.trim();

    if (!dest) {
      setError(t('errors.unknownError'));
      return;
    }

    setError(null);
    speakText(`${t('navigation.navigate')} ${dest}`, i18n.language);

    if (location) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&origin=${location.latitude},${location.longitude}`,
        '_blank'
      );
    } else {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`,
        '_blank'
      );
    }
  };

  const handleQuickDestination = (dest) => {
    setDestination(dest);
    handleGetDirections(null, dest);
  };

  // Share current location
  const handleShareLocation = async () => {
    if (!location) {
      setError(t('errors.locationRequired'));
      return;
    }
    const locationURL = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: t('navigation.shareLocation'), text: t('navigation.shareLocation'), url: locationURL });
      } catch { /* user cancelled */ }
    } else {
      navigator.clipboard.writeText(locationURL);
      alert(t('messages.actionSuccessful'));
    }
  };

  const handleNavigation = (item) => {
    const routes = { home: '/dashboard', contacts: '/profile', navigate: '/navigate', settings: '/settings' };
    navigate(routes[item] || '/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col pb-24 text-gray-900 bg-transparent">
      {/* 1. HEADER */}
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-3xl font-bold">{t('navigation.title')}</h1>
        <p className="text-sm font-medium text-gray-500 mt-1">{t('navigation.subtitle')}</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5 px-4 pb-6">
        
        {/* Error Banners */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-[14px] p-4 flex justify-between items-start shadow-sm">
            <p className="text-sm font-semibold text-red-800">{error}</p>
            <button onClick={() => setError(null)} className="text-red-500 font-bold ml-3 active:scale-90">✕</button>
          </div>
        )}

        {/* PRIMARY ACTION */}
        <div className="bg-red-50 border border-red-100 rounded-[16px] p-5 shadow-sm relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-start text-left">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🚨</span>
              <h2 className="text-lg font-bold text-red-700">{t('navigation.emergencyNav')}</h2>
            </div>
            <p className="text-sm text-red-600 mb-4 font-medium opacity-90">
              {t('navigation.emergencyNavDesc')}
            </p>
            <button 
              onClick={() => handleQuickDestination('Nearest Hospital')}
              className="px-6 py-3 bg-red-600 text-white text-[15px] font-bold rounded-xl shadow-md hover:bg-red-700 active:scale-[0.97] transition-all"
            >
              {t('navigation.startNow')}
            </button>
          </div>
          <MdLocalHospital className="absolute -right-6 -bottom-6 text-red-600 opacity-[0.03]" size={140} />
        </div>

        {/* LOCATION ERROR CARD */}
        {locationError && (
          <div className="bg-[#fff7ed] border border-[#fed7aa] rounded-[14px] p-4 flex flex-col gap-3 shadow-sm">
            <div className="flex items-start gap-3">
              <FiMapPin className="text-[#9a3412] mt-0.5 shrink-0" size={20} />
              <div>
                <p className="text-[15px] font-bold text-[#9a3412]">{t('navigation.locationAccessNeeded')}</p>
                <p className="text-sm text-[#9a3412] opacity-80 mt-1">{t('navigation.locationAccessDesc')}</p>
              </div>
            </div>
            <button
              onClick={getLocation}
              className="self-start px-4 py-2 mt-1 bg-white border border-[#fed7aa] text-[#9a3412] text-sm font-bold rounded-lg shadow-sm hover:bg-orange-50 active:scale-[0.97] transition-all"
            >
              {t('navigation.enableLocation')}
            </button>
          </div>
        )}

        {/* SEARCH BAR */}
        <form onSubmit={handleGetDirections} className="relative z-20 mt-1">
          <div className="flex items-center bg-white rounded-full px-4 py-3 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-[#eef2f7] focus-within:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] transition-all">
            <FiSearch className="text-gray-400 shrink-0 mr-2" size={18} />
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder={t('navigation.searchPlaceholder')}
              className="flex-1 text-[14px] text-gray-900 bg-transparent focus:outline-none focus:ring-0 placeholder-gray-400 font-medium border-none p-0"
            />
            <button 
              type="submit"
              className="text-blue-600 p-1 hover:text-blue-800 active:scale-95 transition-all shrink-0 flex items-center justify-center"
              aria-label={t('navigation.navigate')}
            >
              <FiArrowRight size={20} strokeWidth={2.5} />
            </button>
          </div>
        </form>

        {/* SHARE LOCATION */}
        <button
          onClick={handleShareLocation}
          className="w-full py-4 px-4 bg-[#eff6ff] text-[#1d4ed8] rounded-[14px] font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm border border-blue-100 hover:bg-blue-100"
        >
          <FiShare2 size={18} /> 
          <span>{t('navigation.shareLocation')}</span>
        </button>

        {/* QUICK ACTIONS */}
        <div className="pt-2">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleQuickDestination('Hospital')}
              className="bg-white rounded-[16px] p-4 shadow-[0_4px_10px_rgba(0,0,0,0.05)] border border-gray-100 active:scale-[0.97] transition-all flex flex-col items-start gap-3 hover:border-red-100 group"
            >
              <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                <MdLocalHospital size={24} className="text-red-500" />
              </div>
              <span className="text-[15px] font-bold text-gray-900">{t('navigation.hospital')}</span>
            </button>
            
            <button
              onClick={() => handleQuickDestination('Police Station')}
              className="bg-white rounded-[16px] p-4 shadow-[0_4px_10px_rgba(0,0,0,0.05)] border border-gray-100 active:scale-[0.97] transition-all flex flex-col items-start gap-3 hover:border-blue-100 group"
            >
              <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <MdLocalPolice size={24} className="text-blue-500" />
              </div>
              <span className="text-[15px] font-bold text-gray-900">{t('navigation.police')}</span>
            </button>
            
            <button
              onClick={() => handleQuickDestination('Pharmacy')}
              className="bg-white rounded-[16px] p-4 shadow-[0_4px_10px_rgba(0,0,0,0.05)] border border-gray-100 active:scale-[0.97] transition-all flex flex-col items-start gap-3 hover:border-green-100 group"
            >
              <div className="w-11 h-11 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                <MdLocalPharmacy size={24} className="text-green-500" />
              </div>
              <span className="text-[15px] font-bold text-gray-900">{t('navigation.pharmacy')}</span>
            </button>
            
            <button
              onClick={() => handleQuickDestination('Home')}
              className="bg-white rounded-[16px] p-4 shadow-[0_4px_10px_rgba(0,0,0,0.05)] border border-gray-100 active:scale-[0.97] transition-all flex flex-col items-start gap-3 hover:border-gray-200 group"
            >
              <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                <FiHome size={22} className="text-gray-600" />
              </div>
              <span className="text-[15px] font-bold text-gray-900">{t('navigation.home')}</span>
            </button>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <details className="group mt-4 pt-4 border-t border-gray-100 select-none">
          <summary className="flex items-center gap-2 cursor-pointer list-none text-[13px] font-semibold text-gray-500 uppercase tracking-wide">
            <FiInfo size={16} /> {t('navigation.howItWorks')}
            <span className="ml-auto transform group-open:rotate-180 transition-transform">
              <FiChevronDown size={18} />
            </span>
          </summary>
          <div className="p-4 mt-3 bg-white rounded-[12px] border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] text-sm text-gray-600 space-y-2 font-medium">
            <p>1. {t('navigation.step1')}</p>
            <p>2. {t('navigation.step2')}</p>
            <p>3. {t('navigation.step3')}</p>
            <p>4. {t('navigation.step4')}</p>
          </div>
        </details>
      </div>

      <BottomNav activeItem="navigate" onItemClick={handleNavigation} />
    </div>
  );
}
