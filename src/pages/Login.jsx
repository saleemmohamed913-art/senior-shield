import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { setupRecaptchaVerifier, sendPhoneOTP, verifyPhoneOTP } from '../services/authService';
import { isValidPhone } from '../utils/helpers';
import { Input, Button, Alert } from '../components/MobileFirstComponents';
import PhoneInput from '../components/PhoneInput';

export default function Login() {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('+91 ');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(0);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  // Clear Recaptcha on unmount to prevent duplicated rendering in Hot Reload
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      clearInterval(timerRef.current);
    };
  }, []);

  // Start 10-min countdown when OTP is sent
  const startCountdown = () => {
    setOtpSecondsLeft(10 * 60); // 600 seconds
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setOtpSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 500);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const otpExpired = otpSent && otpSecondsLeft === 0;

  // Send Phone OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!isValidPhone(phone)) {
      setError('Please enter a valid phone number with country code (e.g., +1)');
      setLoading(false);
      return;
    }

    try {
      const verifier = setupRecaptchaVerifier();
      if (!verifier) {
        throw new Error('Security verification failed. Please try again.');
      }

      const result = await sendPhoneOTP(phone, verifier);
      if (result.success) {
        setConfirmationResult(result.confirmationResult);
        setOtpSent(true);
        startCountdown();
      } else {
        setError(result.error || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    }
    setLoading(false);
  };

  // Verify Phone OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!otp || otp.length !== 6) {
      setError('Please enter the complete 6-digit verification code');
      setLoading(false);
      return;
    }

    try {
      const result = await verifyPhoneOTP(confirmationResult, otp);
      if (result.success) {
        navigate('/register');
      } else {
        setError(result.error || 'Invalid code. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Header Section */}
      <div className="px-4 py-6 text-center space-y-2 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900">{t('common.appName')}</h1>
        <p className="text-base text-gray-600">Your Safety Companion</p>
      </div>

      {/* Content Section */}
      <div className="flex-1 px-4 py-6 overflow-y-auto">
        {/* reCAPTCHA Container */}
        <div id="recaptcha-container" className="flex justify-center mb-4"></div>

        {/* Error Alert */}
        {error && (
          <Alert type="error" message={error} className="mb-4" />
        )}

        {/* Form Section */}
        <form onSubmit={otpSent ? handleVerifyOTP : handleSendOTP} className="space-y-4">
          {!otpSent ? (
            // Phone Input Screen
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">{t('auth.login')}</h2>
                <p className="text-sm text-gray-600 mb-4">{t('auth.enterPhone')}</p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">{t('auth.phoneNumber')}</label>
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                  disabled={loading}
                />
                {phone && phone.replace(/\D/g, '').length < 7 && (
                  <p className="text-xs text-red-600">{t('auth.invalidPhone')}</p>
                )}
              </div>
            </div>
          ) : (
            // OTP Input Screen
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{t('auth.verifyOTP')}</h2>
                <p className="text-sm text-gray-600">We sent a 6-digit code to<br /><span className="font-semibold text-gray-900">{phone}</span></p>
              </div>
              <Input
                type="text"
                label={t('auth.otp')}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength="6"
                disabled={loading || otpExpired}
                error={
                  otp && otp.length !== 6
                    ? 'Enter all 6 digits'
                    : null
                }
                autoFocus
              />

              {/* Countdown Timer */}
              <div className={`flex items-center justify-between rounded-lg px-4 py-3 border-2 ${
                otpExpired
                  ? 'bg-red-50 border-red-300'
                  : otpSecondsLeft < 60
                  ? 'bg-amber-50 border-amber-300'
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <span className={`text-sm font-semibold ${
                  otpExpired ? 'text-red-700' : otpSecondsLeft < 60 ? 'text-amber-700' : 'text-blue-700'
                }`}>
                  {otpExpired ? '❌ Code expired' : '⏱ Code expires in'}
                </span>
                {!otpExpired && (
                  <span className={`text-lg font-black tabular-nums ${
                    otpSecondsLeft < 60 ? 'text-amber-700' : 'text-blue-700'
                  }`}>
                    {formatTime(otpSecondsLeft)}
                  </span>
                )}
                {otpExpired && (
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp('');
                      setError(null);
                      setOtpSecondsLeft(0);
                    }}
                    className="text-sm font-bold text-red-700 underline"
                  >
                    {t('auth.resendOTP')}
                  </button>
                )}
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Action Zone (Bottom) */}
      <div className="px-4 py-4 bg-white border-t border-gray-200 space-y-3 safe-area-inset-bottom">
        <Button
          onClick={otpSent ? handleVerifyOTP : handleSendOTP}
          disabled={loading || otpExpired}
          size="large"
          variant="primary"
        >
          {loading ? t('common.loading') : otpSent ? t('auth.verifyOTP') : t('auth.sendOTP')}
        </Button>

        {otpSent && (
          <Button
            type="button"
            onClick={() => {
              setOtpSent(false);
              setOtp('');
              setError(null);
            }}
            size="medium"
            variant="secondary"
          >
            {t('auth.phoneNumber')}
          </Button>
        )}
      </div>
    </div>
  );
}
