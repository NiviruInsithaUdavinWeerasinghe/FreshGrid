import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook to track user idle time and trigger warnings/logout.
 * @param {Object} params
 * @param {number} params.timeout - Time in ms before idle action (default 15 minutes)
 * @param {number} params.warningTime - Time in ms before idle action to trigger warning (default 60s)
 * @param {Function} params.onIdle - Callback triggered when timeout completes
 * @param {Function} params.onWarning - Callback triggered when entering warning period, receives remaining seconds
 * @param {Function} params.onActive - Callback triggered if user becomes active during warning period
 */
export const useIdleTimeout = ({
  timeout = 15 * 60 * 1000,
  warningTime = 60 * 1000,
  onIdle,
  onWarning,
  onActive,
}) => {
  const [isWarning, setIsWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(warningTime / 1000);

  const warnTimerRef = useRef(null);
  const idleTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // Events that denote activity
  const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];

  const resetTimer = () => {
    // If we were in warning phase, notify that user is active again
    if (isWarning) {
      setIsWarning(false);
      if (onActive) onActive();
    }

    // Clear existing timers
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    setSecondsRemaining(warningTime / 1000);

    // Set timer to trigger warning
    const timeBeforeWarning = timeout - warningTime;
    warnTimerRef.current = setTimeout(() => {
      setIsWarning(true);
      startWarningCountdown();
    }, timeBeforeWarning);

    // Set timer to trigger final idle action
    idleTimerRef.current = setTimeout(() => {
      if (onIdle) onIdle();
    }, timeout);
  };

  const startWarningCountdown = () => {
    let timeLeft = warningTime / 1000;
    setSecondsRemaining(timeLeft);

    countdownIntervalRef.current = setInterval(() => {
      timeLeft -= 1;
      setSecondsRemaining(timeLeft);
      if (onWarning) onWarning(timeLeft);

      if (timeLeft <= 0) {
        clearInterval(countdownIntervalRef.current);
      }
    }, 1000);
  };

  useEffect(() => {
    // Initialise timer
    resetTimer();

    // Listen to activity events
    const handleActivity = () => {
      resetTimer();
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      // Cleanup events and timers
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isWarning, timeout, warningTime]);

  return {
    isWarning,
    secondsRemaining,
    resetTimer,
  };
};

export default useIdleTimeout;
