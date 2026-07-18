"use client";

import { useEffect, useId, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { formatDatabaseDateValue, getCurrentPacificDate } from "@/lib/workout-utils";
import { styles } from "../workout-logger.styles";

type WorkoutLoggerMetaCardProps = {
  title: string;
  performedAt?: string;
  workoutType?: string;
  workoutTypeOptions?: string[];
  canResetFromSplit?: boolean;
  onTitleChange: (value: string) => void;
  onPerformedAtChange?: (value: string) => void;
  onWorkoutTypeChange?: (value: string) => void;
  onResetFromSplit?: () => void;
  resetDisabled?: boolean;
  showEditFields?: boolean;
};

export function WorkoutLoggerMetaCard({
  title,
  performedAt,
  workoutType,
  workoutTypeOptions = [],
  canResetFromSplit = false,
  onTitleChange,
  onPerformedAtChange,
  onWorkoutTypeChange,
  onResetFromSplit,
  resetDisabled = false,
  showEditFields = false,
}: WorkoutLoggerMetaCardProps) {
  const latestAllowedDate = formatDatabaseDateValue(getCurrentPacificDate());
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const dialogTitleId = useId();
  const dialogDescriptionId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isConfirmOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsConfirmOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isConfirmOpen]);

  function handleOpenResetConfirm() {
    if (resetDisabled) {
      return;
    }

    setIsConfirmOpen(true);
  }

  function handleConfirmReset() {
    onResetFromSplit?.();
    setIsConfirmOpen(false);
  }

  return (
    <>
      <section className={`${styles.card} ${!showEditFields ? styles.mobileHiddenCard : ""}`}>
        <div className={showEditFields ? styles.metaGrid : styles.singleMetaField}>
          <div className={`${styles.field} ${styles.workoutTitleField}`}>
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
                  onClick={handleOpenResetConfirm}
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

          {showEditFields ? (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="workout-type">
                Workout type
              </label>
              <select
                id="workout-type"
                className={styles.input}
                value={workoutType ?? ""}
                onChange={(event) => onWorkoutTypeChange?.(event.target.value)}
                required
                disabled={workoutTypeOptions.length === 0}
              >
                {workoutType ? null : (
                  <option value="" disabled>
                    Select workout type
                  </option>
                )}
                {workoutTypeOptions.length > 0 ? (
                  workoutTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No workout types
                  </option>
                )}
              </select>
            </div>
          ) : null}

          {showEditFields ? (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="workout-date">
                Workout date
              </label>
              <input
                id="workout-date"
                className={`${styles.input} ${styles.dateInput}`}
                type="date"
                value={performedAt ?? ""}
                max={latestAllowedDate}
                onChange={(event) => onPerformedAtChange?.(event.target.value)}
                required
              />
            </div>
          ) : null}
        </div>
      </section>

      {isConfirmOpen ? (
        <div
          className={styles.confirmOverlay}
          onClick={() => setIsConfirmOpen(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            aria-describedby={dialogDescriptionId}
            className={styles.confirmDialog}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id={dialogTitleId} className={styles.confirmTitle}>
              Replace the current exercises?
            </h2>
            <p id={dialogDescriptionId} className={styles.confirmBody}>
              This will replace every current exercise and set in this logger with the
              exercises and set counts from your split for today.
            </p>
            <div className={styles.confirmActions}>
              <button
                ref={cancelButtonRef}
                type="button"
                className={styles.confirmSecondaryButton}
                onClick={() => setIsConfirmOpen(false)}
              >
                Keep current log
              </button>
              <button
                type="button"
                className={styles.confirmPrimaryButton}
                onClick={handleConfirmReset}
                disabled={resetDisabled}
              >
                Reset to split
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
