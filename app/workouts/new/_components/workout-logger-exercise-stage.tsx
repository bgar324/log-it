"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { FocusDirection } from "../_hooks/use-focused-exercise";
import { styles } from "../workout-logger.styles";

export type WorkoutLoggerExerciseStageProps = {
  direction: FocusDirection;
  children: ReactNode;
};

/**
 * The working area for the exercise in focus. Mounted fresh per exercise — the
 * caller keys it by exercise id — so it animates in from the side the session
 * just moved, once and briefly. Nothing of the neighbouring exercises is ever
 * rendered: position is stated by the pager instead of hinted at by a sliver of
 * the next card.
 *
 * Every value lives in the draft controller above, so a switch — pressed,
 * jumped or swiped — remounts this without losing a single entry.
 */
export function WorkoutLoggerExerciseStage({
  direction,
  children,
}: WorkoutLoggerExerciseStageProps) {
  // Mount in the offset state, settle on the next frame: without that frame the
  // browser has no start value to transition from and the movement is skipped.
  const [hasSettled, setHasSettled] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setHasSettled(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={styles.exerciseStage}
      data-enter={hasSettled ? "settled" : direction}
    >
      {children}
    </div>
  );
}
