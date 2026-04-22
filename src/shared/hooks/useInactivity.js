import { useEffect, useState } from 'react';
import { INACTIVITY_TIMEOUT, SOS_COUNTDOWN } from '../utils/constants';

export const useInactivity = (onInactivityTriggered) => {
  const [isInactive, setIsInactive] = useState(false);
  const [countdown, setCountdown] = useState(SOS_COUNTDOWN);
  let timeoutId;
  let countdownId;

  const resetTimer = () => {
    clearTimeout(timeoutId);
    setIsInactive(false);
    setCountdown(SOS_COUNTDOWN);

    timeoutId = setTimeout(() => {
      setIsInactive(true);
      setCountdown(SOS_COUNTDOWN);
      startCountdown();
    }, INACTIVITY_TIMEOUT);
  };

  const startCountdown = () => {
    let count = SOS_COUNTDOWN;
    countdownId = setInterval(() => {
      count -= 1;
      setCountdown(count);

      if (count === 0) {
        clearInterval(countdownId);
        if (onInactivityTriggered) {
          onInactivityTriggered();
        }
      }
    }, 1000);
  };

  const handleUserActivity = () => {
    if (isInactive) {
      setIsInactive(false);
    }
    resetTimer();
  };

  useEffect(() => {
    // Setup event listeners
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((event) => {
      window.addEventListener(event, handleUserActivity);
    });

    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      clearInterval(countdownId);
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, []);

  return { isInactive, countdown };
};

export default useInactivity;
