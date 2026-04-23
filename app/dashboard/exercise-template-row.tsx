"use client";

import { GripVertical, Trash2 } from "lucide-react";
import type { WorkoutSplitExerciseTemplate } from "@/lib/workout-splits/shared";
import { splitStyles } from "./split-system.styles";

type ExerciseTemplateRowProps = {
  exercise: WorkoutSplitExerciseTemplate;
  searchResults: string[];
  isDragging: boolean;
  isDropTarget: boolean;
  onNameChange: (value: string) => void;
  onNameFocus: (value: string) => void;
  onNameBlur: (value: string) => void;
  onApplySearchResult: (suggestion: string) => void;
  onSetsChange: (value: number) => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDragOver: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
};

export function ExerciseTemplateRow({
  exercise,
  searchResults,
  isDragging,
  isDropTarget,
  onNameChange,
  onNameFocus,
  onNameBlur,
  onApplySearchResult,
  onSetsChange,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: ExerciseTemplateRowProps) {
  return (
    <div
      className={`${splitStyles.exerciseRow} ${
        isDragging ? splitStyles.exerciseRowDragging : ""
      } ${isDropTarget ? splitStyles.exerciseRowDropTarget : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        onDragOver();
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop();
      }}
    >
      <button
        type="button"
        draggable={true}
        className={splitStyles.exerciseRowHandle}
        aria-label={`Drag ${exercise.exerciseDisplayName || "exercise"} to reorder`}
        title="Drag to reorder this exercise"
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", exercise.exerciseDisplayName);
          onDragStart();
        }}
        onDragEnd={onDragEnd}
      >
        <GripVertical className={splitStyles.inlineIcon} aria-hidden="true" strokeWidth={1.9} />
      </button>

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
