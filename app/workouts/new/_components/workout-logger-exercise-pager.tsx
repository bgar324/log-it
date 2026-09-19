"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { styles } from "../workout-logger.styles";
import type { ExerciseDraft } from "../workout-logger.utils";

export type WorkoutLoggerExercisePagerProps = {
  exercises: ExerciseDraft[];
  focusedIndex: number;
  canGoBack: boolean;
  canGoForward: boolean;
  onGoBack: () => void;
  onGoForward: () => void;
  onJumpTo: (exerciseId: string) => void;
};

/** Flashcard navigation and a direct jump to any exercise in the workout. */
export function WorkoutLoggerExercisePager({
  exercises,
  focusedIndex,
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward,
  onJumpTo,
}: WorkoutLoggerExercisePagerProps) {
  const [isJumpListOpen, setIsJumpListOpen] = useState(false);
  const focused = exercises[focusedIndex];

  if (!focused) {
    return null;
  }

  const focusedName = focused.name.trim() || `Exercise ${focusedIndex + 1}`;
  const position = `${focusedIndex + 1} of ${exercises.length}`;

  return (
    <div className={styles.pagerRow}>
      <button
        type="button"
        className={styles.pagerButton}
        aria-label="Previous exercise"
        disabled={!canGoBack}
        onClick={onGoBack}
      >
        <ChevronLeft className={styles.pagerIcon} strokeWidth={1.9} />
      </button>

      <Popover open={isJumpListOpen} onOpenChange={setIsJumpListOpen}>
        <PopoverTrigger
          className={styles.pagerJumpTrigger}
          aria-label={`${focusedName}, exercise ${position}. Jump to another exercise`}
        >
          <span className={styles.pagerJumpLabel}>
            {focusedIndex + 1}
            <span className={styles.pagerJumpCount}>
              {` of ${exercises.length}`}
            </span>
          </span>
          <ChevronDown className={styles.pagerCaret} strokeWidth={1.9} />
        </PopoverTrigger>
        <PopoverContent align="center" className={styles.jumpMenu}>
          {exercises.map((exercise, index) => {
            const name = exercise.name.trim() || `Exercise ${index + 1}`;
            const setCount = exercise.sets.length;

            return (
              <button
                key={exercise.id}
                type="button"
                className={styles.jumpRow}
                data-active={index === focusedIndex ? "true" : undefined}
                aria-current={index === focusedIndex ? "true" : undefined}
                onClick={() => {
                  onJumpTo(exercise.id);
                  setIsJumpListOpen(false);
                }}
              >
                <span className={styles.jumpRowIndex}>{index + 1}</span>
                <span className={styles.jumpRowName}>{name}</span>
                <span className={styles.jumpRowMeta}>
                  {setCount === 1 ? "1 set" : `${setCount} sets`}
                </span>
              </button>
            );
          })}
        </PopoverContent>
      </Popover>

      <button
        type="button"
        className={styles.pagerButton}
        aria-label="Next exercise"
        disabled={!canGoForward}
        onClick={onGoForward}
      >
        <ChevronRight className={styles.pagerIcon} strokeWidth={1.9} />
      </button>
    </div>
  );
}
