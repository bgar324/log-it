"use client";

import { RotateCcw } from "lucide-react";
import { styles } from "../workout-logger.styles";

type WorkoutLoggerMetaCardProps = {
  title: string;
  canResetFromSplit?: boolean;
  onTitleChange: (value: string) => void;
  onResetFromSplit?: () => void;
  resetDisabled?: boolean;
};

export function WorkoutLoggerMetaCard({
  title,
  canResetFromSplit = false,
  onTitleChange,
  onResetFromSplit,
  resetDisabled = false,
}: WorkoutLoggerMetaCardProps) {
  return (
    <section className={styles.card}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="workout-title">
          Workout title
        </label>
        <div className={styles.fieldInputRow}>
          <input
            id="workout-title"
            className={styles.input}
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="Push day"
          />
          {canResetFromSplit && onResetFromSplit ? (
            <button
              type="button"
              className={styles.fieldActionButton}
              onClick={onResetFromSplit}
              disabled={resetDisabled}
              aria-label="Reset exercises from your split"
              title="Reset exercises from your split"
            >
              <RotateCcw
                className={styles.icon}
                aria-hidden="true"
                strokeWidth={1.9}
              />
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
