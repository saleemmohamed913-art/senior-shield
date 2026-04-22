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
import { logSOS } from '../services/firestoreService';
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

      {/* 1. HERO SECTION */}
      <div className="px-4 py-4 bg-transparent">
        <h1 className="text-[28px] font-bold text-gray-900 leading-none">
          {t('dashboard.greeting')} {userProfile?.name?.split(' ')[0] || 'There'} 👋
        </h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 pb-24 space-y-3">
        
        {/* 1. STATUS PILL */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#dcfce7] rounded-full">
            <ShieldCheck className="text-green-600 w-4 h-4 shrink-0" />
            <span className="text-[14px] font-semibold text-green-900">{t('dashboard.youAreSafe')}</span>
          </div>
        </div>

        {/* 2. SOS BUTTON */}
        <div className="flex flex-col items-center py-4">
          <button
            onClick={() => {
              if ('speechSynthesis' in window) {
                window.speechSynthesis.speak(new SpeechSynthesisUtterance(t('dashboard.sosAlert')));
              }
              setShowSOSCountdown(true);  // Instead of triggering directly, this shows the countdown first!
            }}
            disabled={sosActionLoading}
            className={`w-[120px] h-[120px] bg-[#ef4444] rounded-full flex flex-col items-center justify-center text-white active:scale-[0.98] transition-transform shadow-[0_6px_16px_rgba(239,68,68,0.25)] flex-shrink-0 ${sosActionLoading ? 'opacity-75 bg-red-800' : ''}`}
          >
            {sosActionLoading ? (
              <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <AlertTriangle className="w-8 h-8 mb-1" />
                <span className="text-[20px] font-bold tracking-widest uppercase leading-none">SOS</span>
              </>
            )}
          </button>
          <div className="mt-3">
             <span className="text-[14px] font-medium text-gray-600">{t('dashboard.tapForHelp')}</span>
          </div>
        </div>


        {/* 3. CALL CONTACTS — All, primary highlighted first */}
        {userProfile?.emergencyContacts?.length > 0 && (
          <div className="space-y-2">
            {[...userProfile.emergencyContacts]
              .map((c, i) => ({ ...c, isPrimary: userProfile.emergencyContacts.some(x => x.isPrimary) ? c.isPrimary : i === 0 }))
              .sort((a, b) => (b.isPrimary === true ? 1 : 0) - (a.isPrimary === true ? 1 : 0))
              .map((contact, idx) => {
                const isPrimary = contact.isPrimary;
                return (
                  <a
                    key={contact.id || idx}
                    href={`tel:${contact.phone}`}
                  onClick={() => {
                    if ('speechSynthesis' in window) {
                      window.speechSynthesis.speak(new SpeechSynthesisUtterance(
                        t('dashboard.callPrimary') + ' ' + contact.name.split(' ')[0]
                      ));
                    }
                  }}
                  className={`w-full bg-white border p-[14px] rounded-[12px] flex flex-col gap-0.5 active:scale-[0.98] transition-transform shadow-sm text-left ${
                    isPrimary ? 'border-green-300 bg-green-50' : 'border-[#eef2f7]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Phone className={`w-5 h-5 ${isPrimary ? 'text-green-700' : 'text-gray-700'}`} />
                    <span className={`text-[16px] font-semibold ${isPrimary ? 'text-green-900' : 'text-gray-900'}`}>
                      {t('dashboard.callPrimary')} {contact.name.split(' ')[0]}
                    </span>
                    {isPrimary && <span className="ml-auto text-[11px] font-bold text-green-700">⭐ {t('dashboard.primaryContact')}</span>}
                  </div>
                  <span className="text-[13px] text-gray-500 font-medium ml-7">{contact.phone}</span>
                </a>
              );
            })}
          </div>
        )}

        {/* 4. LOCATION SECTION */}
        <div className="bg-white border border-[#eef2f7] p-[14px] rounded-[12px] shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-gray-700 font-semibold" />
            <span className="text-[16px] font-semibold text-gray-900">{t('dashboard.yourLocation')}</span>
          </div>
          
          {location?.latitude ? (
            <div className="relative h-[120px] rounded-[12px] overflow-hidden border border-[#e5e7eb] mt-1">
              <MapView lat={location?.latitude} lng={location?.longitude} />
              <button 
                onClick={() => {
                  if ('speechSynthesis' in window) {
                    window.speechSynthesis.speak(new SpeechSynthesisUtterance(t('dashboard.openMap')));
                  }
                  window.open(`https://www.google.com/maps?q=${location.latitude},${location.longitude}`, '_blank');
                }}
                className="absolute bottom-2 right-2 bg-[#2563eb] text-white px-2.5 py-1.5 rounded-[8px] text-[12px] font-medium active:scale-95 transition-transform shadow-md"
              >
                {t('dashboard.openMap')}
              </button>
            </div>
          ) : (
            <div className="h-[120px] rounded-[12px] border border-[#e5e7eb] mt-1 bg-gray-50 flex flex-col items-center justify-center gap-2">
              <span className="text-[13px] font-medium text-gray-500">{t('dashboard.locationUnavailable')}</span>
              <button 
                onClick={getLocation}
                className="bg-[#2563eb] text-white px-3 py-1.5 rounded-[8px] text-[12px] font-medium active:scale-95 transition-transform shadow-sm"
              >
                {t('dashboard.enableLocation')}
              </button>
            </div>
          )}
        </div>

        {/* 5. MEDICAL INFO */}
        {(userProfile?.medicalCondition || userProfile?.age) && (
          <div className="bg-white border border-[#eef2f7] rounded-[12px] p-[14px] shadow-sm flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-gray-700" />
              <h2 className="text-[16px] font-semibold text-gray-900">{t('dashboard.medicalInfo')}</h2>
            </div>
            <p className="text-[14px] font-medium text-gray-600 ml-7">
              {[userProfile.medicalCondition, userProfile.age ? `${t('dashboard.age')} ${userProfile.age}` : ''].filter(Boolean).join(' • ')}
            </p>
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
