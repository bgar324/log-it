"use client";

import { GripVertical, Trash2 } from "lucide-react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { WeightUnit } from "@/lib/weight-unit";
import { styles } from "../workout-logger.styles";
import type {
  ExerciseDraft,
  ExerciseInsightState,
  ExerciseSetDraft,
} from "../workout-logger.utils";
import { WorkoutLoggerInsightPanel } from "./workout-logger-insight-panel";
import { WorkoutLoggerSetsEditor } from "./workout-logger-sets-editor";

type WorkoutLoggerExerciseCardProps = {
  exercise: ExerciseDraft;
  exerciseIndex: number;
  isDragging: boolean;
  isDropTarget: boolean;
  canRemoveExercise: boolean;
  searchResults: string[];
  insightState?: ExerciseInsightState;
  weightUnit: WeightUnit;
  weightUnitLabel: string;
  weightUnitName: string;
  onAddSet: () => void;
  onApplySearchResult: (suggestion: string) => void;
  onExerciseNameBlur: (value: string) => Promise<void> | void;
  onExerciseNameChange: (value: string) => void;
  onExerciseNameFocus: (value: string) => void;
  onExercisePointerCancel: (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => void;
  onExercisePointerDown: (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => void;
  onExercisePointerMove: (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => void;
  onExercisePointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onRemoveExercise: () => void;
  onRemoveSet: (setId: string) => void;
  onUpdateSet: (
    setId: string,
    field: keyof ExerciseSetDraft,
    value: string,
  ) => void;
};

export function WorkoutLoggerExerciseCard({
  exercise,
  exerciseIndex,
  isDragging,
  isDropTarget,
  canRemoveExercise,
  searchResults,
  insightState,
  weightUnit,
  weightUnitLabel,
  weightUnitName,
  onAddSet,
  onApplySearchResult,
  onExerciseNameBlur,
  onExerciseNameChange,
  onExerciseNameFocus,
  onExercisePointerCancel,
  onExercisePointerDown,
  onExercisePointerMove,
  onExercisePointerUp,
  onRemoveExercise,
  onRemoveSet,
  onUpdateSet,
}: WorkoutLoggerExerciseCardProps) {
  return (
    <article
      className={`${styles.exerciseCard} ${
        isDragging ? styles.exerciseCardDragging : ""
      } ${isDropTarget && !isDragging ? styles.exerciseCardDropTarget : ""}`}
      data-exercise-card="true"
      data-exercise-index={exerciseIndex}
    >
      <div className={styles.exerciseHead}>
        <div className={styles.exerciseHeading}>
          <button
            type="button"
            className={`${styles.iconButton} ${styles.dragHandle}`}
            onPointerDown={onExercisePointerDown}
            onPointerMove={onExercisePointerMove}
            onPointerUp={onExercisePointerUp}
            onPointerCancel={onExercisePointerCancel}
            aria-label={`Drag to reorder exercise ${exerciseIndex + 1}`}
            title="Drag to reorder"
          >
            <GripVertical
              className={styles.icon}
              aria-hidden="true"
              strokeWidth={1.9}
            />
          </button>
          <div>
            <h2 className={styles.exerciseTitle}>Exercise {exerciseIndex + 1}</h2>
          </div>
        </div>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onRemoveExercise}
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
        onAddSet={onAddSet}
        onRemoveSet={onRemoveSet}
        onUpdateSet={onUpdateSet}
      />
    </article>
  );
}
