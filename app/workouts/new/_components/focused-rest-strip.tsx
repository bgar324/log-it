"use client";

import { Pause, Play, SkipForward } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  formatRestClock,
  type RestTimer,
} from "../_hooks/use-rest-timer";
import { styles } from "../workout-logger.styles";
import focused from "./focused-workout-logger.module.css";

type FocusedRestStripProps = {
  restTimer: RestTimer;
};

/**
 * The running clock and the three things you do to it. Rendered in the footer
 * while a rest is running so the time is readable without opening anything,
 * and again in the tools sheet next to the presets that start it.
 */
export function FocusedRestStrip({ restTimer }: FocusedRestStripProps) {
  if (restTimer.remaining === null) {
    return null;
  }

  return (
    <div className={focused.restStrip}>
      <span className={focused.restClock}>
        {formatRestClock(restTimer.remaining)}
      </span>
      <p className={focused.restLabel}>
        {restTimer.isPaused ? "Rest paused" : "Resting"}
      </p>
      <Button
        type="button"
        variant="icon"
        aria-label={restTimer.isPaused ? "Resume rest" : "Pause rest"}
        onClick={restTimer.togglePause}
      >
        {restTimer.isPaused ? (
          <Play className={styles.icon} strokeWidth={1.9} />
        ) : (
          <Pause className={styles.icon} strokeWidth={1.9} />
        )}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => restTimer.addSeconds(30)}
      >
        +30s
      </Button>
      <Button
        type="button"
        variant="icon"
        aria-label="Skip rest"
        onClick={restTimer.stop}
      >
        <SkipForward className={styles.icon} strokeWidth={1.9} />
      </Button>
    </div>
  );
}
