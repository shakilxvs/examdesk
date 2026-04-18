import { useState, useEffect, useRef, useCallback } from 'react';

export function useTimer(durationSeconds, onExpire) {
  const [remaining, setRemaining] = useState(durationSeconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);
  const onExpireRef = useRef(onExpire);

  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  // FIX: When exam loads asynchronously, durationSeconds changes from 0 to
  // the real value. Since useState only takes the initial value once, we need
  // to sync remaining whenever durationSeconds changes (while not yet running).
  useEffect(() => {
    if (!running) setRemaining(durationSeconds);
  }, [durationSeconds]);

  const start = useCallback(() => setRunning(true), []);
  const pause = useCallback(() => setRunning(false), []);
  const reset = useCallback(() => {
    setRunning(false);
    setRemaining(durationSeconds);
  }, [durationSeconds]);

  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          onExpireRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const pct = durationSeconds > 0 ? (remaining / durationSeconds) * 100 : 0;

  const formatted = (() => {
    const h = Math.floor(remaining / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    const s = remaining % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  })();

  return { remaining, pct, formatted, running, start, pause, reset };
}
