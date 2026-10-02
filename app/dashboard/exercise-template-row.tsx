"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import type { WorkoutSplitExerciseTemplate } from "@/lib/workout-splits/shared";
import { splitStyles } from "./split-system.styles";
import { ExerciseSuggestions } from "@/app/components/exercise-suggestions";

const NO_SUGGESTIONS: string[] = [];

type ExerciseTemplateRowProps = {
  exercise: WorkoutSplitExerciseTemplate;
  searchResults: string[];
  /** True while the list is in remove mode, which is what reveals the bin. */
  isRemoveMode: boolean;
  /** True while a save is in flight: the row shows but nothing edits. */
  isDisabled: boolean;
  animateEntry?: boolean;
  onNameChange: (value: string) => void;
  onNameFocus: (value: string) => void;
  onNameBlur: (value: string) => void;
  onApplySearchResult: (suggestion: string) => void;
  onSetsChange: (value: number) => void;
  onRemove: () => void;
};

/**
 * One planned exercise: its name, and how many sets of it. A hairline row, not
 * a boxed spreadsheet cell — the name carries the row and sets sit in a small
 * labelled well beside it.
 */
export function ExerciseTemplateRow({
  exercise,
  searchResults,
  isRemoveMode,
  isDisabled,
  animateEntry = false,
  onNameChange,
  onNameFocus,
  onNameBlur,
  onApplySearchResult,
  onSetsChange,
  onRemove,
}: ExerciseTemplateRowProps) {
  const name = exercise.exerciseDisplayName.trim() || "exercise";
  const [setsEmpty, setSetsEmpty] = useState(false);

  return (
    <div data-motion-id={exercise.id} className={`${splitStyles.exerciseRow}${animateEntry ? " motion-insert" : ""}`}>
      <ExerciseSuggestions
        suggestions={isDisabled ? NO_SUGGESTIONS : searchResults}
        fieldKey={`${exercise.id ?? exercise.order}`}
        onSelect={suggestion => { if (!isDisabled) onApplySearchResult(suggestion); }}
      >
        <label className={splitStyles.exerciseNameField}>
          <input
            aria-label="Exercise name"
            className={splitStyles.exerciseNameInput}
            value={exercise.exerciseDisplayName}
            onChange={(event) => onNameChange(event.target.value)}
            onFocus={(event) => onNameFocus(event.target.value)}
            onBlur={(event) => onNameBlur(event.target.value)}
            disabled={isDisabled}
            autoComplete="off"
            spellCheck={true}
            autoCapitalize="words"
            autoCorrect="on"
            placeholder="Bench Press"
          />
        </label>
      </ExerciseSuggestions>

      <label className={splitStyles.exerciseSetsField}>
        <input
          aria-label={`Sets for ${name}`}
          className={splitStyles.exerciseSetsInput}
          type="number"
          inputMode="numeric"
          min={1}
          max={20}
          value={setsEmpty ? "" : exercise.sets}
          onChange={(event) => {
            const value = event.target.value;
            setSetsEmpty(value === "");
            if (value !== "") onSetsChange(Number.parseInt(value, 10));
          }}
          onBlur={() => setSetsEmpty(false)}
          disabled={isDisabled}
        />
        <span className={splitStyles.exerciseSetsLabel}>sets</span>
      </label>

      {/* Delete lives behind the list's remove mode, so a stray tap while
          editing a name cannot drop an exercise. */}
      {isRemoveMode ? (
        <button
          type="button"
          aria-label={`Remove ${name}`}
          className={`${splitStyles.exerciseRemoveButton} motion-insert`}
          onClick={onRemove}
          disabled={isDisabled}
        >
          <Trash2 className={splitStyles.inlineIcon} strokeWidth={1.9} />
        </button>
      ) : null}
    </div>
  );
}
