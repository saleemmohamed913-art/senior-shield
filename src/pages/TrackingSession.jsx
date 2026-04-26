import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { subscribeToTrackingSession, validateTrackingSession } from '../services/firestoreService';
import MapView from '../components/MapView';
import { MapPin, AlertCircle, CheckCircle2, Clock, Share2 } from 'lucide-react';

// Real-time "last updated" label
function useTimeSince(timestamp) {
  const [label, setLabel] = useState('—');
  useEffect(() => {
    if (!timestamp) return;
    const update = () => {
      const diff = Math.floor((Date.now() - timestamp?.toDate?.() || timestamp) / 1000);
      if (diff < 10) setLabel('Just now');
      else if (diff < 60) setLabel(`${diff}s ago`);
      else if (diff < 3600) setLabel(`${Math.floor(diff / 60)}m ago`);
      else setLabel(`${Math.floor(diff / 3600)}h ago`);
    };
    update();
    const id = setInterval(update, 5000);
    return () => clearInterval(id);
  }, [timestamp]);
  return label;
}

export default function TrackingSession() {
  const { sessionId } = useParams();
  const [status, setStatus] = useState('loading'); // loading | valid | expired | error
  const [errorMsg, setErrorMsg] = useState('');
  const [location, setLocation] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [sessionData, setSessionData] = useState(null);

  const lastUpdatedLabel = useTimeSince(updatedAt);
  const isActive = updatedAt && Date.now() - (updatedAt?.toDate?.() || updatedAt).getTime() < 120000;

  // Validate session on mount
  useEffect(() => {
    const validateSession = async () => {
      const result = await validateTrackingSession(sessionId);
      if (result.success) {
        setStatus('valid');
        setSessionData(result.data);
        if (result.data.location) {
          setLocation(result.data.location);
          setUpdatedAt(result.data.updatedAt);
        }
      } else {
        setStatus('error');
        setErrorMsg(result.error || 'Unable to access tracking session');
      }
    };

    validateSession();
  }, [sessionId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (status !== 'valid') return;

    const unsub = subscribeToTrackingSession(sessionId, (result) => {
      if (result.success) {
        const data = result.data;
        
        // Check if session expired
        if (!data.active || data.expiresAt < Date.now()) {
          setStatus('expired');
          setErrorMsg('Tracking session has expired or been ended');
          return;
        }

        setSessionData(data);
        if (data.location) {
          setLocation(data.location);
          setUpdatedAt(data.updatedAt);
        }
      }
    });

    return () => unsub && unsub();
  }, [sessionId, status]);

  const shareLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    alert('Link copied to clipboard!');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <MapPin size={48} className="text-blue-500" />
          </div>
          <p className="text-gray-700 font-medium">Validating tracking session...</p>
        </div>
      </div>
    );
  }

  if (status === 'error' || status === 'expired') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {status === 'expired' ? 'Session Expired' : 'Invalid Session'}
          </h2>
          <p className="text-gray-600 mb-6">{errorMsg}</p>
          <a
            href="/"
            className="inline-block px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <h1 className="text-2xl font-bold text-gray-900">Live Location Tracking</h1>
            </div>
            <button
              onClick={shareLink}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              <Share2 size={18} />
              Share
            </button>
          </div>

          {/* Status Info */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              {isActive ? (
                <CheckCircle2 size={18} className="text-green-500" />
              ) : (
                <Clock size={18} className="text-gray-400" />
              )}
              <span className="text-gray-600">
                {isActive ? 'Active now' : 'Inactive'} • {lastUpdatedLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 max-w-4xl mx-auto w-full p-4">
        {location ? (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-96">
            <MapView
              center={[location.latitude, location.longitude]}
              markers={[
                {
                  position: [location.latitude, location.longitude],
                  label: 'Current Location',
                  accuracy: location.accuracy,
                },
              ]}
            />
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 font-medium mb-1">Latitude</p>
                  <p className="text-gray-900 font-mono">{location.latitude.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium mb-1">Longitude</p>
                  <p className="text-gray-900 font-mono">{location.longitude.toFixed(6)}</p>
                </div>
                {location.accuracy && (
                  <div>
                    <p className="text-gray-500 font-medium mb-1">Accuracy</p>
                    <p className="text-gray-900">±{Math.round(location.accuracy)}m</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500 font-medium mb-1">Last Updated</p>
                  <p className="text-gray-900">{lastUpdatedLabel}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <MapPin size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Waiting for location data...</p>
            <p className="text-sm text-gray-500 mt-2">Location will appear here once the sender starts sharing</p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-white border-t border-gray-200 px-4 py-4 text-center text-sm text-gray-600">
        <p>Session will expire in {sessionData?.expiresAt ? Math.ceil((sessionData.expiresAt - Date.now()) / 60000) : '—'} minutes</p>
      </div>
    </div>
  );
}
