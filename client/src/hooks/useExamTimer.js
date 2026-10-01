import { useState, useEffect, useRef } from 'react';

export function useExamTimer({ initialSeconds, loading, onTimeUp }) {
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds || 3600);

  useEffect(() => {
    if (initialSeconds !== undefined && initialSeconds !== null) {
      setRemainingSeconds(initialSeconds);
    }
  }, [initialSeconds]);

  const onTimeUpRef = useRef(onTimeUp);

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    if (loading) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onTimeUpRef.current) onTimeUpRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading]);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const syncTimer = (authoritativeRemaining) => {
    if (authoritativeRemaining !== undefined && authoritativeRemaining !== null) {
      setRemainingSeconds(authoritativeRemaining);
      if (authoritativeRemaining <= 0 && onTimeUpRef.current) {
        onTimeUpRef.current();
      }
    }
  };

  return { remainingSeconds, formatTimer, syncTimer };
}
