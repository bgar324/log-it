"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { styles } from "../workout-logger.styles";

const REST_PRESETS_SECONDS = [60, 90, 120, 180];

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function WorkoutLoggerRestTimer() {
  const [remaining, setRemaining] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function clearTimer() {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  useEffect(() => clearTimer, []);

  function start(seconds: number) {
    clearTimer();
    setRemaining(seconds);
    intervalRef.current = setInterval(() => {
      setRemaining((current) => {
        if (current === null) {
          return current;
        }

        if (current <= 1) {
          clearTimer();
          toast.success("Rest complete", { description: "Time for your next set." });
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate?.([120, 60, 120]);
          }
          return null;
        }

        return current - 1;
      });
    }, 1000);
  }

  function stop() {
    clearTimer();
    setRemaining(null);
  }

  const isRunning = remaining !== null;

  return (
    <section className={styles.restTimer} data-running={isRunning} aria-label="Rest timer">
      {isRunning ? (
        <>
          <span className={styles.restTimerLabel}>Resting</span>
          <span className={styles.restTimerTime} role="timer" aria-live="off">
            {formatClock(remaining)}
          </span>
          <span className={styles.restTimerSpacer}>
            <button
              type="button"
              className={styles.restTimerButton}
              onClick={() => setRemaining((current) => (current ?? 0) + 30)}
            >
              +30s
            </button>
            <button type="button" className={styles.restTimerButton} onClick={stop}>
              Skip
            </button>
          </span>
        </>
      ) : (
        <>
          <span className={styles.restTimerLabel}>Rest timer</span>
          <span className={styles.restTimerPresets}>
            {REST_PRESETS_SECONDS.map((seconds) => (
              <button
                key={seconds}
                type="button"
                className={styles.restTimerButton}
                onClick={() => start(seconds)}
              >
                {seconds % 60 === 0 ? `${seconds / 60}m` : `${seconds}s`}
              </button>
            ))}
          </span>
        </>
      )}
    </section>
  );
}
