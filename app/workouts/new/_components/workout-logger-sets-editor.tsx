"use client";

import { useRef, useState } from "react";
import { useReorderMotion } from "@/app/hooks/use-reorder-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { WorkoutLoggerSwipeableSet } from "./workout-logger-swipeable-set";
import { styles } from "../workout-logger.styles";
import {
  sanitizeDurationInput,
  sanitizeRepsInput,
  sanitizeWeightInput,
  type ExerciseDraft,
  type ExerciseSetDraft,
} from "../workout-logger.utils";
import { WorkoutLoggerConfirmDialog } from "./workout-logger-confirm-dialog";

export type WorkoutLoggerSetsEditorProps = {
  exercise: ExerciseDraft;
  weightUnitLabel: string;
  bodyWeightDisplay: number | null;
  showOptionalSetControls: boolean;
  onRemoveSet: (setId: string) => void;
  onUpdateSet: <K extends keyof ExerciseSetDraft>(
    setId: string,
    field: K,
    value: ExerciseSetDraft[K],
  ) => void;
};

export function WorkoutLoggerSetsEditor({
  exercise,
  weightUnitLabel,
  bodyWeightDisplay,
  showOptionalSetControls,
  onRemoveSet,
  onUpdateSet,
}: WorkoutLoggerSetsEditorProps) {
  const bodyWeightLabel =
    bodyWeightDisplay === null ? null : `${Number(bodyWeightDisplay.toFixed(1))}`;
  const [pendingRemoval, setPendingRemoval] = useState<{
    id: string;
    index: number;
    open: boolean;
  } | null>(null);
  const [revealedSetId, setRevealedSetId] = useState<string | null>(null);
  const [initialSetIds] = useState(() => new Set(exercise.sets.map(set => set.id)));
  const listRef = useRef<HTMLDivElement>(null);
  const captureMotion = useReorderMotion(listRef, exercise.sets.map(set => set.id).join("\0"));

  function handleConfirmRemoveSet() {
    if (!pendingRemoval) {
      return;
    }

    captureMotion();
    onRemoveSet(pendingRemoval.id);
    setPendingRemoval({ ...pendingRemoval, open: false });
  }


  return (
    <div ref={listRef} className={styles.setsStack}>
      <div className={`${showOptionalSetControls ? styles.setRow : styles.setRowWithoutDuration} ${styles.setHeader}`} aria-hidden="true">
        <span className="order-1" />
        <span className={styles.setFieldWeight}>Weight ({weightUnitLabel})</span>
        <span className={styles.setFieldReps}>Reps</span>
        {showOptionalSetControls ? <span className={styles.setFieldDuration}>Sec</span> : null}
      </div>
      {exercise.sets.map((setItem, setIndex) => {
        const isBodyweight = setItem.usesBodyweight;
        const bodyweightPlaceholder = bodyWeightLabel
          ? `BW (${bodyWeightLabel})`
          : "BW";

        return (
          <div key={setItem.id} data-motion-id={setItem.id} className={`${styles.setRowGroup}${initialSetIds.has(setItem.id) ? "" : " motion-insert"}`}>
          <WorkoutLoggerSwipeableSet
            setNumber={setIndex + 1}
            canDelete={exercise.sets.length > 1}
            revealed={revealedSetId === setItem.id}
            onReveal={revealed => setRevealedSetId(current => revealed ? setItem.id : current === setItem.id ? null : current)}
            onDelete={() => setPendingRemoval({ id: setItem.id, index: setIndex, open: true })}
          >
            <div
              className={showOptionalSetControls ? styles.setRow : styles.setRowWithoutDuration}
            >
              <Popover>
                <PopoverTrigger data-set-menu className={styles.setNumber} aria-label={`Set ${setIndex + 1} actions`} disabled={exercise.sets.length === 1}>
                  {setIndex + 1}
                </PopoverTrigger>
                <PopoverContent className={styles.exerciseMenu} align="start" preserveInputFocus>
                  <button type="button" className={styles.exerciseMenuDangerItem}
                    onClick={() => setPendingRemoval({ id: setItem.id, index: setIndex, open: true })}>
                    Delete set {setIndex + 1}
                  </button>
                </PopoverContent>
              </Popover>
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
                    aria-label={`Set ${setIndex + 1} weight in ${weightUnitLabel}`}
                    data-compact={showOptionalSetControls}
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.]?[0-9]*"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    enterKeyHint="next"
                    className={`${styles.setInput} ${
                      showOptionalSetControls
                        ? styles.setWeightInputWithBodyweight
                        : ""
                    }`}
                    placeholder={
                      isBodyweight ? bodyweightPlaceholder : undefined
                    }
                    value={setItem.weightLb}
                    disabled={showOptionalSetControls && isBodyweight}
                    onChange={(event) => {
                      onUpdateSet(setItem.id, "usesBodyweight", false);
                      onUpdateSet(
                        setItem.id,
                        "weightLb",
                        sanitizeWeightInput(event.target.value),
                      );
                    }}
                  />
                  {showOptionalSetControls ? (
                    <button
                      type="button"
                      className={styles.bodyweightButton}
                      aria-label={`Set ${setIndex + 1} bodyweight`}
                      aria-pressed={isBodyweight}
                      data-active={isBodyweight}
                      onClick={() => {
                        if (isBodyweight) {
                          onUpdateSet(setItem.id, "usesBodyweight", false);
                          return;
                        }

                        onUpdateSet(setItem.id, "weightLb", "");
                        onUpdateSet(setItem.id, "usesBodyweight", true);
                      }}
                    >
                      BW
                    </button>
                  ) : null}
                </span>
              </label>
              <label className={`${styles.setField} ${styles.setFieldReps}`}>
                <span className={styles.setFieldLabel}>Reps</span>
                <input
                  id={`${exercise.id}-${setItem.id}-reps`}
                  aria-label={`Set ${setIndex + 1} reps`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  enterKeyHint="done"
                  className={styles.setInput}
                  value={setItem.reps}
                  onChange={(event) =>
                    onUpdateSet(
                      setItem.id,
                      "reps",
                      sanitizeRepsInput(event.target.value),
                    )
                  }
                />
              </label>
              {showOptionalSetControls ? (
                <label className={`${styles.setField} ${styles.setFieldDuration}`}>
                  <span className={styles.setFieldLabel}>Time (sec)</span>
                  <input
                    id={`${exercise.id}-${setItem.id}-duration`}
                    aria-label={`Set ${setIndex + 1} time in seconds`}
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
                    onChange={(event) =>
                      onUpdateSet(
                        setItem.id,
                        "durationSeconds",
                        sanitizeDurationInput(event.target.value),
                      )
                    }
                  />
                </label>
              ) : null}
            </div>
          </WorkoutLoggerSwipeableSet>

          </div>
        );
      })}

      {pendingRemoval ? (
        <WorkoutLoggerConfirmDialog
          open={pendingRemoval.open}
          title={`Delete set ${pendingRemoval.index + 1}?`}
          description="This removes the reps, weight, and time entered for this set."
          cancelLabel="Keep set"
          confirmLabel="Delete set"
          onCancel={() => setPendingRemoval({ ...pendingRemoval, open: false })}
          onConfirm={handleConfirmRemoveSet}
        />
      ) : null}
    </div>
  );
}
