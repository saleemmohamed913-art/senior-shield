import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiHome, FiPhone, FiMapPin, FiSettings } from 'react-icons/fi';

/**
 * Mobile-First Bottom Navigation Component
 * - 4 nav items (Home, Contacts, Navigate, Settings) + SOS button in center
 * - SOS button: Large red emergency button in the center
 * - React Icons + text labels
 * - Active tab: blue background + blue text
 * - Fixed bottom position, minimal design
 * - Optimized for mobile with proper safe areas
 */
export function BottomNav({
  items = [],
  activeItem = null,
  onItemClick = () => { },
  sosButton = null,
}) {
  const { t } = useTranslation();

  // Default items if not provided
  const defaultItems = [
    { id: 'home', icon: <FiHome size={22} />, label: t('navigation.home') },
    { id: 'contacts', icon: <FiPhone size={22} />, label: t('navigation.contacts') },
    { id: 'navigate', icon: <FiMapPin size={22} />, label: t('navigation.navigate') },
    { id: 'settings', icon: <FiSettings size={22} />, label: t('navigation.settings') },
  ];

  const navItems = items.length > 0 ? items : defaultItems;
  const leftItems = navItems.slice(0, 2); // Home, Contacts
  const rightItems = navItems.slice(2, 4); // Navigate, Settings

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
      <div className="flex justify-around items-stretch gap-0 w-full px-0">
        {/* Left items (Home, Contacts) */}
        {leftItems.map((item, index) => (
          <button
            key={`left-${index}`}
            onClick={() => onItemClick(item.id || index)}
            className={`
              flex-1 flex flex-col items-center justify-center
              h-20 py-0 px-1 rounded-none
              transition-all active:scale-95
              border-b-4 border-transparent
              ${activeItem === (item.id || index)
                ? 'bg-blue-50 text-blue-700 border-b-blue-600'
                : 'bg-white text-gray-600 hover:bg-gray-50'
              }
            `}
          >
            <span className="text-2xl mb-1 flex items-center justify-center">{item.icon}</span>
            <span className="text-xs font-semibold text-center leading-tight truncate px-1">{item.label}</span>
          </button>
        ))}

        {/* Center SOS Button */}
        {sosButton && (
          <button
            onClick={sosButton.onClick}
            disabled={sosButton.disabled}
            className="flex-1 flex flex-col items-center justify-center h-20 px-1 rounded-none transition-all active:scale-95 relative"
          >
            <div className={`
              w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-lg
              transition-all shadow-lg
              ${sosButton.loading
                ? 'bg-red-500 animate-pulse'
                : sosButton.disabled
                  ? 'bg-red-400 opacity-75 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 active:scale-95'
              }
            `}
              style={{
                boxShadow: sosButton.disabled ? 'none' : '0 0 20px rgba(220, 38, 38, 0.6)',
              }}
            >
              {sosButton.loading ? '...' : 'SOS'}
            </div>
          </button>
        )}

        {/* Right items (Navigate, Settings) */}
        {rightItems.map((item, index) => (
          <button
            key={`right-${index}`}
            onClick={() => onItemClick(item.id || index)}
            className={`
              flex-1 flex flex-col items-center justify-center
              h-20 py-0 px-1 rounded-none
              transition-all active:scale-95
              border-b-4 border-transparent
              ${activeItem === (item.id || index)
                ? 'bg-blue-50 text-blue-700 border-b-blue-600'
                : 'bg-white text-gray-600 hover:bg-gray-50'
              }
            `}
          >
            <span className="text-2xl mb-1 flex items-center justify-center">{item.icon}</span>
            <span className="text-xs font-semibold text-center leading-tight truncate px-1">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
