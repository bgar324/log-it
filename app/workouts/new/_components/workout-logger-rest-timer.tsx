"use client";

import { useState } from "react";
import { Pause, Play, Plus, SkipForward, Timer } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import {
  REST_PRESETS_SECONDS,
  formatRestClock,
  formatRestPreset,
  type RestTimer,
} from "../_hooks/use-rest-timer";
import { styles } from "../workout-logger.styles";

/**
 * Rest is a capability the tools dial used to carry. The floating action row
 * is full at five controls, so the timer lives beside Add set instead — the
 * control the thumb is already on when a set is finished.
 *
 * The clock itself belongs to the logger, not to this control: every exercise
 * card renders one, and a rest started on one exercise has to keep running
 * after the pager moves to the next.
 */
export function WorkoutLoggerRestTimer({ timer }: { timer: RestTimer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      {/* One stable accessible name: the visible text already reports state,
          and a label that renames itself mid-rest is a different control to
          anything reading the tree. */}
      <PopoverTrigger className={styles.restTimerButton} aria-label="Rest timer">
        <Timer className={styles.icon} strokeWidth={1.9} />
        <span className={timer.isRunning ? styles.restTimerClock : undefined}>
          {timer.remaining === null ? "Rest" : formatRestClock(timer.remaining)}
        </span>
      </PopoverTrigger>
      <PopoverContent align="end" className={styles.exerciseMenu}>
        {/* Picking a duration or ending the rest finishes the interaction;
            adjusting a running rest does not, so those keep the menu open. */}
        {timer.isRunning ? (
          <>
            <button type="button" className={styles.jumpRow} onClick={timer.togglePause}>
              {timer.isPaused
                ? <Play className={styles.icon} strokeWidth={1.9} />
                : <Pause className={styles.icon} strokeWidth={1.9} />}
              <span className={styles.jumpRowName}>{timer.isPaused ? "Resume rest" : "Pause rest"}</span>
            </button>
            <button type="button" className={styles.jumpRow} onClick={() => timer.addSeconds(30)}>
              <Plus className={styles.icon} strokeWidth={1.9} />
              <span className={styles.jumpRowName}>Add 30 seconds</span>
            </button>
            <button
              type="button"
              className={styles.jumpRow}
              onClick={() => { timer.stop(); setIsOpen(false); }}
            >
              <SkipForward className={styles.icon} strokeWidth={1.9} />
              <span className={styles.jumpRowName}>Skip rest</span>
            </button>
          </>
        ) : (
          REST_PRESETS_SECONDS.map(seconds => (
            <button
              key={seconds}
              type="button"
              className={styles.jumpRow}
              onClick={() => { timer.start(seconds); setIsOpen(false); }}
            >
              <Timer className={styles.icon} strokeWidth={1.9} />
              <span className={styles.jumpRowName}>{`Rest ${formatRestPreset(seconds)}`}</span>
            </button>
          ))
        )}
      </PopoverContent>
    </Popover>
  );
}
