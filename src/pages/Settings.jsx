import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { BottomNav } from '../shared/components';
import { SUPPORTED_LANGUAGES, changeLanguage } from '../utils/i18n';
import { FiSmartphone, FiGlobe, FiBell, FiInfo, FiHelpCircle, FiChevronRight, FiHeart, FiUsers, FiLogOut } from 'react-icons/fi';

export default function Settings() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { currentUser, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    const savedNotifications = localStorage.getItem('notificationsEnabled');
    if (savedNotifications !== null) {
      setNotificationsEnabled(JSON.parse(savedNotifications));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('notificationsEnabled', JSON.stringify(notificationsEnabled));
  }, [notificationsEnabled]);

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode); // ✅ Actually calls i18n.changeLanguage + persists to localStorage
  };

  const handleLogout = async () => {
    if (window.confirm(t('settings.logoutConfirm'))) {
      await logout();
    }
  };

  const handleNavigation = (item) => {
    const routes = {
      'home': '/dashboard',
      'contacts': '/profile',
      'navigate': '/navigate',
      'settings': '/settings',
    };
    navigate(routes[item] || '/dashboard');
  };

  const rowClass = "glass-card-row flex items-center justify-between p-4";
  const dividerClass = "border-t border-[#f1f3f5]";
  const sectionTitleClass = "text-[13px] font-semibold text-gray-500 uppercase tracking-widest mb-2 px-2 mt-2";

  return (
    <div className="min-h-screen bg-transparent flex flex-col pb-24 text-gray-900">
      
      {/* Header */}
      <div className="px-5 pt-8 pb-3">
        <h1 className="text-3xl font-bold">{t('settings.settings')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('settings.manageAccount')}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 space-y-5 pb-6">
        
        {/* Account Section */}
        <section>
          <h2 className={sectionTitleClass}>{t('settings.account')}</h2>
          <div className="glass-card">
            <div className={rowClass}>
              <div className="flex items-center gap-3">
                <FiSmartphone size={20} className="text-blue-500" />
                <span className="text-base font-medium">{t('auth.phoneNumber')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{currentUser?.phoneNumber || 'Not set'}</span>
                <FiChevronRight size={18} className="text-gray-300" />
              </div>
            </div>
          </div>
        </section>

        {/* Safety Section */}
        <section>
          <h2 className={sectionTitleClass}>{t('settings.account')} &amp; Safety</h2>
          <div className="glass-card">
            <div onClick={() => navigate('/profile')} className={rowClass}>
              <div className="flex items-center gap-3">
                <FiHeart size={20} className="text-red-400" />
                <span className="text-base font-medium">{t('profile.medicalCondition')}</span>
              </div>
              <FiChevronRight size={18} className="text-gray-300" />
            </div>
            
            <div className={dividerClass}></div>

            <div onClick={() => navigate('/profile')} className={rowClass}>
              <div className="flex items-center gap-3">
                <FiUsers size={20} className="text-orange-500" />
                <span className="text-base font-medium">{t('profile.emergencyContacts')}</span>
              </div>
              <FiChevronRight size={18} className="text-gray-300" />
            </div>
          </div>
        </section>

        {/* Preferences Section */}
        <section>
          <h2 className={sectionTitleClass}>{t('settings.preferences')}</h2>
          <div className="glass-card">
            
            {/* Language */}
            <label className={`${rowClass} relative`}>
              <div className="flex items-center gap-3 relative z-10 w-full">
                <FiGlobe size={20} className="text-indigo-500 shrink-0" />
                <span className="text-base font-medium flex-1">{t('settings.language')}</span>
                
                <div className="flex items-center gap-1 shrink-0">
                  <select
                    value={i18n.language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="text-sm text-gray-500 bg-transparent outline-none appearance-none cursor-pointer text-right min-w-[70px] z-20"
                    style={{ direction: "rtl" }}
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                  </select>
                  <FiChevronRight size={18} className="text-gray-300 ml-1" />
                </div>
              </div>
            </label>

            <div className={dividerClass}></div>

            {/* Notifications */}
            <div 
              className={rowClass} 
              onClick={(e) => {
                if (e.target.tagName !== 'INPUT') {
                  setNotificationsEnabled(!notificationsEnabled);
                }
              }}
            >
              <div className="flex items-center gap-3">
                <FiBell size={20} className="text-yellow-500" />
                <span className="text-base font-medium">{t('settings.notifications')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-400">
                  {notificationsEnabled ? t('settings.notificationsOn') : t('settings.notificationsOff')}
                </span>
                
                {/* Custom CSS Switch */}
                <label className="switch mb-0" onClick={e => e.stopPropagation()}>
                  <input 
                    type="checkbox" 
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section>
          <h2 className={sectionTitleClass}>{t('settings.about')}</h2>
          <div className="glass-card">
            <div className={rowClass}>
              <div className="flex items-center gap-3">
                <FiInfo size={20} className="text-gray-400" />
                <span className="text-base font-medium">{t('settings.version')}</span>
              </div>
              <span className="text-sm text-gray-500">1.0.0</span>
            </div>
            
            <div className={dividerClass}></div>

            <div className={rowClass}>
              <div className="flex items-center gap-3">
                <FiHelpCircle size={20} className="text-blue-400" />
                <span className="text-base font-medium">{t('settings.help')}</span>
              </div>
              <FiChevronRight size={18} className="text-gray-300" />
            </div>
          </div>
        </section>

        {/* Logout */}
        <div className="pt-3 pb-2">
          <button onClick={handleLogout} className="logout-btn-premium">
            <FiLogOut size={18} />
            <span>{t('settings.logout')}</span>
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav
        activeItem="settings"
        onItemClick={handleNavigation}
      />
    </div>
  );
}
