"use client";

import { Plus } from "lucide-react";
import {
  getSplitWeekdayLabel,
  type WorkoutSplitDayTemplate,
} from "@/lib/workout-splits/shared";
import { ExerciseTemplateRow } from "./exercise-template-row";
import splitStyles from "./split-system.module.css";

type SplitEditorProps = {
  day: WorkoutSplitDayTemplate;
  exerciseSuggestions: Record<string, string | null>;
  onWorkoutTypeChange: (value: string) => void;
  onExerciseNameChange: (exerciseIndex: number, value: string) => void;
  onExerciseNameBlur: (exerciseIndex: number, value: string) => void;
  onAcceptExerciseSuggestion: (exerciseIndex: number, suggestion: string) => void;
  onExerciseSetsChange: (exerciseIndex: number, value: number) => void;
  onAddExercise: () => void;
  onRemoveExercise: (exerciseIndex: number) => void;
};

export function SplitEditor({
  day,
  exerciseSuggestions,
  onWorkoutTypeChange,
  onExerciseNameChange,
  onExerciseNameBlur,
  onAcceptExerciseSuggestion,
  onExerciseSetsChange,
  onAddExercise,
  onRemoveExercise,
}: SplitEditorProps) {
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
        <button
          type="button"
          className={splitStyles.inlineButton}
          onClick={onAddExercise}
        >
          <Plus className={splitStyles.inlineIcon} aria-hidden="true" strokeWidth={1.9} />
          Add exercise
        </button>
      </div>

      {day.exercises.length > 0 ? (
        <div className={splitStyles.editorExerciseList}>
          {day.exercises.map((exercise, index) => (
            <ExerciseTemplateRow
              key={exercise.id ?? `${day.weekday}-${exercise.order}`}
              exercise={exercise}
              suggestion={exerciseSuggestions[`${day.weekday}-${index}`] ?? null}
              onNameChange={(value) => onExerciseNameChange(index, value)}
              onNameBlur={(value) => onExerciseNameBlur(index, value)}
              onAcceptSuggestion={(suggestion) =>
                onAcceptExerciseSuggestion(index, suggestion)
              }
              onSetsChange={(value) => onExerciseSetsChange(index, value)}
              onRemove={() => onRemoveExercise(index)}
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
