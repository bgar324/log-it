"use client";

import { styles } from "../workout-logger.styles";
import {
  REST_PRESETS_SECONDS,
  formatRestClock,
  formatRestPreset,
  useRestTimer,
} from "../_hooks/use-rest-timer";

export function WorkoutLoggerRestTimer() {
  const timer = useRestTimer();

  return (
    <section
      className={styles.restTimer}
      data-running={timer.isRunning}
      aria-label="Rest timer"
    >
      {timer.isRunning ? (
        <>
          <span className={styles.restTimerLabel}>
            {timer.isPaused ? "Paused" : "Resting"}
          </span>
          <span className={styles.restTimerTime} role="timer" aria-live="off">
            {formatRestClock(timer.remaining ?? 0)}
          </span>
          <span className={styles.restTimerSpacer}>
            <button
              type="button"
              className={styles.restTimerButton}
              onClick={() => timer.addSeconds(30)}
            >
              +30s
            </button>
            <button
              type="button"
              className={styles.restTimerButton}
              onClick={timer.togglePause}
            >
              {timer.isPaused ? "Resume" : "Pause"}
            </button>
            <button
              type="button"
              className={styles.restTimerButton}
              onClick={timer.stop}
            >
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
                onClick={() => timer.start(seconds)}
              >
                {formatRestPreset(seconds)}
              </button>
            ))}
          </span>
        </>
      )}
    </section>
  );
}
