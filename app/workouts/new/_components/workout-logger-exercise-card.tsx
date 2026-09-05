"use client";

import { Ellipsis, Plus, Trash2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { useState, type PointerEvent } from "react";
import type { WeightUnit } from "@/lib/weight-unit";
import { styles } from "../workout-logger.styles";
import {
  formatCompareDayLabel,
  type ExerciseDraft,
  type ExerciseInsightState,
  type ExerciseSetDraft,
} from "../workout-logger.utils";
import { WorkoutLoggerSetsEditor } from "./workout-logger-sets-editor";
import { WorkoutLoggerConfirmDialog } from "./workout-logger-confirm-dialog";

function keepCurrentFocus(event: PointerEvent<HTMLElement>) {
  event.preventDefault();
}

type WorkoutLoggerExerciseCardProps = {
  exercise: ExerciseDraft;
  exerciseIndex: number;
  canRemoveExercise: boolean;
  searchResults: string[];
  insightState?: ExerciseInsightState;
  weightUnit: WeightUnit;
  weightUnitLabel: string;
  bodyWeightDisplay: number | null;
  showOptionalSetControls: boolean;
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
}: WorkoutLoggerExerciseCardProps) {
  const [isExerciseMenuOpen, setIsExerciseMenuOpen] = useState(false);
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);

  function handleConfirmRemoveExercise() {
    onRemoveExercise();
    setIsRemoveConfirmOpen(false);
  }

  const fallbackTitle = `Exercise ${exerciseIndex + 1}`;
  const exerciseTitle = exercise.name.trim() || fallbackTitle;
  const insight = insightState?.data;
  const lastHitLabel = insight?.lastSession
    ? formatCompareDayLabel(insight.lastSession.performedAt)
    : "";
  // One sentence, and it only changes when the comparison itself does. A refetch
  // keeps the previous data, so this never flickers mid-workout. No all-time
  // best: the ghost text on each set row already shows what you actually did.
  const compareLine = !insight
    ? ""
    : lastHitLabel
      ? `Last hit ${lastHitLabel}`
      : "First time logging this.";

  return (
    <>
      <article className={styles.exerciseCard}>
        {/* No title above the field: the input already shows the name, so a
            heading repeated it. The comparison sits under the input instead,
            next to the sets it describes. */}
        <div className={styles.field}>
          <div className={styles.exerciseNameRow}>
            <div className={styles.inlineRow}>
              <input
                id={`exercise-name-${exercise.id}`}
                className={styles.input}
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

            {/* On the name's row, not below it: the menu acts on the exercise
                this field names, so it belongs beside it. The comparison keeps
                the line underneath to itself. */}
            <Popover
              open={isExerciseMenuOpen}
              onOpenChange={setIsExerciseMenuOpen}
            >
              <PopoverTrigger
                aria-label={`${exerciseTitle} options`}
                className={styles.exerciseMenuToggle}
                onPointerDown={keepCurrentFocus}
              >
                <Ellipsis className={styles.icon} strokeWidth={1.9} />
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className={styles.exerciseMenu}
                onOpenAutoFocus={(event) => event.preventDefault()}
                onCloseAutoFocus={(event) => event.preventDefault()}
              >
                <button
                  type="button"
                  className={styles.exerciseMenuItem}
                  onPointerDown={keepCurrentFocus}
                  onClick={() => {
                    onAddSet();
                    setIsExerciseMenuOpen(false);
                  }}
                >
                  <Plus className={styles.icon} strokeWidth={1.9} />
                  Add set
                </button>
                <div className={styles.exerciseMenuDivider} />
                <button
                  type="button"
                  className={styles.exerciseMenuDangerItem}
                  onPointerDown={keepCurrentFocus}
                  onClick={() => {
                    setIsExerciseMenuOpen(false);
                    setIsRemoveConfirmOpen(true);
                  }}
                  disabled={!canRemoveExercise}
                >
                  <Trash2 className={styles.icon} strokeWidth={1.9} />
                  Delete exercise
                </button>
              </PopoverContent>
            </Popover>
          </div>

          <p className={styles.exerciseCompareLine}>{compareLine}</p>
        </div>

        <WorkoutLoggerSetsEditor
          exercise={exercise}
          insightState={insightState}
          weightUnit={weightUnit}
          weightUnitLabel={weightUnitLabel}
          bodyWeightDisplay={bodyWeightDisplay}
          showOptionalSetControls={showOptionalSetControls}
          onRemoveSet={onRemoveSet}
          onUpdateSet={onUpdateSet}
        />
      </article>

      {isRemoveConfirmOpen ? (
        <WorkoutLoggerConfirmDialog
          title={`Delete ${exerciseTitle}?`}
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
