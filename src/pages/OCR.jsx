import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Copy, Volume2, RotateCcw, X, Pause, Play, AlertCircle, ScanLine, Camera, Search } from 'lucide-react';
import Tesseract from 'tesseract.js';
import { BottomNav } from '../shared/components';

export default function OCR() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // State
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('eng');
  const [copied, setCopied] = useState(false);
  const [scanActive, setScanActive] = useState(true);
  const [videoWidth, setVideoWidth] = useState(0);
  const [videoHeight, setVideoHeight] = useState(0);

  // Languages
  const languages = [
    { code: 'eng', name: 'English' },
    { code: 'eng+hin', name: 'Hindi' },
    { code: 'eng+tam', name: 'Tamil' },
  ];

  // Start camera
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      console.log('Starting camera for live scanning...');
      setError(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("Camera not supported");
        setError("Camera access is not supported by your device or browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Get video dimensions when it loads
        videoRef.current.onloadedmetadata = () => {
          setVideoWidth(videoRef.current.videoWidth);
          setVideoHeight(videoRef.current.videoHeight);
          console.log('✅ Camera ready for live scanning');
        };
      }
    } catch (err) {
      console.error('❌ Camera error:', err);
      setError(`Camera access denied: ${err.message}`);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  // Real-time capture and OCR
  const captureAndRead = async () => {
    if (loading || !scanActive || !videoRef.current) return;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const img = canvas.toDataURL('image/png');

          setLoading(true);
          setProgress(0);

          const worker = await Tesseract.createWorker({
            workerPath: 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/worker.min.js',
          });

          worker.on('progress', (message) => {
            setProgress(Math.round(message.progress * 100));
          });

          const result = await worker.recognize(img, language);
          const detectedText = result.data.text;

          if (detectedText && detectedText.trim()) {
            setText(detectedText);
            console.log(`✅ Detected ${detectedText.split('\n').length} lines`);
          }

          await worker.terminate();
        }
      }
    } catch (err) {
      console.error('❌ OCR error:', err);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  // Auto-scan every 3 seconds
  useEffect(() => {
    if (!scanActive) return;

    const interval = setInterval(() => {
      captureAndRead();
    }, 3000);

    return () => clearInterval(interval);
  }, [loading, scanActive, language]);

  // Auto read-aloud when text detected
  useEffect(() => {
    if (text && text.trim() && !loading) {
      try {
        // Stop any previous speech
        window.speechSynthesis.cancel();

        const msg = new SpeechSynthesisUtterance(text);
        msg.rate = 0.8; // Slower for clarity
        msg.pitch = 1;
        window.speechSynthesis.speak(msg);
        console.log('🔊 Reading text aloud...');
      } catch (err) {
        console.error('❌ Speech error:', err);
      }
    }
  }, [text, loading]);

  // Copy to clipboard
  const copyText = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Stop/start scanning
  const toggleScanning = () => {
    setScanActive(!scanActive);
    if (scanActive) {
      setText('');
      setBoxes([]);
      window.speechSynthesis.cancel();
    }
  };

  // Reset
  const reset = () => {
    setText('');
    setBoxes([]);
    setProgress(0);
    setCopied(false);
    window.speechSynthesis.cancel();
    setScanActive(true);
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

  return (
    <div className="lg:ml-64 min-h-screen bg-gray-50">
      <div className="fixed inset-0 lg:ml-64 flex flex-col pb-24 lg:pb-0">
        {/* Header */}
        <div className="bg-white px-4 py-3.5 mb-3 border-b border-[#f3f4f6]">
          <h1 className="text-2xl font-bold text-gray-900">{t('ocr.title')}</h1>
          <p className="text-[13px] font-medium text-gray-500 mt-1">{t('ocr.subtitle')}</p>
        </div>

        {/* Error Alert - Compact Inline */}
        {error && (
          <div className="mx-4 mb-4 bg-[#fef2f2] border border-[#fecaca] rounded-[10px] px-3 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#991b1b]" />
              <p className="text-[13px] font-medium text-[#991b1b]">{t('ocr.cameraRequired')}</p>
            </div>
            <button 
              onClick={startCamera} 
              className="bg-[#2563eb] text-white px-3 py-1.5 rounded-[8px] text-[12px] font-bold shrink-0 active:scale-95 transition-transform whitespace-nowrap"
            >
              {t('ocr.enable')}
            </button>
          </div>
        )}

        {/* Language Selector */}
        <div className="mx-4 mb-4 space-y-2">
          <label className="text-[13px] font-semibold text-gray-700 block">{t('ocr.language')}</label>
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full appearance-none px-3 py-2.5 bg-white border border-[#e5e7eb] rounded-[12px] text-[14px] text-gray-900 font-medium focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
            </div>
          </div>
        </div>

        {/* Main Camera Area - Hero Element */}
        <div className="mx-4 mb-4 relative rounded-[16px] overflow-hidden bg-black shadow-md" style={{ height: '280px' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Scan Frame */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-2 border-dashed border-[#2563eb] rounded-[12px]" style={{ width: '80%', height: '80px' }} />
          </div>

          <div className="absolute bottom-3 left-0 right-0 text-center">
            <p className="text-[12px] text-gray-300 font-medium drop-shadow-md">{t('ocr.alignText')}</p>
          </div>
        </div>

        {/* Scanner Progress Bar */}
        {loading && (
          <div className="mx-4 mb-3">
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div className="bg-[#2563eb] h-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Scanning Status & Reset - Row Layout */}
        <div className="mx-4 mb-4 flex items-center justify-between">
          {scanActive ? (
            <span className="text-[#2563eb] font-semibold text-[14px] flex items-center gap-2">
              <ScanLine className="w-4 h-4" /> {t('ocr.scanning')}
            </span>
          ) : (
            <span className="text-gray-500 font-semibold text-[14px] flex items-center gap-2">
              <Pause className="w-4 h-4" /> {t('ocr.paused')}
            </span>
          )}
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-[#1f2937] font-semibold text-[13px] bg-white border border-[#e5e7eb] px-3.5 py-2 rounded-[10px] active:scale-95 transition-transform hover:bg-gray-50"
          >
            <RotateCcw className="w-3.5 h-3.5" /> {t('ocr.reset')}
          </button>
        </div>

        {/* Pause/Resume Action - Primary Button */}
        <div className="px-4 pb-24 lg:pb-0">
          <button
            onClick={toggleScanning}
            className={`w-full py-3.5 px-4 rounded-[12px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 ${
              scanActive
                ? 'bg-[#2563eb] text-white'
                : 'bg-[#10b981] text-white'
            }`}
          >
            {scanActive ? (
              <>
                <Pause className="w-5 h-5" /> {t('ocr.pauseScanning')}
              </>
            ) : (
              <>
                <Play className="w-5 h-5" /> {t('ocr.resumeScanning')}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result Sheet (Bottom Modal) */}
      {text && (
        <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[20px] shadow-2xl border-t border-gray-200 p-4 z-50 max-h-60 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-[15px]">{t('ocr.detectedText')}</h3>
            <button
              onClick={() => setText('')}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Text Display */}
          <p className="text-[14px] text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">
            {text}
          </p>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                const msg = new SpeechSynthesisUtterance(text);
                msg.rate = 0.8;
                window.speechSynthesis.speak(msg);
              }}
              className="flex-1 bg-[#2563eb] hover:bg-[#1d4ed8] text-white py-3 px-3 rounded-[12px] font-semibold text-[14px] flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Volume2 className="w-4 h-4" />
              {t('ocr.speak')}
            </button>

            <button
              onClick={copyText}
              className="flex-1 border border-[#e5e7eb] text-[#2563eb] hover:bg-[#f8fafc] py-3 px-3 rounded-[12px] font-semibold text-[14px] transition-all active:scale-95"
            >
              {copied ? `✓ ${t('ocr.copied')}` : t('ocr.copy')}
            </button>
          </div>
        </div>
      )}

      {/* Hidden Canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Bottom Navigation */}
      <BottomNav onItemClick={handleNavigation} />
    </div>
  );
}
