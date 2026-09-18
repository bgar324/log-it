"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const REST_PRESETS_SECONDS = [30, 60, 90, 120, 180];

export type RestTimer = {
  remaining: number | null;
  isRunning: boolean;
  isPaused: boolean;
  start: (seconds: number) => void;
  addSeconds: (seconds: number) => void;
  togglePause: () => void;
  stop: () => void;
};

type RestClock = { kind: "running"; deadline: number } | { kind: "paused"; remainingMs: number };

export function formatRestClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function formatRestPreset(seconds: number) {
  return seconds % 60 === 0 ? `${seconds / 60}m` : `${seconds}s`;
}

export function useRestTimer(): RestTimer {
  const clockRef = useRef<RestClock | null>(null);
  const intervalRef = useRef<number | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const syncClock = useCallback(() => {
    const clock = clockRef.current;
    if (!clock) return;
    const milliseconds = clock.kind === "running" ? clock.deadline - Date.now() : clock.remainingMs;
    if (milliseconds <= 0) {
      clockRef.current = null;
      clearTimer();
      setRemaining(null);
      setIsPaused(false);
      toast.success("Rest complete", { description: "Time for your next set." });
      navigator.vibrate?.([120, 60, 120]);
    } else {
      setRemaining(Math.ceil(milliseconds / 1000));
    }
  }, [clearTimer]);

  const runTimer = useCallback(() => {
    clearTimer();
    syncClock();
    if (clockRef.current?.kind === "running") {
      intervalRef.current = window.setInterval(syncClock, 250);
    }
  }, [clearTimer, syncClock]);

  useEffect(() => {
    // Mobile browsers suspend interval callbacks while the screen is locked.
    // The wall clock, not the number of callbacks, owns elapsed rest time.
    document.addEventListener("visibilitychange", syncClock);
    window.addEventListener("pageshow", syncClock);
    return () => {
      clearTimer();
      document.removeEventListener("visibilitychange", syncClock);
      window.removeEventListener("pageshow", syncClock);
    };
  }, [clearTimer, syncClock]);

  function start(seconds: number) {
    clockRef.current = { kind: "running", deadline: Date.now() + seconds * 1000 };
    setIsPaused(false);
    runTimer();
  }

  function stop() {
    clockRef.current = null;
    clearTimer();
    setIsPaused(false);
    setRemaining(null);
  }

  function addSeconds(seconds: number) {
    const clock = clockRef.current;
    if (!clock) return;
    clockRef.current = clock.kind === "running"
      ? { kind: "running", deadline: clock.deadline + seconds * 1000 }
      : { kind: "paused", remainingMs: clock.remainingMs + seconds * 1000 };
    syncClock();
  }

  function togglePause() {
    const clock = clockRef.current;
    if (!clock) return;
    if (clock.kind === "paused") {
      clockRef.current = { kind: "running", deadline: Date.now() + clock.remainingMs };
      setIsPaused(false);
      runTimer();
    } else {
      const remainingMs = clock.deadline - Date.now();
      if (remainingMs <= 0) { syncClock(); return; }
      clockRef.current = { kind: "paused", remainingMs };
      clearTimer();
      setIsPaused(true);
      syncClock();
    }
  }

  return { remaining, isRunning: remaining !== null, isPaused, start, addSeconds, togglePause, stop };
}
