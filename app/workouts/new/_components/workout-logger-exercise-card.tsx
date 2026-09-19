"use client";

import type { PointerEvent } from "react";
import { ExerciseSuggestions } from "@/app/components/exercise-suggestions";
import type { WorkoutLoggerExerciseEntry } from "../workout-logger.types";
import { styles } from "../workout-logger.styles";
import { WorkoutLoggerSetsEditor } from "./workout-logger-sets-editor";
import { WorkoutLoggerRestTimer } from "./workout-logger-rest-timer";
import type { RestTimer } from "../_hooks/use-rest-timer";

const NO_SUGGESTIONS: string[] = [];
function keepCurrentFocus(event: PointerEvent<HTMLElement>) { event.preventDefault(); }

export type WorkoutLoggerExerciseCardProps = WorkoutLoggerExerciseEntry & {
  active: boolean;
  /** Present only for accounts whose logger still carries a rest timer. */
  restTimer?: RestTimer;
};

export function WorkoutLoggerExerciseCard({
  active, exercise, searchResults, weightUnitLabel, bodyWeightDisplay,
  showOptionalSetControls, onAddSet, onApplySearchResult,
  onExerciseNameBlur, onExerciseNameChange, onExerciseNameFocus,
  onRemoveSet, onUpdateSet, restTimer,
}: WorkoutLoggerExerciseCardProps) {
  return (
    <article className={styles.exerciseCard}>
      <div className={styles.exerciseNameRow}>
        <ExerciseSuggestions
          key={active ? "active" : "inactive"}
          suggestions={active ? searchResults : NO_SUGGESTIONS}
          fieldKey={exercise.id}
          onSelect={onApplySearchResult}
        >
          <input
            id={`exercise-name-${exercise.id}`}
            aria-label="Exercise name"
            className={styles.nameInput}
            value={exercise.name}
            onChange={event => onExerciseNameChange(event.target.value)}
            onFocus={event => onExerciseNameFocus(event.target.value)}
            onBlur={event => { void onExerciseNameBlur(event.target.value); }}
            autoComplete="off" spellCheck autoCapitalize="words" autoCorrect="on"
            placeholder="Barbell bench press"
          />
        </ExerciseSuggestions>
      </div>
      <WorkoutLoggerSetsEditor
        exercise={exercise}
        weightUnitLabel={weightUnitLabel}
        bodyWeightDisplay={bodyWeightDisplay}
        showOptionalSetControls={showOptionalSetControls}
        onRemoveSet={onRemoveSet}
        onUpdateSet={onUpdateSet}
      />
      <div className={styles.cardFooter}>
        <button type="button" className={styles.addSetButton} onPointerDown={keepCurrentFocus} onClick={onAddSet}>Add set</button>
        {restTimer ? <WorkoutLoggerRestTimer timer={restTimer} /> : null}
      </div>
    </article>
  );
}
