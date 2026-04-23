"use client";

import { Plus } from "lucide-react";
import {
  getSplitWeekdayLabel,
  type WorkoutSplitDayTemplate,
} from "@/lib/workout-splits/shared";
import { ExerciseTemplateRow } from "./exercise-template-row";
import { splitStyles } from "./split-system.styles";

type SplitEditorProps = {
  day: WorkoutSplitDayTemplate;
  exerciseSearchResults: Record<string, string[]>;
  draggingExerciseIndex: number | null;
  exerciseDropTargetIndex: number | null;
  onWorkoutTypeChange: (value: string) => void;
  onExerciseNameChange: (exerciseIndex: number, value: string) => void;
  onExerciseNameFocus: (exerciseIndex: number, value: string) => void;
  onExerciseNameBlur: (exerciseIndex: number, value: string) => void;
  onApplyExerciseSearchResult: (exerciseIndex: number, suggestion: string) => void;
  onExerciseSetsChange: (exerciseIndex: number, value: number) => void;
  onAddExercise: () => void;
  onRemoveExercise: (exerciseIndex: number) => void;
  onExerciseDragStart: (exerciseIndex: number) => void;
  onExerciseDragOver: (exerciseIndex: number) => void;
  onExerciseDrop: (exerciseIndex: number) => void;
  onExerciseDragEnd: () => void;
};

export function SplitEditor({
  day,
  exerciseSearchResults,
  draggingExerciseIndex,
  exerciseDropTargetIndex,
  onWorkoutTypeChange,
  onExerciseNameChange,
  onExerciseNameFocus,
  onExerciseNameBlur,
  onApplyExerciseSearchResult,
  onExerciseSetsChange,
  onAddExercise,
  onRemoveExercise,
  onExerciseDragStart,
  onExerciseDragOver,
  onExerciseDrop,
  onExerciseDragEnd,
}: SplitEditorProps) {
  const isRestDay = day.workoutTypeSlug === "rest";

  return (
    <section className={splitStyles.splitEditor}>
      <div className={splitStyles.editorHeader}>
        <div>
          <h2 className={splitStyles.editorTitle}>{getSplitWeekdayLabel(day.weekday)}</h2>
        </div>
      </div>

      <label className={splitStyles.editorField}>
        <span className={splitStyles.editorLabel}>Workout type</span>
        <input
          className={splitStyles.editorInput}
          value={day.workoutType}
          onChange={(event) => onWorkoutTypeChange(event.target.value)}
          placeholder="Push"
        />
      </label>

      <div className={splitStyles.editorSectionHead}>
        <div>
          <h3 className={splitStyles.editorSectionTitle}>Exercises</h3>
        </div>
        {!isRestDay ? (
          <button
            type="button"
            className={splitStyles.inlineButton}
            onClick={onAddExercise}
          >
            <Plus className={splitStyles.inlineIcon} aria-hidden="true" strokeWidth={1.9} />
            Add exercise
          </button>
        ) : null}
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
              isDragging={draggingExerciseIndex === index}
              isDropTarget={
                exerciseDropTargetIndex === index && draggingExerciseIndex !== index
              }
              onNameChange={(value) => onExerciseNameChange(index, value)}
              onNameFocus={(value) => onExerciseNameFocus(index, value)}
              onNameBlur={(value) => onExerciseNameBlur(index, value)}
              onApplySearchResult={(suggestion) =>
                onApplyExerciseSearchResult(index, suggestion)
              }
              onSetsChange={(value) => onExerciseSetsChange(index, value)}
              onRemove={() => onRemoveExercise(index)}
              onDragStart={() => onExerciseDragStart(index)}
              onDragOver={() => onExerciseDragOver(index)}
              onDrop={() => onExerciseDrop(index)}
              onDragEnd={onExerciseDragEnd}
            />
          ))}
        </div>
      ) : (
        <div className={splitStyles.emptyState}>
          <p>No exercises yet for this day.</p>
          <p>Add movements here to auto-populate the logger.</p>
        </div>
      )}
    </section>
  );
}
