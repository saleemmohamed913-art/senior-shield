// Format location as readable address
export const formatLocation = (location) => {
  return `Lat: ${location.latitude.toFixed(4)}, Lng: ${location.longitude.toFixed(4)}`;
};

// Format date and time
export const formatDateTime = (date) => {
  return new Date(date).toLocaleString();
};

// Format time duration
export const formatDuration = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

// Speak text using Web Speech API
export const speakText = (text, language = 'en-US') => {
  return new Promise((resolve, reject) => {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.9; // Slightly slower for elderly users
      utterance.pitch = 1.0;
      
      utterance.onend = () => resolve();
      utterance.onerror = (error) => reject(error);
      
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      reject(error);
    }
  });
};

// Stop speaking
export const stopSpeaking = () => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

// Check if browser supports geolocation
export const isGeolocationSupported = () => {
  return !!navigator.geolocation;
};

// Check if browser supports Web Speech API
export const isSpeechSupported = () => {
  return 'speechSynthesis' in window || 'webkitSpeechSynthesis' in window;
};

// Validate phone number — accepts international formats e.g. +91 9876543210, +1-555-123-4567
export const isValidPhone = (phone) => {
  // Strip spaces, dashes, dots, parentheses then check: +countryCode + 7-14 digits
  const cleaned = phone.replace(/[\s().\-]/g, '');
  const phoneRegex = /^\+?[1-9]\d{6,14}$/;
  return phoneRegex.test(cleaned);
};

// Generate unique ID
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Debounce function
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Throttle function
export const throttle = (func, limit) => {
  let lastRun = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastRun >= limit) {
      func(...args);
      lastRun = now;
    }
  };
};

// Play a loud emergency beep
export const playAlarmBeep = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, ctx.currentTime); // 800Hz beep
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(1, ctx.currentTime); // High volume
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.warn("Audio alarm playback blocked or failed:", e);
  }
};
