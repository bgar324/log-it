"use client";

import { Trash2 } from "lucide-react";
import { useId, useState } from "react";
import type { WeightUnit } from "@/lib/weight-unit";
import { styles } from "../workout-logger.styles";
import type {
  ExerciseDraft,
  ExerciseInsightState,
  ExerciseSetDraft,
} from "../workout-logger.utils";
import { WorkoutLoggerInsightPanel } from "./workout-logger-insight-panel";
import { WorkoutLoggerSetsEditor } from "./workout-logger-sets-editor";
import { WorkoutLoggerConfirmDialog } from "./workout-logger-confirm-dialog";

type WorkoutLoggerExerciseCardProps = {
  exercise: ExerciseDraft;
  exerciseIndex: number;
  canRemoveExercise: boolean;
  searchResults: string[];
  insightState?: ExerciseInsightState;
  weightUnit: WeightUnit;
  weightUnitLabel: string;
  weightUnitName: string;
  bodyWeightLabel: string | null;
  onAddSet: () => void;
  onApplySearchResult: (suggestion: string) => void;
  onExerciseNameBlur: (value: string) => Promise<void> | void;
  onExerciseNameChange: (value: string) => void;
  onExerciseNameFocus: (value: string) => void;
  onRemoveExercise: () => void;
  onRemoveSet: (setId: string) => void;
  onUpdateSet: <K extends keyof ExerciseSetDraft>(
    setId: string,
    field: K,
    value: ExerciseSetDraft[K],
  ) => void;
};

export function WorkoutLoggerExerciseCard({
  exercise,
  exerciseIndex,
  canRemoveExercise,
  searchResults,
  insightState,
  weightUnit,
  weightUnitLabel,
  weightUnitName,
  bodyWeightLabel,
  onAddSet,
  onApplySearchResult,
  onExerciseNameBlur,
  onExerciseNameChange,
  onExerciseNameFocus,
  onRemoveExercise,
  onRemoveSet,
  onUpdateSet,
}: WorkoutLoggerExerciseCardProps) {
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);
  const dialogTitleId = useId();
  const dialogDescriptionId = useId();

  function handleConfirmRemoveExercise() {
    onRemoveExercise();
    setIsRemoveConfirmOpen(false);
  }

  return (
    <>
      <article className={styles.exerciseCard}>
        <div className={styles.exerciseHead}>
          <div className={styles.exerciseHeading}>
            <div>
              <h2 className={styles.exerciseTitle}>Exercise {exerciseIndex + 1}</h2>
            </div>
          </div>
          <div className={styles.exerciseHeadActions}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => setIsRemoveConfirmOpen(true)}
              disabled={!canRemoveExercise}
              aria-label={`Remove exercise ${exerciseIndex + 1}`}
            >
              <Trash2
                className={styles.icon}
                aria-hidden="true"
                strokeWidth={1.9}
              />
            </button>
          </div>
        </div>

        <div className={styles.field}>
          <div className={styles.inlineRow}>
            <input
              id={`exercise-name-${exercise.id}`}
              className={styles.input}
              value={exercise.name}
              aria-label={`Exercise name for exercise ${exerciseIndex + 1}`}
              onChange={(event) => onExerciseNameChange(event.target.value)}
              onFocus={(event) => onExerciseNameFocus(event.target.value)}
              onBlur={(event) => {
                void onExerciseNameBlur(event.target.value);
              }}
              autoComplete="off"
              spellCheck={true}
              autoCapitalize="words"
              autoCorrect="on"
              placeholder="Barbell bench press"
            />
            {searchResults.length > 0 ? (
              <div
                className={styles.searchResults}
                aria-label={`Exercise matches for exercise ${exerciseIndex + 1}`}
              >
                <p className={styles.searchResultsLabel}>Matches</p>
                <div className={styles.searchResultsList}>
                  {searchResults.map((result) => (
                    <button
                      key={`${exercise.id}-${result}`}
                      type="button"
                      className={styles.searchResultButton}
                      onPointerDown={(event) => {
                        event.preventDefault();
                      }}
                      onClick={() => onApplySearchResult(result)}
                    >
                      {result}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <WorkoutLoggerInsightPanel
          exercise={exercise}
          insightState={insightState}
          weightUnit={weightUnit}
          weightUnitLabel={weightUnitLabel}
        />

        <WorkoutLoggerSetsEditor
          exercise={exercise}
          weightUnitLabel={weightUnitLabel}
          weightUnitName={weightUnitName}
          bodyWeightLabel={bodyWeightLabel}
          onAddSet={onAddSet}
          onRemoveSet={onRemoveSet}
          onUpdateSet={onUpdateSet}
        />
      </article>

      {isRemoveConfirmOpen ? (
        <WorkoutLoggerConfirmDialog
          titleId={dialogTitleId}
          descriptionId={dialogDescriptionId}
          title={`Delete exercise ${exerciseIndex + 1}?`}
          description="This removes the exercise and every set entered under it."
          cancelLabel="Keep exercise"
          confirmLabel="Delete exercise"
          onCancel={() => setIsRemoveConfirmOpen(false)}
          onConfirm={handleConfirmRemoveExercise}
        />
      ) : null}
    </>
  );
}
