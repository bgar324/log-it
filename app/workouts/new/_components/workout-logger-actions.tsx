"use client";

import { ArrowUpDown, Loader2, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { MotionState } from "@/app/components/motion-state";
import { styles } from "../workout-logger.styles";

type WorkoutLoggerActionsProps = {
  onSave: () => void;
  submitLabel: string;
  isSaving: boolean;
  canReorder: boolean;
  canResetFromSplit: boolean;
  canRemoveExercise: boolean;
  onRemoveExercise: () => void;
  onAddExercise: () => void;
  onReorder: () => void;
  onResetFromSplit: () => void;
};

export function WorkoutLoggerActions({
  onSave, submitLabel, isSaving, canReorder, canResetFromSplit,
  onAddExercise, onReorder, onResetFromSplit, canRemoveExercise, onRemoveExercise,
}: WorkoutLoggerActionsProps) {
  return (
    <div role="group" aria-label="Workout actions" className={styles.toolsRow}>
      <button type="button" className={styles.toolDelete} aria-label="Delete current exercise" title="Delete current exercise"
        disabled={isSaving || !canRemoveExercise} onPointerDown={event => event.preventDefault()} onClick={onRemoveExercise}>
        <Trash2 className={styles.toolIcon} strokeWidth={1.9} />
      </button>
      <button type="button" className={styles.toolCircle} aria-label="Add another exercise" title="Add another exercise"
        disabled={isSaving} onPointerDown={event => event.preventDefault()} onClick={onAddExercise}>
        <Plus className={styles.toolIcon} strokeWidth={1.9} />
      </button>
      <button type="button" className={styles.toolCircle} aria-label="Reorder exercises" title="Reorder exercises"
        disabled={isSaving || !canReorder} onPointerDown={event => event.preventDefault()} onClick={onReorder}>
        <ArrowUpDown className={styles.toolIcon} strokeWidth={1.9} />
      </button>
      {canResetFromSplit ? (
        <button type="button" className={styles.toolCircle} aria-label="Reset from split" title="Reset from split"
          disabled={isSaving} onPointerDown={event => event.preventDefault()} onClick={onResetFromSplit}>
          <RotateCcw className={styles.toolIcon} strokeWidth={1.9} />
        </button>
      ) : null}
      <button type="button" className={styles.toolSave} aria-label={submitLabel} title={submitLabel}
        disabled={isSaving} onPointerDown={event => event.preventDefault()} onClick={onSave}>
        <MotionState stateKey={isSaving ? "saving" : "save"}>
          {isSaving ? <Loader2 className={styles.spinningIcon} /> : <Save className={styles.toolIcon} strokeWidth={1.9} />}
          <span>{isSaving ? "Saving" : "Save"}</span>
        </MotionState>
      </button>
    </div>
  );
}
