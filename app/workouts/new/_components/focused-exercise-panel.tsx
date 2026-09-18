"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState, type PointerEvent } from "react";
import { Button } from "@/app/components/ui/button";
import { ConfirmDialog } from "@/app/components/ui/confirm-dialog";
import { Input } from "@/app/components/ui/input";
import { styles } from "../workout-logger.styles";
import { formatCompareDayLabel } from "../workout-logger.utils";
import type { WorkoutLoggerExerciseCardProps } from "./workout-logger-exercise-card";
import { WorkoutLoggerSetsEditor } from "./workout-logger-sets-editor";
import focused from "./focused-workout-logger.module.css";

function keepCurrentFocus(event: PointerEvent<HTMLElement>) {
  event.preventDefault();
}

type FocusedExercisePanelProps = {
  exerciseProps: WorkoutLoggerExerciseCardProps;
};

/**
 * The open exercise: its name, what it did last time, every set row, and the
 * two actions that belong to it. Set rows come from the existing sets editor —
 * the row layout, bodyweight toggle, time field, predicted placeholders, per
 * set history and the delete confirmation are all already correct there, so
 * this panel only owns the header and the actions around them.
 */
export function FocusedExercisePanel({
  exerciseProps,
}: FocusedExercisePanelProps) {
  const {
    exercise,
    exerciseIndex,
    canRemoveExercise,
    searchResults,
    insightState,
    weightUnit,
    weightUnitLabel,
    bodyWeightDisplay,
    showOptionalSetControls,
    onAddSet,
    onApplySearchResult,
    onExerciseNameBlur,
    onExerciseNameChange,
    onExerciseNameFocus,
    onRemoveExercise,
    onRemoveSet,
    onUpdateSet,
  } = exerciseProps;
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);

  const exerciseTitle = exercise.name.trim() || `Exercise ${exerciseIndex + 1}`;
  const insight = insightState?.data;
  const lastHitLabel = insight?.lastSession
    ? formatCompareDayLabel(insight.lastSession.performedAt)
    : "";
  const compareLine = !insight
    ? ""
    : lastHitLabel
      ? `Last hit ${lastHitLabel}`
      : "First time logging this.";

  return (
    <section className={focused.panel} aria-label={exerciseTitle}>
      <Input
        id={`exercise-name-${exercise.id}`}
        value={exercise.name}
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
        aria-label={`Exercise ${exerciseIndex + 1} name`}
      />
      {searchResults.length > 0 ? (
        <div className={styles.searchResults}>
          <p className={styles.searchResultsLabel}>Matches</p>
          <div className={styles.searchResultsList}>
            {searchResults.map((result) => (
              <button
                key={`${exercise.id}-${result}`}
                type="button"
                className={styles.searchResultButton}
                onPointerDown={keepCurrentFocus}
                onClick={() => onApplySearchResult(result)}
              >
                {result}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <p className={styles.exerciseCompareLine}>{compareLine}</p>

      <WorkoutLoggerSetsEditor
        variant="focused"
        exercise={exercise}
        insightState={insightState}
        weightUnit={weightUnit}
        weightUnitLabel={weightUnitLabel}
        bodyWeightDisplay={bodyWeightDisplay}
        showOptionalSetControls={showOptionalSetControls}
        onRemoveSet={onRemoveSet}
        onUpdateSet={onUpdateSet}
      />

      <div className={focused.panelActions}>
        {/* Beside the rows it adds to, not in a menu: it is the action you
            reach for between sets. */}
        <Button
          type="button"
          variant="outline"
          aria-label="Add set"
          onPointerDown={keepCurrentFocus}
          onClick={onAddSet}
        >
          <Plus className={styles.icon} strokeWidth={1.9} />
          Add set
        </Button>
        <Button
          type="button"
          variant="quiet"
          disabled={!canRemoveExercise}
          onClick={() => setIsRemoveConfirmOpen(true)}
        >
          <Trash2 className={styles.icon} strokeWidth={1.9} />
          Delete exercise
        </Button>
      </div>

      <ConfirmDialog
        open={isRemoveConfirmOpen}
        onOpenChange={setIsRemoveConfirmOpen}
        title={`Delete ${exerciseTitle}?`}
        description="This removes the exercise and every set entered under it."
        cancelLabel="Keep exercise"
        confirmLabel="Delete exercise"
        destructive
        onConfirm={() => {
          onRemoveExercise();
          setIsRemoveConfirmOpen(false);
        }}
      />
    </section>
  );
}
