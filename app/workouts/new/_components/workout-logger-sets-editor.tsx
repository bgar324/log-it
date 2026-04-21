"use client";

import { Plus, Trash2 } from "lucide-react";
import { styles } from "../workout-logger.styles";
import {
  sanitizeRepsInput,
  sanitizeWeightInput,
  type ExerciseDraft,
  type ExerciseSetDraft,
} from "../workout-logger.utils";

type WorkoutLoggerSetsEditorProps = {
  exercise: ExerciseDraft;
  weightUnitLabel: string;
  weightUnitName: string;
  onAddSet: () => void;
  onRemoveSet: (setId: string) => void;
  onUpdateSet: (
    setId: string,
    field: keyof ExerciseSetDraft,
    value: string,
  ) => void;
};

export function WorkoutLoggerSetsEditor({
  exercise,
  weightUnitLabel,
  weightUnitName,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
}: WorkoutLoggerSetsEditorProps) {
  return (
    <div className={styles.setsStack}>
      <div
        className={`${styles.setRow} ${styles.setRowHeader}`}
        aria-hidden="true"
      >
        <span className={styles.setHeadLabel}>Set</span>
        <span className={styles.setHeadLabel}>Weight ({weightUnitLabel})</span>
        <span className={styles.setHeadLabel}>Reps</span>
        <span className={styles.setHeadLabel}>Action</span>
      </div>

      {exercise.sets.map((setItem, setIndex) => (
        <div key={setItem.id} className={styles.setRow}>
          <p className={styles.setNumber}>#{setIndex + 1}</p>
          <label className={`${styles.setField} ${styles.setFieldWeight}`}>
            <span className={styles.setFieldLabel}>
              Weight ({weightUnitLabel})
            </span>
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.]?[0-9]*"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="next"
              className={styles.input}
              placeholder={weightUnitLabel}
              value={setItem.weightLb}
              aria-label={`Weight in ${weightUnitName} for set ${setIndex + 1}`}
              onChange={(event) =>
                onUpdateSet(
                  setItem.id,
                  "weightLb",
                  sanitizeWeightInput(event.target.value),
                )
              }
            />
          </label>
          <label className={`${styles.setField} ${styles.setFieldReps}`}>
            <span className={styles.setFieldLabel}>Reps</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="done"
              className={styles.input}
              placeholder="Reps"
              value={setItem.reps}
              aria-label={`Repetitions for set ${setIndex + 1}`}
              onChange={(event) =>
                onUpdateSet(
                  setItem.id,
                  "reps",
                  sanitizeRepsInput(event.target.value),
                )
              }
            />
          </label>
          <button
            type="button"
            className={`${styles.iconButton} ${styles.setRemoveButton}`}
            onClick={() => onRemoveSet(setItem.id)}
            disabled={exercise.sets.length === 1}
            aria-label={`Remove set ${setIndex + 1}`}
          >
            <Trash2
              className={styles.icon}
              aria-hidden="true"
              strokeWidth={1.9}
            />
          </button>
        </div>
      ))}

      <div className={styles.setActions}>
        <button type="button" className={styles.actionButton} onClick={onAddSet}>
          <Plus
            className={styles.actionIcon}
            aria-hidden="true"
            strokeWidth={1.9}
          />
          Add set
        </button>
      </div>
    </div>
  );
}
