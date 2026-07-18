"use client";

import { ListOrdered, Plus } from "lucide-react";
import { useId, useState } from "react";
import {
  getSplitWeekdayLabel,
  type WorkoutSplitDayTemplate,
} from "@/lib/workout-splits/shared";
import { ExerciseTemplateRow } from "./exercise-template-row";
import { SplitActionMenu } from "./split-action-menu";
import { SplitConfirmDialog } from "./split-confirm-dialog";
import { SplitExerciseReorderDialog } from "./split-exercise-reorder-dialog";
import { splitStyles } from "./split-system.styles";

type SplitEditorProps = {
  day: WorkoutSplitDayTemplate;
  exerciseSearchResults: Record<string, string[]>;
  onWorkoutTypeChange: (value: string) => void;
  onExerciseNameChange: (exerciseIndex: number, value: string) => void;
  onExerciseNameFocus: (exerciseIndex: number, value: string) => void;
  onExerciseNameBlur: (exerciseIndex: number, value: string) => void;
  onApplyExerciseSearchResult: (exerciseIndex: number, suggestion: string) => void;
  onExerciseSetsChange: (exerciseIndex: number, value: number) => void;
  onAddExercise: () => void;
  onRemoveExercise: (exerciseIndex: number) => void;
  onReorderExercises: (orderedExerciseOrders: number[]) => void;
};

export function SplitEditor({
  day,
  exerciseSearchResults,
  onWorkoutTypeChange,
  onExerciseNameChange,
  onExerciseNameFocus,
  onExerciseNameBlur,
  onApplyExerciseSearchResult,
  onExerciseSetsChange,
  onAddExercise,
  onRemoveExercise,
  onReorderExercises,
}: SplitEditorProps) {
  const [isReorderOpen, setIsReorderOpen] = useState(false);
  const [pendingRemoveIndex, setPendingRemoveIndex] = useState<number | null>(null);
  const removeTitleId = useId();
  const removeDescriptionId = useId();
  const isRestDay = day.workoutTypeSlug === "rest";
  const pendingExercise =
    pendingRemoveIndex === null ? null : day.exercises[pendingRemoveIndex] ?? null;
  const pendingExerciseName = pendingExercise?.exerciseDisplayName.trim() || "this exercise";

  function handleAddExercise(close: () => void) {
    onAddExercise();
    close();
  }

  function handleOpenReorder(close: () => void) {
    setIsReorderOpen(true);
    close();
  }

  function handleConfirmRemove() {
    if (pendingRemoveIndex !== null) {
      onRemoveExercise(pendingRemoveIndex);
    }

    setPendingRemoveIndex(null);
  }

  return (
    <section className={splitStyles.splitEditor}>
      <div className={splitStyles.editorHeader}>
        <h2 className={splitStyles.editorTitle}>{getSplitWeekdayLabel(day.weekday)}</h2>
      </div>

      <div className={splitStyles.editorInputWithMenu}>
        <label className={`${splitStyles.editorField} min-w-0 flex-1`}>
          <input
            className={splitStyles.editorInput}
            value={day.workoutType}
            onChange={(event) => onWorkoutTypeChange(event.target.value)}
            placeholder="Workout type"
            aria-label="Workout type"
          />
        </label>
        {!isRestDay ? (
          <SplitActionMenu label="Exercise tools">
            {(close) => (
              <>
                <button
                  type="button"
                  role="menuitem"
                  className={splitStyles.actionMenuItem}
                  onClick={() => handleAddExercise(close)}
                >
                  <Plus className={splitStyles.inlineIcon} aria-hidden="true" strokeWidth={1.9} />
                  Add exercise
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={splitStyles.actionMenuItem}
                  onClick={() => handleOpenReorder(close)}
                  disabled={day.exercises.length < 2}
                >
                  <ListOrdered
                    className={splitStyles.inlineIcon}
                    aria-hidden="true"
                    strokeWidth={1.9}
                  />
                  Reorder exercises
                </button>
              </>
            )}
          </SplitActionMenu>
        ) : null}
      </div>

      <div className={splitStyles.editorSectionHead}>
        <h3 className={splitStyles.editorSectionTitle}>Exercises</h3>
      </div>

      {isRestDay ? (
        <div className={splitStyles.restEmptyState}>
          <p>Rest days cannot include exercises.</p>
          <p>Change the workout type if you want to add movements for this day.</p>
        </div>
      ) : day.exercises.length > 0 ? (
        <div className={splitStyles.editorExerciseList}>
          {day.exercises.map((exercise, index) => (
            <ExerciseTemplateRow
              key={exercise.id ?? `${day.weekday}-${exercise.order}`}
              exercise={exercise}
              searchResults={exerciseSearchResults[`${day.weekday}-${index}`] ?? []}
              onNameChange={(value) => onExerciseNameChange(index, value)}
              onNameFocus={(value) => onExerciseNameFocus(index, value)}
              onNameBlur={(value) => onExerciseNameBlur(index, value)}
              onApplySearchResult={(suggestion) =>
                onApplyExerciseSearchResult(index, suggestion)
              }
              onSetsChange={(value) => onExerciseSetsChange(index, value)}
              onRemove={() => setPendingRemoveIndex(index)}
            />
          ))}
        </div>
      ) : (
        <div className={splitStyles.emptyState}>
          <p>No exercises yet for this day.</p>
          <p>Use the menu next to the workout type to add movements.</p>
        </div>
      )}

      {isReorderOpen ? (
        <SplitExerciseReorderDialog
          exercises={day.exercises}
          onCancel={() => setIsReorderOpen(false)}
          onSave={(orderedExerciseOrders) => {
            onReorderExercises(orderedExerciseOrders);
            setIsReorderOpen(false);
          }}
        />
      ) : null}

      {pendingExercise ? (
        <SplitConfirmDialog
          titleId={removeTitleId}
          descriptionId={removeDescriptionId}
          title="Remove exercise?"
          description={`Remove ${pendingExerciseName} from ${getSplitWeekdayLabel(day.weekday)}?`}
          cancelLabel="Keep exercise"
          confirmLabel="Remove"
          onCancel={() => setPendingRemoveIndex(null)}
          onConfirm={handleConfirmRemove}
        />
      ) : null}
    </section>
  );
}
