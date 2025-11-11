import { useEffect, useRef } from 'react';

interface UseIdleTimeoutOptions {
  onIdle: () => void;
  onWarning?: () => void;
  idleTime?: number;
  warningTime?: number;
}

export function useIdleTimeout({
  onIdle,
  onWarning,
  idleTime = 5 * 60 * 1000, // 5 minutes
  warningTime = 30 * 1000, // 30 seconds
}: UseIdleTimeoutOptions) {
  const timeoutId = useRef<number | null>(null);
  const warningTimeoutId = useRef<number | null>(null);

  const resetTimer = () => {
    // Clear existing timers
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    if (warningTimeoutId.current) {
      clearTimeout(warningTimeoutId.current);
    }

    // Set warning timer (if callback provided)
    if (onWarning && warningTime > 0) {
      const warningDelay = idleTime - warningTime;
      warningTimeoutId.current = setTimeout(() => {
        onWarning();
      }, warningDelay) as unknown as number;
    }

    // Set idle timeout
    timeoutId.current = setTimeout(() => {
      onIdle();
    }, idleTime) as unknown as number;
  };

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      resetTimer();
    };

    // Set initial timer
    resetTimer();

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    // Cleanup
    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
      if (warningTimeoutId.current) {
        clearTimeout(warningTimeoutId.current);
      }
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [idleTime, warningTime, onIdle, onWarning]);
}
