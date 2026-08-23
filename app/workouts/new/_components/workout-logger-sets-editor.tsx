"use client";

import { Plus, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import type { WeightUnit } from "@/lib/weight-unit";
import { styles } from "../workout-logger.styles";
import {
  formatLoggedSetSnapshot,
  formatPredictedWeightPlaceholder,
  sanitizeDurationInput,
  sanitizeRepsInput,
  sanitizeWeightInput,
  type ExerciseDraft,
  type ExerciseInsightState,
  type ExerciseSetDraft,
} from "../workout-logger.utils";
import { WorkoutLoggerConfirmDialog } from "./workout-logger-confirm-dialog";

type WorkoutLoggerSetsEditorProps = {
  exercise: ExerciseDraft;
  insightState?: ExerciseInsightState;
  weightUnit: WeightUnit;
  weightUnitLabel: string;
  weightUnitName: string;
  bodyWeightDisplay: number | null;
  onAddSet: () => void;
  onRemoveSet: (setId: string) => void;
  onUpdateSet: <K extends keyof ExerciseSetDraft>(
    setId: string,
    field: K,
    value: ExerciseSetDraft[K],
  ) => void;
};

export function WorkoutLoggerSetsEditor({
  exercise,
  insightState,
  weightUnit,
  weightUnitLabel,
  weightUnitName,
  bodyWeightDisplay,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
}: WorkoutLoggerSetsEditorProps) {
  const bodyWeightLabel =
    bodyWeightDisplay === null ? null : `${Number(bodyWeightDisplay.toFixed(1))}`;
  const [pendingRemoval, setPendingRemoval] = useState<{
    id: string;
    index: number;
  } | null>(null);
  const dialogTitleId = useId();
  const dialogDescriptionId = useId();

  function handleConfirmRemoveSet() {
    if (!pendingRemoval) {
      return;
    }

    onRemoveSet(pendingRemoval.id);
    setPendingRemoval(null);
  }

  const insight = insightState?.data;
  const lastSets = insight?.lastSession?.sets ?? [];
  const predictedSets = insight?.prediction?.predictedSets ?? [];
  // Reserve the ghost line while the comparison is in flight, and keep it once
  // there is history to show, so the inputs never move under a thumb.
  const showGhostLine =
    insightState?.status === "loading" || Boolean(insight?.lastSession);

  return (
    <div className={styles.setsStack}>
      {exercise.sets.map((setItem, setIndex) => {
        const isBodyweight = setItem.usesBodyweight;
        const bodyweightPlaceholder = bodyWeightLabel
          ? `BW (${bodyWeightLabel})`
          : "BW";
        const lastSet = lastSets[setIndex];
        const predictedSet = predictedSets[setIndex];
        const weightPlaceholder =
          predictedSet && predictedSet.weightLb !== null
            ? formatPredictedWeightPlaceholder(predictedSet.weightLb, weightUnit)
            : weightUnitLabel;
        const repsPlaceholder =
          predictedSet && predictedSet.reps !== null
            ? `${predictedSet.reps}`
            : "Reps";

        return (
          <div key={setItem.id} className={styles.setRowGroup}>
            <div className={styles.setRow}>
              <p className={styles.setNumber}>#{setIndex + 1}</p>
              <label
                className={`${styles.setField} ${styles.setFieldWeight}`}
                htmlFor={`${exercise.id}-${setItem.id}-weight`}
              >
                <span className={styles.setFieldLabel}>
                  Weight ({weightUnitLabel})
                </span>
                <span className={styles.setWeightControl}>
                  <input
                    id={`${exercise.id}-${setItem.id}-weight`}
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.]?[0-9]*"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    enterKeyHint="next"
                    className={`${styles.setInput} ${styles.setWeightInput}`}
                    placeholder={
                      isBodyweight ? bodyweightPlaceholder : weightPlaceholder
                    }
                    value={setItem.weightLb}
                    disabled={isBodyweight}
                    aria-label={
                      isBodyweight
                        ? bodyWeightLabel
                          ? `Bodyweight ${bodyWeightLabel} ${weightUnitName} selected for set ${setIndex + 1}`
                          : `Bodyweight selected for set ${setIndex + 1}`
                        : `Weight in ${weightUnitName} for set ${setIndex + 1}`
                    }
                    onChange={(event) => {
                      onUpdateSet(setItem.id, "usesBodyweight", false);
                      onUpdateSet(
                        setItem.id,
                        "weightLb",
                        sanitizeWeightInput(event.target.value),
                      );
                    }}
                  />
                  <button
                    type="button"
                    className={styles.bodyweightButton}
                    data-active={isBodyweight}
                    onClick={() => {
                      if (isBodyweight) {
                        onUpdateSet(setItem.id, "usesBodyweight", false);
                        return;
                      }

                      onUpdateSet(setItem.id, "weightLb", "");
                      onUpdateSet(setItem.id, "usesBodyweight", true);
                    }}
                    aria-pressed={isBodyweight}
                    aria-label={
                      isBodyweight
                        ? `Stop using bodyweight for set ${setIndex + 1}`
                        : `Use bodyweight for set ${setIndex + 1}`
                    }
                  >
                    BW
                  </button>
                </span>
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
                  className={styles.setInput}
                  placeholder={repsPlaceholder}
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
              <label className={`${styles.setField} ${styles.setFieldDuration}`}>
                <span className={styles.setFieldLabel}>Time (sec)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  enterKeyHint="done"
                  className={styles.setInput}
                  placeholder="Sec"
                  value={setItem.durationSeconds}
                  aria-label={`Time in seconds for set ${setIndex + 1}`}
                  onChange={(event) =>
                    onUpdateSet(
                      setItem.id,
                      "durationSeconds",
                      sanitizeDurationInput(event.target.value),
                    )
                  }
                />
              </label>
              <button
                type="button"
                className={`${styles.dangerIconButton} ${styles.setRemoveButton}`}
                onClick={() =>
                  setPendingRemoval({ id: setItem.id, index: setIndex })
                }
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

            {showGhostLine ? (
              <p className={styles.setGhostLine} aria-hidden="true">
                {lastSet
                  ? `last: ${formatLoggedSetSnapshot(lastSet, weightUnit)}`
                  : ""}
              </p>
            ) : null}
          </div>
        );
      })}

      {pendingRemoval ? (
        <WorkoutLoggerConfirmDialog
          titleId={dialogTitleId}
          descriptionId={dialogDescriptionId}
          title={`Delete set ${pendingRemoval.index + 1}?`}
          description="This removes the reps, weight, and time entered for this set."
          cancelLabel="Keep set"
          confirmLabel="Delete set"
          onCancel={() => setPendingRemoval(null)}
          onConfirm={handleConfirmRemoveSet}
        />
      ) : null}

      <div className={styles.setActions}>
        <button type="button" className={styles.actionButton} onClick={onAddSet}>
          <Plus
            className={styles.actionButtonIcon}
            aria-hidden="true"
            strokeWidth={1.9}
          />
          Add set
        </button>
      </div>
    </div>
  );
}
