import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useLanguageSync } from './hooks/useLanguageSync';
import { useLanguageChange } from './hooks/useLanguageChange';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import NavigatePage from './pages/Navigate';
import OCR from './pages/OCR';
import SOSHistory from './pages/SOSHistory';
import Settings from './pages/Settings';
import GuardianTrack from './pages/GuardianTrack';
import TrackingSession from './pages/TrackingSession';
import NotFound from './pages/NotFound';
import LoadingScreen from './components/LoadingScreen';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

// Request notification permission on app load
const requestNotificationPermission = () => {
  if ('Notification' in window && Notification.permission === 'default') {
    console.log('🔔 Requesting notification permission on app startup...');
    Notification.requestPermission().then(permission => {
      console.log('✅ Notification permission:', permission);
    });
  }
};

// ─── Private Route Guard ───────────────────────────────────────────────────
function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingScreen message="Checking your session…" />;

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// ─── Auth Route Guard ──────────────────────────────────────────────────────
function AuthRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingScreen message="Loading Senior Shield…" />;

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

// ─── Routes ───────────────────────────────────────────────────────────────
function AppRoutes() {
  const { i18n } = useTranslation();
  useLanguageSync(); // Sync HTML lang attribute with current i18n language
  useLanguageChange(); // Track language changes and persist preference
  
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes key={i18n.language}>
        {/* Auth Routes */}
        <Route path="/login"    element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />

        {/* Private Routes */}
        <Route path="/dashboard"   element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/profile"     element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/navigate"    element={<PrivateRoute><NavigatePage /></PrivateRoute>} />
        <Route path="/ocr"         element={<PrivateRoute><OCR /></PrivateRoute>} />
        <Route path="/sos-history" element={<PrivateRoute><SOSHistory /></PrivateRoute>} />
        <Route path="/settings"    element={<PrivateRoute><Settings /></PrivateRoute>} />

        {/* Public Guardian Tracking Route — token-gated inside the page */}
        <Route path="/track/:uid" element={<GuardianTrack />} />

        {/* Live Tracking Session Route */}
        <Route path="/track-session/:sessionId" element={<TrackingSession />} />

        {/* Default */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 — catch all unmatched routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  const { i18n } = useTranslation();
  const [languageKey, setLanguageKey] = useState(i18n.language);
  
  // Watch for language changes and force entire app re-render
  useEffect(() => {
    const handleLanguageChange = (lng) => {
      console.log('🔄 App-level language change detected:', lng);
      setLanguageKey(lng);
      document.documentElement.lang = lng;
    };

    i18n.on('languageChanged', handleLanguageChange);
    
    // Also set up initial language
    setLanguageKey(i18n.language);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);
  
  // Request notification permission when app loads
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <div key={languageKey}>
            <AppRoutes />
          </div>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}
