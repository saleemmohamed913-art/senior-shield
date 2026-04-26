import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { onSnapshot, doc, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getUserPublicName } from '../services/firestoreService';
import { Phone, Navigation, AlertCircle, Clock, Wifi, WifiOff } from 'lucide-react';

// ─── Relative Time Hook ───────────────────────────────────────────────────
function useTimeSince(timestamp) {
  const [label, setLabel] = useState('—');
  useEffect(() => {
    if (!timestamp) return;
    const update = () => {
      const diff = Math.floor((Date.now() - timestamp) / 1000);
      if (diff < 10) setLabel('Just now');
      else if (diff < 60) setLabel(`${diff}s ago`);
      else if (diff < 3600) setLabel(`${Math.floor(diff / 60)} min ago`);
      else setLabel('Over an hour ago');
    };
    update();
    const id = setInterval(update, 5000);
    return () => clearInterval(id);
  }, [timestamp]);
  return label;
}

function getSignal(location, lastUpdated) {
  if (!location) return 'waiting';
  if (!lastUpdated || Date.now() - lastUpdated > 15000) return 'weak';
  return 'live';
}

export default function GuardianTrack() {
  const { uid } = useParams();

  const [status, setStatus] = useState('validating');
  const [errorMsg, setErrorMsg] = useState('');
  const [userName, setUserName] = useState('');
  const [location, setLocation] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [userPhone, setUserPhone] = useState(null);
  const [userAge, setUserAge] = useState(null);
  const [sosAlerts, setSOSAlerts] = useState([]);
  const [realUserId, setRealUserId] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);

  const lastUpdatedLabel = useTimeSince(lastUpdated);
  const signal = getSignal(location, lastUpdated);
  const minutesLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt - Date.now()) / 60000)) : null;

  // ── Validate + observe trackingSession ────────────────────────────────
  useEffect(() => {
    if (!uid) { setStatus('error'); setErrorMsg('Invalid tracking link.'); return; }

    const unsub = onSnapshot(doc(db, 'trackingSessions', uid), async (snap) => {
      if (!snap.exists()) { setStatus('error'); setErrorMsg('Invalid tracking link'); return; }
      const data = snap.data();
      if (!data.active) { setStatus('error'); setErrorMsg('Tracking has ended'); return; }
      if (Date.now() > data.expiresAt) { setStatus('error'); setErrorMsg('Tracking session expired'); return; }

      setExpiresAt(data.expiresAt);

      if (data.location?.latitude && data.location?.longitude) {
        setLocation({ lat: data.location.latitude, lng: data.location.longitude, accuracy: data.location.accuracy });
        setLastUpdated(data.updatedAt?.toMillis?.() || data.updatedAt || Date.now());
      } else {
        setLocation(null);
      }

      setRealUserId(data.userId);
      setStatus('live');

      if (data.userId && !userName) {
        const name = await getUserPublicName(data.userId);
        setUserName(name || 'Unknown User');
      }
    }, () => { setStatus('error'); setErrorMsg('Error loading tracking session'); });

    return () => unsub();
  }, [uid]);

  // ── SOS history ───────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'live' || !realUserId) return;
    const unsub = onSnapshot(
      query(collection(db, 'users', realUserId, 'sosHistory'), orderBy('triggeredAt', 'desc'), limit(3)),
      (snap) => setSOSAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    );
    return () => unsub();
  }, [status, realUserId]);

  // ── Loading ───────────────────────────────────────────────────────────
  if (status === 'validating') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
        <p className="text-gray-800 text-lg font-semibold">Verifying Access</p>
        <p className="text-gray-500 text-sm">Validating tracking link...</p>
      </div>
    </div>
  );

  // ── Error ─────────────────────────────────────────────────────────────
  if (status === 'error') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-8 shadow text-center max-w-sm w-full border border-red-100">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 border border-red-200">
          <AlertCircle className="w-7 h-7 text-red-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 text-sm mb-4">{errorMsg}</p>
        <p className="text-xs text-gray-400">This link is valid for 1 hour from creation. Ask the person to generate a new link.</p>
      </div>
    </div>
  );

  // ── Signal config ─────────────────────────────────────────────────────
  const signalCfg = {
    live: { badgeColor: 'bg-green-600 text-white', statusText: 'Live signal active', textColor: 'text-green-700', Icon: Wifi },
    weak: { badgeColor: 'bg-yellow-400 text-black', statusText: 'Signal degraded', textColor: 'text-yellow-600', Icon: WifiOff },
    waiting: { badgeColor: 'bg-gray-400 text-white', statusText: 'Waiting for signal', textColor: 'text-gray-500', Icon: WifiOff },
  };
  const cfg = signalCfg[signal];
  const signalLabel = signal === 'live' ? 'Live' : signal === 'weak' ? 'Signal Weak' : 'Waiting';

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="bg-amber-500 text-white px-4 py-4 sticky top-0 z-10 shadow">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-semibold">Live Location Tracking</h1>
          {minutesLeft !== null && (
            <span className="text-sm opacity-90">Expires in {minutesLeft}m</span>
          )}
        </div>
        <div className="flex gap-2 mt-2.5">
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
            Tracking Started
          </span>
          <span className={`${cfg.badgeColor} px-3 py-1 rounded-full text-xs font-medium`}>
            {signalLabel}
          </span>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 pb-8">

        {/* ── User Card ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
            {userName.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{userName || 'Loading...'}</p>
            {userAge && <p className="text-xs text-gray-500">Age {userAge}</p>}
            <p className={`text-sm font-medium mt-0.5 ${cfg.textColor}`}>{cfg.statusText}</p>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Last updated: {lastUpdatedLabel}
            </p>
          </div>
        </div>

        {/* ── Map Card ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 flex justify-between items-center border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Live Location</h2>
            {location && (
              <span className="text-xs text-gray-400 font-mono">
                {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </span>
            )}
          </div>

          {location ? (
            <>
              <iframe
                title="Live Location Map"
                className="w-full h-64 border-0"
                src={`https://maps.google.com/maps?q=${location.lat},${location.lng}&z=16&output=embed`}
              />
              {location.accuracy && (
                <p className="text-xs text-gray-400 px-4 py-2 border-t border-gray-100">
                  Accuracy: ±{Math.round(location.accuracy)}m
                </p>
              )}
            </>
          ) : (
            <div className="h-52 flex flex-col items-center justify-center gap-3 bg-gray-50">
              <div className="w-9 h-9 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-sm font-medium text-gray-500">Fetching location...</p>
              <p className="text-xs text-gray-400 text-center max-w-[200px]">
                Map will appear once a live signal is received
              </p>
            </div>
          )}
        </div>

        {/* ── Action Buttons ─────────────────────────────────────────── */}
        <div className="space-y-3">
          {userPhone && (
            <a
              href={`tel:${userPhone}`}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm active:scale-95 transition-transform shadow-sm"
              style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
            >
              <Phone className="w-4 h-4" />
              Call {userName.split(' ')[0]}
            </a>
          )}
          {location && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`}
              target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm active:scale-95 transition-transform shadow-sm"
              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            >
              <Navigation className="w-4 h-4" />
              Navigate
            </a>
          )}
          {location && (
            <a
              href={`https://www.google.com/maps/search/hospital/@${location.lat},${location.lng},15z`}
              target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm active:scale-95 transition-transform shadow-sm"
              style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
            >
              <AlertCircle className="w-4 h-4" />
              Find Nearest Hospital
            </a>
          )}
        </div>

        {/* ── SOS History ────────────────────────────────────────────── */}
        {sosAlerts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Recent SOS Alerts</h2>
            <div className="divide-y divide-gray-100">
              {sosAlerts.map((alert) => {
                const date = alert.triggeredAt?.toDate?.() || new Date(alert.triggeredAt);
                const timeStr = new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).format(date);
                const statusStyle = {
                  active: 'bg-red-100 text-red-700',
                  acknowledged: 'bg-yellow-100 text-yellow-700',
                  completed: 'bg-green-100 text-green-700',
                }[alert.status] || 'bg-gray-100 text-gray-600';
                return (
                  <div key={alert.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-medium text-gray-800">SOS Alert</p>
                      <p className="text-xs text-gray-500">{timeStr}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusStyle}`}>
                      {alert.status || 'active'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <div className="text-center text-xs text-gray-400 pt-2 space-y-1">
          <p>This tracking link expires in {minutesLeft ?? '—'} minutes</p>
          <p>Powered by <span className="font-semibold text-gray-500">Senior Shield</span></p>
        </div>

      </div>
    </div>
  );
}
