import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Phone, Share2, HeartPulse, Star, MapPin, Navigation, BookOpen, Mic, Clock, Shield, AlertTriangle, Zap } from 'lucide-react';
import { AiOutlineAlert, AiOutlineCheckCircle } from 'react-icons/ai';
import { useAuth } from '../contexts/AuthContext';
import { useInactivity } from '../hooks/useInactivity';
import { useSOS } from '../hooks/useSOS';
import { useSafetyNotification } from '../hooks/useSafetyNotification';
import { speakText, playAlarmBeep } from '../utils/helpers';
import { FullscreenAlert, SOSCountdown } from '../components/MobileFirstComponents';
import MapView from '../components/MapView';
import { BottomNav } from '../shared/components';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useFallDetection } from '../hooks/useFallDetection';
import { logSOS, createTrackingSession, endTrackingSession } from '../services/firestoreService';
import { useLiveTracking } from '../hooks/useLiveTracking';
import { sendNativeSMS } from '../services/sosService';

const fetchWithTimeout = (url, options, timeout = 10000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), timeout)
    ),
  ]);
};

// Get time-based greeting - moved inside component to use i18n
export default function Dashboard() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { currentUser, userProfile, loading } = useAuth();
  const { triggerEmergencyAlert, sosLoading, sosError, isTracking, startTracking, stopTracking, location, getLocation } = useSOS();
  const { permission, requestPermission } = usePushNotifications(currentUser?.uid);
  const [sosActionLoading, setSosActionLoading] = React.useState(false);

  // Enable periodic safety notifications
  useSafetyNotification();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.goodMorning');
    if (hour < 18) return t('dashboard.goodAfternoon');
    return t('dashboard.goodEvening');
  };

  const [showSOSCountdown, setShowSOSCountdown] = React.useState(false);
  const [sosCountdownSeconds, setSOSCountdownSeconds] = React.useState(10);
  const [showSuccessAlert, setShowSuccessAlert] = React.useState(false);
  const [showFallAlert, setShowFallAlert] = React.useState(false);
  const [fallCountdown, setFallCountdown] = React.useState(15);
  const [trackingSessionId, setTrackingSessionId] = React.useState(null);
  const [trackingLink, setTrackingLink] = React.useState(null);
  const [isCreatingSession, setIsCreatingSession] = React.useState(false);

  const { isSupported: fallSupported, isMonitoring, startMonitoring, stopMonitoring } = useFallDetection({
    enabled: true,
    onFallDetected: () => {
      playAlarmBeep();
      speakText(t('fallDetection.fallDetected'), i18n.language);
      setShowFallAlert(true);
      setFallCountdown(15);
    },
  });

  // Fetch location on mount so map shows immediately
  React.useEffect(() => {
    if (!loading) getLocation();
  }, [loading]);

  const handleSOSClick = async () => {
    if (sosActionLoading) return;

    try {
      setSosActionLoading(true);
      console.log("🚨 SOS CLICKED");

      // 1. Validate contacts
      const contacts = userProfile?.emergencyContacts || [];
      if (!contacts || contacts.length === 0) {
        alert("No emergency contacts found. Please add them in Profile.");
        return;
      }

      // 2. Extract phone numbers
      const phoneNumbers = contacts
        .map(c => c.phone)
        .filter(num => num && num.length >= 10);

      if (!phoneNumbers.length) {
        alert("No valid phone numbers");
        return;
      }

      console.log("📞 Contacts:", phoneNumbers);

      // 3. Get location via Promise (ISOLATED TRY/CATCH)
      let mapsLink = "Location unavailable";
      let latitude = 'Unknown';
      let longitude = 'Unknown';

      try {
        let pos = location;
        if (!pos) {
          pos = await getLocation(); 
        }

        if (pos && pos.latitude) {
          latitude = pos.latitude;
          longitude = pos.longitude;
          mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
        }
        console.log("📍 Location:", mapsLink);
      } catch (err) {
        console.warn("⚠️ Location failed:", err);
      }

      // We don't want speakText to crash the SOS flow if Speech API is weird
      try {
        await speakText(
          latitude === 'Unknown' ? t('sos.sendingNoLocation') : t('sos.sendingLocation'),
          i18n.language
        );
      } catch (e) {
        console.warn('Speech error, proceeding anyway', e);
      }

      // 4. Call backend
      console.log("📡 About to call backend...");
      console.log("FINAL DATA:", {
        name: userProfile?.name || "User",
        contacts: phoneNumbers,
        location: mapsLink,
      });

      const API_URL = import.meta.env.VITE_API_URL || "https://senior-shield-backend.onrender.com/api";
      const res = await fetchWithTimeout(`${API_URL}/sos/trigger`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: userProfile?.name || "User",
          message: "Emergency! Need help",
          location: mapsLink,
          contacts: phoneNumbers,
        }),
      });

      console.log("📡 Response received");
      const data = await res.json();
      console.log("✅ Backend response:", data);

      if (!res.ok) throw new Error(data.error || "Backend failed");

      // 5. Save to Firestore
      try {
        await logSOS(currentUser.uid, {
          location: { latitude, longitude },
          mapsLink,
          triggeredAt: new Date(),
          triggeredBy: "user",
          status: "completed",
        });
      } catch (firestoreErr) {
        console.warn("⚠️ Firestore logging failed, proceeding", firestoreErr);
      }

      // 6. Start live tracking
      startTracking(currentUser.uid);
      
      // 7. Create tracking session and share link
      await handleCreateTrackingSession();

      alert("SOS sent successfully 🚨");
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);

    } catch (error) {
      console.error("❌ SOS failed:", error);

      // 🔁 Fallback (device SMS)
      const fallbackContacts = userProfile?.emergencyContacts || [];
      const primary = fallbackContacts.find(c => c.isPrimary) || fallbackContacts[0];
      if (primary && primary.phone) {
          console.log("🔁 Firing Native SMS Fallback to:", primary.phone);
          const fLat = location?.latitude || 'Unknown';
          const fLng = location?.longitude || 'Unknown';
          const fMapsLink = fLat !== 'Unknown' ? `https://maps.google.com/?q=${fLat},${fLng}` : 'Location Unavailable';
          sendNativeSMS(primary.phone, `🚨 EMERGENCY ALERT!\n\n${userProfile?.name} needs immediate help.\nLocation: ${fMapsLink}\n\nPlease check on them immediately.`);
      }
    } finally {
      setSosActionLoading(false);
    }
  };

  const handleSOSCancel = () => {
    setShowSOSCountdown(false);
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

  // Fall alert auto-SOS countdown
  React.useEffect(() => {
    if (!showFallAlert) return;
    const interval = setInterval(() => {
      setFallCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowFallAlert(false);
          handleSOSClick();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showFallAlert]);

  const { isInactive, resetTimer } = useInactivity();
  const [inactivityCountdown, setInactivityCountdown] = React.useState(15);

  // Use live tracking hook
  const { isTracking: liveTrackingActive } = useLiveTracking(trackingSessionId, !!trackingSessionId);

  // Generate tracking session and share via SMS
  const handleCreateTrackingSession = async () => {
    if (!currentUser || isCreatingSession) return;
    
    try {
      setIsCreatingSession(true);
      console.log('📍 Creating tracking session...');
      
      const sessionId = await createTrackingSession(currentUser.uid);
      console.log('✅ Tracking session created:', sessionId);

      if (!sessionId) throw new Error('No session ID returned');

      setTrackingSessionId(sessionId);
      
      const baseUrl = "https://senior-sheild-4ec1d.web.app";
      const generatedLink = `${baseUrl}/track/${sessionId}`;
      setTrackingLink(generatedLink);
      
      console.log('🔗 Tracking link:', generatedLink);
      
      const message = `🚨 Emergency Alert!\n\nTrack my live location:\n${generatedLink}\n\nSession expires in 1 hour.\n\n- Senior Shield`;
      
      // Share via SMS to emergency contacts
      if (userProfile?.emergencyContacts?.length > 0) {
        for (const contact of userProfile.emergencyContacts) {
          try {
            await sendNativeSMS(contact.phone, message);
            console.log('📱 SMS sent to', contact.name);
          } catch (err) {
            console.error('❌ Failed to send SMS to', contact.name, ':', err);
          }
        }
      }
      
      // Copy link to clipboard
      navigator.clipboard.writeText(generatedLink);
      console.log('📋 Link copied to clipboard');
      
      return sessionId;
    } catch (error) {
      console.error('❌ Failed to create tracking session:', error);
      alert('Failed to create tracking session: ' + error.message);
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Stop tracking session
  const handleStopTracking = async () => {
    if (!trackingSessionId) return;
    
    try {
      await endTrackingSession(trackingSessionId);
      console.log('✅ Tracking session ended:', trackingSessionId);
      setTrackingSessionId(null);
      setTrackingLink(null);
      alert('Live tracking stopped');
    } catch (error) {
      console.error('❌ Failed to stop tracking:', error);
    }
  };

  React.useEffect(() => {
    if (!isInactive) return;

    const playAlert = () => {
      playAlarmBeep();
      setTimeout(() => {
        speakText(t('inactivity.areYouOkay'), i18n.language);
      }, 600);
    };

    playAlert(); // immediate
    const repeatInterval = setInterval(playAlert, 5000); // repeat every 5 seconds

    setInactivityCountdown(15);

    const interval = setInterval(() => {
      setInactivityCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          clearInterval(repeatInterval);
          handleSOSClick(); // AUTO SOS
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(repeatInterval);
    };
  }, [isInactive, i18n.language, t]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-lg font-semibold text-gray-900">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col pb-24">
      {/* Fall Detected Alert Modal */}
      {showFallAlert && (
        <div className="fixed inset-0 bg-orange-600 flex flex-col items-center justify-center z-50 text-white p-6 text-center">
          <span className="text-6xl mb-4">🫃</span>
          <h1 className="text-4xl font-bold mb-3">{t('fallDetection.fallDetected')}</h1>
          <p className="text-xl mb-8">
            {t('fallDetection.fallMessage')} <span className="font-bold text-3xl">{fallCountdown}</span> {t('sos.seconds')}
          </p>
          <button
            onClick={() => setShowFallAlert(false)}
            className="w-full max-w-sm bg-white text-orange-600 text-2xl font-bold px-6 py-6 rounded-2xl shadow-xl transition-all active:scale-95"
          >
            {t('fallDetection.imOkay')}
          </button>
        </div>
      )}

      {/* Inactivity Check Modal */}
      {isInactive && (
        <div className="fixed inset-0 bg-red-600 flex flex-col items-center justify-center z-50 text-white p-6 text-center animate-fade-in">
          <AiOutlineAlert size={64} className="mb-6 animate-pulse" />
          <h1 className="text-4xl font-bold mb-4">{t('inactivity.areYouOkay')}</h1>
          <p className="text-xl mb-8">
            {t('inactivity.respondMessage')} <span className="font-bold text-3xl">{inactivityCountdown}</span> {t('sos.seconds')}
          </p>
          <button
            onClick={() => {
              resetTimer();
              if (isTracking) stopTracking();
            }}
            className="w-full max-w-sm bg-white text-red-600 text-2xl font-bold px-6 py-6 rounded-2xl shadow-xl transition-all active:scale-95"
          >
            {t('inactivity.imSafe')}
          </button>
        </div>
      )}

      {/* SOSCountdown Modal */}
      <SOSCountdown
        isActive={showSOSCountdown}
        seconds={sosCountdownSeconds}
        onCancel={handleSOSCancel}
        onComplete={() => {
          setShowSOSCountdown(false);
          handleSOSClick();
        }}
      />

      {/* Success Alert */}
      <FullscreenAlert
        isOpen={showSuccessAlert}
        title={t('dashboard.sosSuccess')}
        message={t('dashboard.sosMessage')}
        type="success"
        primaryAction={{
          label: t('sos.gotIt'),
          onClick: () => setShowSuccessAlert(false),
        }}
      />

      {/* Header */}
      <div className="px-4 pt-5 pb-1">
        <h1 className="text-[22px] font-semibold text-gray-800">
          Hi {userProfile?.name?.split(' ')[0] || 'There'}
        </h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 pb-24 space-y-3">
        
        {/* Status Badges */}
        <div className="flex gap-2 flex-wrap">
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
            You are Safe
          </span>
          {trackingSessionId && (
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse inline-block" />
              Live Tracking Active
            </span>
          )}
        </div>

        {/* SOS Button */}
        <div className="flex flex-col items-center py-5">
          <button
            onClick={() => {
              if ('speechSynthesis' in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(t('dashboard.sosAlert')));
              setShowSOSCountdown(true);
            }}
            disabled={sosActionLoading}
            className="w-32 h-32 rounded-full flex flex-col items-center justify-center active:scale-[0.97] transition-transform"
            style={{ backgroundColor: sosActionLoading ? '#b91c1c' : '#dc2626', boxShadow: '0 8px 24px rgba(220,38,38,0.35)' }}
          >
            {sosActionLoading
              ? <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              : <>
                  <AlertTriangle style={{ color: '#ffffff', width: 28, height: 28, marginBottom: 4 }} />
                  <span style={{ color: '#ffffff', fontSize: 20, fontWeight: 700, letterSpacing: 4 }}>SOS</span>
                </>
            }
          </button>
          <p className="text-gray-500 text-sm mt-3">{t('dashboard.tapForHelp')}</p>
        </div>


        {/* 3. CALL CONTACTS — All, primary highlighted first */}
        {userProfile?.emergencyContacts?.length > 0 && (
          <div className="space-y-2">
            {[...userProfile.emergencyContacts]
              .map((c, i) => ({ ...c, isPrimary: userProfile.emergencyContacts.some(x => x.isPrimary) ? c.isPrimary : i === 0 }))
              .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
              .map((contact, idx) => (
                <a
                  key={contact.id || idx}
                  href={`tel:${contact.phone}`}
                  onClick={() => { if ('speechSynthesis' in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(t('dashboard.callPrimary') + ' ' + contact.name.split(' ')[0])); }}
                  className="w-full border rounded-xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform shadow-sm"
                  style={{ borderColor: contact.isPrimary ? '#86efac' : '#eef2f7', backgroundColor: contact.isPrimary ? '#f0fdf4' : '#ffffff' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: contact.isPrimary ? '#dcfce7' : '#f3f4f6' }}>
                      <Phone style={{ color: contact.isPrimary ? '#16a34a' : '#6b7280', width: 16, height: 16 }} />
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold" style={{ color: contact.isPrimary ? '#15803d' : '#111827' }}>
                        {t('dashboard.callPrimary')} {contact.name.split(' ')[0]}
                      </p>
                      <p className="text-[12px] text-gray-500">{contact.phone}</p>
                    </div>
                  </div>
                  {contact.isPrimary && (
                    <span className="text-[11px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Primary</span>
                  )}
                </a>
              ))}
          </div>
        )}

        {/* Share Location Button */}
        {!trackingSessionId && (
          <button
            onClick={handleCreateTrackingSession}
            disabled={isCreatingSession}
            className="w-full py-3 rounded-xl font-semibold text-[14px] flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-sm"
            style={{ backgroundColor: isCreatingSession ? '#93c5fd' : '#2563eb', color: '#ffffff' }}
          >
            {isCreatingSession
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating link...</>
              : <><Share2 size={16} /> Share Location</>
            }
          </button>
        )}

        {/* Location Card */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-gray-600" />
            <span className="text-[15px] font-semibold text-gray-900">{t('dashboard.yourLocation')}</span>
          </div>
          {location?.latitude ? (
            <div className="relative h-[120px] rounded-lg overflow-hidden border border-gray-100">
              <MapView lat={location?.latitude} lng={location?.longitude} />
              <button
                onClick={() => window.open(`https://www.google.com/maps?q=${location.latitude},${location.longitude}`, '_blank')}
                className="absolute bottom-2 right-2 px-2.5 py-1.5 rounded-lg text-[12px] font-medium"
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
              >
                {t('dashboard.openMap')}
              </button>
            </div>
          ) : (
            <div className="h-[110px] rounded-lg border border-gray-100 bg-gray-50 flex flex-col items-center justify-center gap-2">
              <p className="text-[13px] text-gray-500">{t('dashboard.locationUnavailable')}</p>
              <button
                onClick={getLocation}
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium"
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
              >
                {t('dashboard.enableLocation')}
              </button>
            </div>
          )}
        </div>

        {/* Live Tracking Section */}
        {trackingSessionId && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                <p className="text-[14px] font-semibold text-red-700">Live Tracking Active</p>
              </div>
              <button
                onClick={handleStopTracking}
                className="text-[12px] font-medium px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
              >
                Stop
              </button>
            </div>

            {trackingLink && (
              <>
                <div className="bg-white border border-red-100 rounded-lg px-3 py-2 flex items-center gap-2">
                  <span className="text-[12px] text-gray-600 truncate font-mono flex-1">{trackingLink}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(trackingLink); alert('Link copied!'); }}
                    className="text-[12px] font-medium shrink-0"
                    style={{ color: '#2563eb' }}
                  >
                    Copy
                  </button>
                </div>
                <div className="flex gap-2">
                  <a
                    href={trackingLink}
                    target="_blank" rel="noopener noreferrer"
                    className="flex-1 py-2 rounded-lg text-[13px] font-semibold text-center"
                    style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                  >
                    Open
                  </a>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Emergency! Track my live location: ${trackingLink}`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex-1 py-2 rounded-lg text-[13px] font-semibold text-center"
                    style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                  >
                    Share
                  </a>
                </div>
              </>
            )}

            <p className="text-[11px] text-gray-500">
              Your location is being shared with emergency contacts.
            </p>
          </div>
        )}

        {/* Medical Info */}
        {(userProfile?.medicalCondition || userProfile?.age) && (
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <HeartPulse className="w-4 h-4 text-gray-600" />
              <h2 className="text-[15px] font-semibold text-gray-900">{t('dashboard.medicalInfo')}</h2>
            </div>
            {userProfile.medicalCondition && (
              <p className="text-[13px] text-gray-600 mt-1 ml-6">Condition: {userProfile.medicalCondition}</p>
            )}
            {userProfile.age && (
              <p className="text-[13px] text-gray-600 ml-6">Age: {userProfile.age}</p>
            )}
          </div>
        )}

      </div>

      {/* Bottom Navigation */}
      <BottomNav
        activeItem="home"
        onItemClick={handleNavigation}
      />
    </div>
  );
}
