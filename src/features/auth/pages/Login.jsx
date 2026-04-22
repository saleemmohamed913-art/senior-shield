import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setupRecaptchaVerifier, sendPhoneOTP, verifyPhoneOTP } from '../../services/authService';
import { isValidPhone } from '../../shared/utils/helpers';
import { Input, Button, Alert } from '../../shared/components';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
      <div className="px-4 py-4 text-center space-y-2 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900">Senior Shield</h1>
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
                <h2 className="text-xl font-bold text-gray-900 mb-3">Sign In</h2>
                <p className="text-sm text-gray-600 mb-4">Enter your phone number to verify your account</p>
              </div>
              <Input
                type="tel"
                label="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                disabled={loading}
                required
                error={
                  phone && !isValidPhone(phone)
                    ? 'Include country code (e.g., +1 for USA)'
                    : null
                }
                autoFocus
              />
            </div>
          ) : (
            // OTP Input Screen
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Verify Code</h2>
                <p className="text-sm text-gray-600">We sent a 6-digit code to<br /><span className="font-semibold text-gray-900">{phone}</span></p>
              </div>
              <Input
                type="text"
                label="Verification Code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength="6"
                disabled={loading}
                error={
                  otp && otp.length !== 6
                    ? 'Enter all 6 digits'
                    : null
                }
                autoFocus
              />
              <p className="text-sm text-gray-600">The code expires in 10 minutes</p>
            </div>
          )}
        </form>
      </div>

      {/* Action Zone (Bottom) */}
      <div className="px-4 py-4 bg-white border-t border-gray-200 space-y-3 safe-area-inset-bottom">
        <Button
          onClick={otpSent ? handleVerifyOTP : handleSendOTP}
          disabled={loading}
          size="large"
          variant="primary"
        >
          {loading ? 'Processing...' : (otpSent ? 'Verify & Continue' : 'Send Verification Code')}
        </Button>
        {otpSent && (
          <Button
            onClick={() => {
              setOtpSent(false);
              setOtp('');
              setError(null);
            }}
            disabled={loading}
            size="large"
            variant="secondary"
          >
            Change Phone Number
          </Button>
        )}
      </div>
    </div>
  );
}
