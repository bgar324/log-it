"use client";

import { Trash2 } from "lucide-react";
import type { WorkoutSplitExerciseTemplate } from "@/lib/workout-splits/shared";
import { splitStyles } from "@/app/_legacy/dashboard/split-system.styles";
import { ExerciseSuggestions } from "@/app/components/exercise-suggestions";

type ExerciseTemplateRowProps = {
  exercise: WorkoutSplitExerciseTemplate;
  searchResults: string[];
  isEditing: boolean;
  onNameChange: (value: string) => void;
  onNameFocus: (value: string) => void;
  onNameBlur: (value: string) => void;
  onApplySearchResult: (suggestion: string) => void;
  onSetsChange: (value: number) => void;
  onRemove: () => void;
};

export function ExerciseTemplateRow({
  exercise,
  searchResults,
  isEditing,
  onNameChange,
  onNameFocus,
  onNameBlur,
  onApplySearchResult,
  onSetsChange,
  onRemove,
}: ExerciseTemplateRowProps) {
  return (
    <div className={splitStyles.exerciseRow}>
      <div className={splitStyles.exerciseMain}>
        <ExerciseSuggestions
          suggestions={searchResults}
          fieldKey={`${exercise.id ?? exercise.order}`}
          onSelect={onApplySearchResult}
        >
          <label className={splitStyles.editorField}>
            <input
              aria-label="Exercise name"
              className={splitStyles.editorInput}
              value={exercise.exerciseDisplayName}
              onChange={(event) => onNameChange(event.target.value)}
              onFocus={(event) => onNameFocus(event.target.value)}
              onBlur={(event) => onNameBlur(event.target.value)}
              autoComplete="off"
              spellCheck={true}
              autoCapitalize="words"
              autoCorrect="on"
              placeholder="Bench Press"
            />
          </label>
        </ExerciseSuggestions>

        <label className={splitStyles.editorField}>
          <input
            aria-label={`Sets for ${
              exercise.exerciseDisplayName.trim() || "exercise"
            }`}
            className={`${splitStyles.editorInput} ${splitStyles.setsInput}`}
            type="number"
            min={1}
            max={20}
            value={exercise.sets}
            onChange={(event) =>
              onSetsChange(Number.parseInt(event.target.value, 10) || 1)
            }
          />
        </label>
      </div>

      {/* Delete lives behind the list's edit mode, so a stray tap while editing
          a name cannot drop an exercise. In edit mode it removes immediately. */}
      {isEditing ? (
        <button
          type="button"
          aria-label={`Remove ${
            exercise.exerciseDisplayName.trim() || "exercise"
          }`}
          className={splitStyles.dangerIconButton}
          onClick={onRemove}
        >
          <Trash2 className={splitStyles.inlineIcon} strokeWidth={1.9} />
        </button>
      ) : null}
    </div>
  );
}
