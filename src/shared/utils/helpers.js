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

// Validate phone number
export const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};
