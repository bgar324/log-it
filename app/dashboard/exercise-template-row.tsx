"use client";

import { Trash2 } from "lucide-react";
import type { WorkoutSplitExerciseTemplate } from "@/lib/workout-splits/shared";
import splitStyles from "./split-system.module.css";

type ExerciseTemplateRowProps = {
  exercise: WorkoutSplitExerciseTemplate;
  suggestion: string | null;
  onNameChange: (value: string) => void;
  onNameBlur: (value: string) => void;
  onAcceptSuggestion: (suggestion: string) => void;
  onSetsChange: (value: number) => void;
  onRemove: () => void;
};

export function ExerciseTemplateRow({
  exercise,
  suggestion,
  onNameChange,
  onNameBlur,
  onAcceptSuggestion,
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
            onBlur={(event) => onNameBlur(event.target.value)}
            autoComplete="off"
            spellCheck={true}
            autoCapitalize="words"
            autoCorrect="on"
            placeholder="Bench Press"
          />
          {suggestion ? (
            <p className={splitStyles.didYouMean}>
              Did you mean?{" "}
              <button
                type="button"
                className={splitStyles.didYouMeanSuggestion}
                onPointerDown={(event) => {
                  event.preventDefault();
                }}
                onClick={() => onAcceptSuggestion(suggestion)}
              >
                {suggestion}
              </button>
            </p>
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
