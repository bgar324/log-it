"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const REST_PRESETS_SECONDS = [60, 90, 120, 180];

export type RestTimer = {
  remaining: number | null;
  isRunning: boolean;
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

export function formatRestPreset(seconds: number) {
  return seconds % 60 === 0 ? `${seconds / 60}m` : `${seconds}s`;
}

function notifyRestComplete() {
  toast.success("Rest complete", { description: "Time for your next set." });
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate?.([120, 60, 120]);
  }
}

export function useRestTimer(): RestTimer {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function clearTimer() {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function runTimer() {
    clearTimer();
    intervalRef.current = setInterval(() => {
      setRemaining((current) => {
        if (current === null) {
          return current;
        }

        if (current <= 1) {
          clearTimer();
          notifyRestComplete();
          return null;
        }

        return current - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  function start(seconds: number) {
    setIsPaused(false);
    setRemaining(seconds);
    runTimer();
  }

  function stop() {
    clearTimer();
    setIsPaused(false);
    setRemaining(null);
  }

  function addSeconds(seconds: number) {
    setRemaining((current) => (current === null ? null : current + seconds));
  }

  function togglePause() {
    setIsPaused((paused) => {
      if (paused) {
        runTimer();
      } else {
        clearTimer();
      }

      return !paused;
    });
  }

  return {
    remaining,
    isRunning: remaining !== null,
    isPaused,
    start,
    addSeconds,
    togglePause,
    stop,
  };
}
