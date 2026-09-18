"use client";

import { useEffect, useRef, useState } from "react";

export type IonicRestTimer = {
  remainingSeconds: number | null;
  durationSeconds: number | null;
  isPaused: boolean;
  start: (seconds: number) => void;
  addSeconds: (seconds: number) => void;
  togglePause: () => void;
  stop: () => void;
};

export function formatRestClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function formatRestDuration(seconds: number) {
  return seconds % 60 === 0 ? `${seconds / 60} min` : `${seconds} sec`;
}

// Nothing here starts on its own. The timer runs when the user starts one, or
// when they have chosen an auto duration in the tools sheet — the default is
// off, because a rest clock the user did not ask for is noise mid-set.
export function useIonicRestTimer(onComplete: () => void): IonicRestTimer {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  function clearInterval() {
    if (intervalRef.current === null) {
      return;
    }

    window.clearInterval(intervalRef.current);
    intervalRef.current = null;
  }

  function runInterval() {
    clearInterval();
    intervalRef.current = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current === null) {
          return null;
        }

        if (current <= 1) {
          clearInterval();
          onCompleteRef.current();
          return null;
        }

        return current - 1;
      });
    }, 1000);
  }

  useEffect(() => clearInterval, []);

  return {
    remainingSeconds,
    durationSeconds,
    isPaused,
    start: (seconds) => {
      if (seconds <= 0) {
        return;
      }

      setDurationSeconds(seconds);
      setRemainingSeconds(seconds);
      setIsPaused(false);
      runInterval();
    },
    addSeconds: (seconds) => {
      setRemainingSeconds((current) =>
        current === null ? null : Math.max(current + seconds, 1),
      );
    },
    togglePause: () => {
      setIsPaused((paused) => {
        if (remainingSeconds === null) {
          return false;
        }

        if (paused) {
          runInterval();
          return false;
        }

        clearInterval();
        return true;
      });
    },
    stop: () => {
      clearInterval();
      setRemainingSeconds(null);
      setDurationSeconds(null);
      setIsPaused(false);
    },
  };
}
