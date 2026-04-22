import { useEffect, useRef, useState } from "react";

export const useInactivity = (timeout = 15 * 60 * 1000) => {
  const [isInactive, setIsInactive] = useState(false);
  const timer = useRef(null);

  const resetTimer = () => {
    clearTimeout(timer.current);
    setIsInactive(false);

    timer.current = setTimeout(() => {
      setIsInactive(true);
    }, timeout);
  };

  useEffect(() => {
    const events = ["click", "touchstart", "keydown", "scroll"];

    events.forEach((event) =>
      window.addEventListener(event, resetTimer)
    );

    resetTimer();

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
      clearTimeout(timer.current);
    };
  }, []);

  return { isInactive, resetTimer };
};

export default useInactivity;
