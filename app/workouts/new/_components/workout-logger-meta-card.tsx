"use client";

import { formatDatabaseDateValue, getCurrentPacificDate } from "@/lib/workout-utils";
import { styles } from "../workout-logger.styles";

type WorkoutLoggerMetaCardProps = {
  title: string;
  performedAt?: string;
  workoutType?: string;
  workoutTypeOptions?: string[];
  onTitleChange: (value: string) => void;
  onPerformedAtChange?: (value: string) => void;
  onWorkoutTypeChange?: (value: string) => void;
  showEditFields?: boolean;
};

export function WorkoutLoggerMetaCard({
  title,
  performedAt,
  workoutType,
  workoutTypeOptions = [],
  onTitleChange,
  onPerformedAtChange,
  onWorkoutTypeChange,
  showEditFields = false,
}: WorkoutLoggerMetaCardProps) {
  const latestAllowedDate = formatDatabaseDateValue(getCurrentPacificDate());
  return (
    <>
      <section className={`${styles.card} ${!showEditFields ? styles.mobileHiddenCard : ""}`}>
        <div className={showEditFields ? styles.metaGrid : styles.singleMetaField}>
          <div className={`${styles.field} ${styles.workoutTitleField}`}>
            <label className={styles.label} htmlFor="workout-title">
              Workout title
            </label>
            {/* Reset from split lives in the tools dial now — one action, one
                place. This icon beside the field was the second copy. */}
            <input
              id="workout-title"
              className={styles.input}
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Push day"
            />
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
    </>
  );
}
