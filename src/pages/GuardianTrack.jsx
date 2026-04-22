import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { onSnapshot, doc, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { validateTrackingToken, getUserPublicName, getLocationHistory } from '../services/firestoreService';
import MapView from '../components/MapView';
import { MapPin, Phone, Navigation, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

// Last-updated relative ticker
function useTimeSince(timestamp) {
  const [label, setLabel] = useState('—');
  useEffect(() => {
    if (!timestamp) return;
    const update = () => {
      const diff = Math.floor((Date.now() - timestamp) / 1000);
      if (diff < 10) setLabel('Just now');
      else if (diff < 60) setLabel(`${diff} seconds ago`);
      else if (diff < 3600) setLabel(`${Math.floor(diff / 60)} min ago`);
      else setLabel('Over an hour ago');
    };
    update();
    const id = setInterval(update, 5000);
    return () => clearInterval(id);
  }, [timestamp]);
  return label;
}

export default function GuardianTrack() {
  const { uid } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('validating'); // validating | error | live
  const [errorMsg, setErrorMsg] = useState('');
  const [userName, setUserName] = useState('');
  const [location, setLocation] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [userPhone, setUserPhone] = useState(null);
  const [sosAlerts, setSOSAlerts] = useState([]); // Recent SOS alerts
  const [userAge, setUserAge] = useState(null);

  const lastUpdatedLabel = useTimeSince(lastUpdated);

  // Derive live status - active if location updated within 2 minutes
  const isActive = lastUpdated && Date.now() - lastUpdated < 120000;

  // Step 1: Validate token on mount
  useEffect(() => {
    if (!uid || !token) {
      setStatus('error');
      setErrorMsg('Invalid tracking link. Please use the link sent in the SOS alert.');
      return;
    }

    (async () => {
      const result = await validateTrackingToken(uid, token);
      if (!result.valid) {
        setStatus('error');
        setErrorMsg(result.reason || 'Token expired or invalid');
        return;
      }

      // Fetch public user info
      const name = await getUserPublicName(uid);
      setUserName(name || 'Unknown User');
      setStatus('live');
    })();
  }, [uid, token]);

  // Step 2: Subscribe to live location updates after token validation
  useEffect(() => {
    if (status !== 'live') return;

    const unsubscribe = onSnapshot(
      doc(db, 'liveLocations', uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.location?.latitude && data.location?.longitude) {
            setLocation({
              lat: data.location.latitude,
              lng: data.location.longitude,
            });
            setLastUpdated(data.updatedAt?.toMillis?.() || Date.now());
            if (data.phone) setUserPhone(data.phone);
            if (data.age) setUserAge(data.age);
          }
        }
      },
      (err) => console.error('Location subscription error:', err)
    );

    return () => unsubscribe();
  }, [status, uid]);

  // Step 3: Subscribe to recent SOS alerts
  useEffect(() => {
    if (status !== 'live') return;

    const unsubscribe = onSnapshot(
      query(
        collection(db, 'users', uid, 'sosHistory'),
        orderBy('triggeredAt', 'desc'),
        limit(3)
      ),
      (snap) => {
        const alerts = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSOSAlerts(alerts);
      },
      (err) => console.error('SOS subscription error:', err)
    );

    return () => unsubscribe();
  }, [status, uid]);

  // --- VALIDATING ---
  if (status === 'validating') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <div className="space-y-2">
            <p className="text-gray-900 text-xl font-bold">Verifying Access</p>
            <p className="text-gray-600 text-sm">Validating tracking link...</p>
          </div>
        </div>
      </div>
    );
  }

  // --- ERROR / EXPIRED ---
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-red-100 flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-sm bg-white rounded-2xl p-8 shadow-lg border-2 border-red-200">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
            <p className="text-gray-600 text-base">{errorMsg}</p>
            <p className="text-sm text-gray-500 pt-2">
              This link may have expired (valid for 1 hour after SOS). Contact the elderly person to send a new SOS alert.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- LIVE DASHBOARD ---
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
      {/* Status Banner */}
      <div className={`${isActive ? 'bg-green-600' : 'bg-yellow-600'} px-4 py-4 shadow-lg text-white`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-white animate-pulse' : 'bg-yellow-200 animate-pulse'}`} />
            <span className="font-bold text-lg">Live Location Tracking</span>
          </div>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${isActive ? 'bg-green-700' : 'bg-yellow-700'}`}>
            {isActive ? 'Active' : 'Signal Weak'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4 p-4 overflow-y-auto pb-8">
        {/* Privacy Notice - PROMINENT */}
        <div className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-4 shadow-md">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-blue-900 text-base">Privacy & Confidentiality</h3>
              <p className="text-blue-800 text-sm mt-1">
                This link provides real-time location and SOS history. Keep it confidential. Only share with trusted guardians.
              </p>
              <p className="text-blue-700 text-xs mt-2 font-semibold">⏱️ Expires in 1 hour after SOS alert</p>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">{userName}</h2>
                {userAge && <span className="text-sm text-gray-600">Age {userAge}</span>}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <p className={`text-sm font-semibold ${isActive ? 'text-green-700' : 'text-yellow-700'}`}>
                  {isActive ? 'Actively sending location' : 'No recent signal'}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last updated: {lastUpdatedLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Live Map */}
        <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 pt-4 pb-2 flex items-center gap-2 border-b border-gray-200">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span className="text-base font-bold text-gray-900">Live Location</span>
          </div>
          {location ? (
            <MapView lat={location.lat} lng={location.lng} uid={uid} />
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500">
              <div className="text-center space-y-3">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto" />
                <p className="text-sm text-gray-600">Waiting for location...</p>
              </div>
            </div>
          )}
        </div>

        {/* Recent SOS Alerts */}
        {sosAlerts.length > 0 && (
          <div className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-base font-bold text-gray-900">Recent SOS Alerts</span>
            </div>
            <div className="space-y-2">
              {sosAlerts.map((alert) => {
                const date = alert.triggeredAt?.toDate?.() || new Date(alert.triggeredAt);
                const timeStr = new Intl.DateTimeFormat('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                }).format(date);
                const statusColor =
                  alert.status === 'active' ? 'bg-red-100 text-red-700' :
                  alert.status === 'acknowledged' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700';
                
                return (
                  <div key={alert.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{alert.userInfo?.name || 'SOS Alert'}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{timeStr}</p>
                      <p className="text-xs text-gray-500 mt-1 truncate">{alert.alertType || 'Emergency alert'}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ml-2 ${statusColor}`}>
                      {alert.status || 'Active'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          {userPhone && (
            <a
              href={`tel:${userPhone}`}
              className="flex flex-col items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:scale-95 transition-all rounded-xl py-4 font-bold text-white text-sm shadow-md border-2 border-green-700"
            >
              <Phone className="w-6 h-6" />
              Call
            </a>
          )}
          {location && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all rounded-xl py-4 font-bold text-white text-sm shadow-md border-2 border-blue-700"
            >
              <Navigation className="w-6 h-6" />
              Navigate
            </a>
          )}
          {location && (
            <a
              href={`https://www.google.com/maps/search/hospital/@${location.lat},${location.lng},15z`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 transition-all rounded-xl py-4 font-bold text-white text-sm shadow-md border-2 border-red-700 col-span-2"
            >
              <AlertCircle className="w-6 h-6" />
              Find Nearest Hospital
            </a>
          )}
        </div>

        {/* Info Footer */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-600">
            Tracking link expires 1 hour after the SOS alert. Share new link by sending new SOS.
          </p>
          <p className="text-xs text-gray-500 mt-2">Powered by Senior Shield</p>
        </div>
      </div>
    </div>
  );
}
