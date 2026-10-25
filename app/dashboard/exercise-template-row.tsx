"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { WorkoutSplitExerciseTemplate } from "@/lib/workout-splits/shared";
import { splitStyles } from "./split-system.styles";
import { ExerciseSuggestions } from "@/app/components/exercise-suggestions";

const NO_SUGGESTIONS: string[] = [];
const SET_COUNT_AUTOSAVE_MS = 400;

type ExerciseTemplateRowProps = {
  exercise: WorkoutSplitExerciseTemplate;
  searchResults: string[];
  /** True while a save is in flight: the row shows but nothing edits. */
  isDisabled: boolean;
  animateEntry?: boolean;
  onNameChange: (value: string) => void;
  onNameFocus: (value: string) => void;
  onNameBlur: (value: string) => void;
  onApplySearchResult: (suggestion: string) => void;
  onSetsChange: (value: number) => void;
  onSetsCommit?: () => void;
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
  isDisabled,
  animateEntry = false,
  onNameChange,
  onNameFocus,
  onNameBlur,
  onApplySearchResult,
  onSetsChange,
  onSetsCommit,
  onRemove,
}: ExerciseTemplateRowProps) {
  const name = exercise.exerciseDisplayName.trim() || "exercise";
  const [setsEmpty, setSetsEmpty] = useState(false);
  const commitTimer = useRef<number | undefined>(undefined);
  const pendingCommit = useRef<(() => void) | null>(null);
  useEffect(() => () => {
    window.clearTimeout(commitTimer.current);
    // Moving to another day/folder must not strand a completed count edit.
    pendingCommit.current?.();
  }, []);

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
            window.clearTimeout(commitTimer.current);
            commitTimer.current = undefined;
            pendingCommit.current = null;
            setSetsEmpty(value === "");
            if (value !== "") {
              onSetsChange(Number.parseInt(value, 10));
              if (onSetsCommit) {
                pendingCommit.current = onSetsCommit;
                commitTimer.current = window.setTimeout(() => {
                  const commit = pendingCommit.current;
                  pendingCommit.current = null;
                  commitTimer.current = undefined;
                  commit?.();
                }, SET_COUNT_AUTOSAVE_MS);
              }
            }
          }}
          onBlur={() => {
            window.clearTimeout(commitTimer.current);
            commitTimer.current = undefined;
            pendingCommit.current = null;
            setSetsEmpty(false);
            onSetsCommit?.();
          }}
          disabled={isDisabled}
        />
        <span className={splitStyles.exerciseSetsLabel}>sets</span>
      </label>

      <button
        type="button"
        aria-label={`Remove ${name}`}
        className={splitStyles.exerciseRemoveButton}
        onPointerDown={event => event.preventDefault()}
        onClick={onRemove}
        disabled={isDisabled}
      >
        <Trash2 className={splitStyles.inlineIcon} strokeWidth={1.9} />
      </button>
    </div>
  );
}
