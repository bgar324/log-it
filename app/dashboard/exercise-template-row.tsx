"use client";

import { Trash2 } from "lucide-react";
import type { WorkoutSplitExerciseTemplate } from "@/lib/workout-splits/shared";
import splitStyles from "./split-system.module.css";

type ExerciseTemplateRowProps = {
  exercise: WorkoutSplitExerciseTemplate;
  searchResults: string[];
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
        <label className={splitStyles.editorField}>
          <span className={splitStyles.editorLabel}>Exercise</span>
          <input
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
          {searchResults.length > 0 ? (
            <div className={splitStyles.searchResults}>
              <p className={splitStyles.searchResultsLabel}>Matches</p>
              <div className={splitStyles.searchResultsList}>
                {searchResults.map((result) => (
                  <button
                    key={`${exercise.id ?? exercise.order}-${result}`}
                    type="button"
                    className={splitStyles.searchResultButton}
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
        </label>

        <label className={splitStyles.editorField}>
          <span className={splitStyles.editorLabel}>Sets</span>
          <input
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

      <button
        type="button"
        className={splitStyles.iconGhostButton}
        onClick={onRemove}
        aria-label={`Remove ${exercise.exerciseDisplayName || "exercise"}`}
      >
        <Trash2 className={splitStyles.inlineIcon} aria-hidden="true" strokeWidth={1.9} />
      </button>
    </div>
  );
}
