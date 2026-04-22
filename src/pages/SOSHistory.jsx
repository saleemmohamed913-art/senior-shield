import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { getSOSHistory } from '../services/firestoreService';
import { BottomNav } from '../shared/components';

const STATUS_STYLES = {
  completed: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', label: '✅ Sent' },
  failed:    { bg: 'bg-red-50',   border: 'border-red-200',   text: 'text-red-700',   label: '❌ Failed' },
  default:   { bg: 'bg-blue-50',  border: 'border-blue-200',  text: 'text-blue-700',  label: '📡 Triggered' },
};

function SOSCard({ sos }) {
  const { t } = useTranslation();
  const style = STATUS_STYLES[sos.status] || STATUS_STYLES.default;
  const date = sos.triggeredAt?.toDate
    ? sos.triggeredAt.toDate()
    : new Date(sos.triggeredAt);

  const dateStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`rounded-xl border-2 p-4 ${style.bg} ${style.border} space-y-3`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-base font-bold text-gray-900">{dateStr}</p>
          <p className="text-sm text-gray-500">{timeStr}</p>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${style.text} border ${style.border} bg-white`}>
          {style.label}
        </span>
      </div>

      {/* Stats row */}
      <div className="flex gap-4 text-sm">
        <div>
          <p className="text-gray-500 text-xs">{t('sosHistory.contactsNotified')}</p>
          <p className="font-bold text-gray-900">{sos.contactsNotified ?? '—'}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">{t('sosHistory.trigger')}</p>
          <p className="font-bold text-gray-900 capitalize">{sos.triggeredBy || 'User'}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">{t('sosHistory.attempts')}</p>
          <p className="font-bold text-gray-900">{sos.attempts ?? 1}</p>
        </div>
      </div>

      {/* Location link */}
      {sos.mapsLink && (
        <a
          href={sos.mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline"
        >
          📍 {t('sosHistory.viewOnMap')}
        </a>
      )}

      {/* Error message */}
      {sos.error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">{sos.error}</p>
      )}
    </div>
  );
}

export default function SOSHistory() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser?.uid) return;
    (async () => {
      const result = await getSOSHistory(currentUser.uid, 20);
      if (result.success) {
        setHistory(result.data);
      } else {
        setError(result.error);
      }
      setLoading(false);
    })();
  }, [currentUser]);

  const handleNavigation = (item) => {
    const routes = { home: '/dashboard', contacts: '/profile', navigate: '/navigate', settings: '/settings' };
    navigate(routes[item] || '/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col pb-24">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-2xl font-bold text-gray-900">{t('sosHistory.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('sosHistory.subtitle')}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
            <p className="text-sm text-gray-500">{t('sosHistory.loadingHistory')}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && history.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <span className="text-6xl">🛡️</span>
            <h2 className="text-xl font-bold text-gray-800">{t('sosHistory.noEmergencies')}</h2>
            <p className="text-sm text-gray-500 max-w-xs">
              {t('sosHistory.noEmergenciesDesc')}
            </p>
          </div>
        )}

        {!loading && history.map((sos) => (
          <SOSCard key={sos.id} sos={sos} />
        ))}

        {/* Summary footer */}
        {!loading && history.length > 0 && (
          <div className="pt-2 text-center">
            <p className="text-xs text-gray-400">
              {history.length} {history.length !== 1 ? t('sosHistory.records') : t('sosHistory.record')}
            </p>
          </div>
        )}
      </div>

      <BottomNav activeItem="home" onItemClick={handleNavigation} />
    </div>
  );
}
