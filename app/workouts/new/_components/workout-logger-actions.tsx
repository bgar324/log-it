"use client";

import { ArrowUpDown, Ellipsis, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { actionMenuRow, actionOutline } from "@/app/components/action.styles";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { InlineFeedback, type Feedback } from "@/app/components/inline-feedback";
import { styles } from "../workout-logger.styles";

type WorkoutLoggerActionsProps = {
  onSave: () => void;
  submitLabel: string;
  isSaving: boolean;
  feedback: Feedback | null;
  feedbackAction?: { label: string; onClick: () => void };
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
  feedback, feedbackAction,
}: WorkoutLoggerActionsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div role="group" aria-label="Workout actions" className={styles.toolsRow}>
      <InlineFeedback feedback={feedback} action={feedbackAction} className="pointer-events-auto absolute bottom-[calc(100%+3.75rem)] max-h-[30vh] w-full overflow-y-auto rounded-xl bg-[var(--bg)] px-3 py-2" />
      <button type="button" aria-label="Add another exercise" className={`${actionOutline} pointer-events-auto min-w-0 flex-1 px-2! bg-[var(--app-surface-raised)] shadow-[0_4px_16px_color-mix(in_srgb,#000_14%,transparent)]`}
        disabled={isSaving} onPointerDown={event => event.preventDefault()} onClick={onAddExercise}>
        <Plus className={styles.toolIcon} strokeWidth={1.9} />
        <span>Add exercise</span>
      </button>
      <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <PopoverTrigger type="button" className={styles.toolCircle} aria-label="Workout tools" title="Workout tools"
          disabled={isSaving} onPointerDown={event => event.preventDefault()}>
          <Ellipsis className={styles.toolIcon} strokeWidth={1.9} />
        </PopoverTrigger>
        <PopoverContent className={styles.jumpMenu} align="end" side="top" preserveInputFocus>
          <button type="button" aria-label="Reorder exercises" className={actionMenuRow} disabled={isSaving || !canReorder}
            onPointerDown={event => event.preventDefault()}
            onClick={() => { setIsMenuOpen(false); onReorder(); }}>
            <ArrowUpDown className={styles.toolIcon} strokeWidth={1.9} />
            <span>Reorder exercises</span>
          </button>
          {canResetFromSplit ? (
            <button type="button" aria-label="Reset from split" className={actionMenuRow} disabled={isSaving}
              onPointerDown={event => event.preventDefault()}
              onClick={() => { setIsMenuOpen(false); onResetFromSplit(); }}>
              <RotateCcw className={styles.toolIcon} strokeWidth={1.9} />
              <span>Reset from split</span>
            </button>
          ) : null}
          <button type="button" aria-label="Delete current exercise" className={styles.exerciseMenuDangerItem} disabled={isSaving || !canRemoveExercise}
            onPointerDown={event => event.preventDefault()}
            onClick={() => { setIsMenuOpen(false); onRemoveExercise(); }}>
            <Trash2 className={styles.toolIcon} strokeWidth={1.9} />
            <span>Delete current exercise</span>
          </button>
        </PopoverContent>
      </Popover>
      <button type="button" className={styles.toolSave} aria-label={submitLabel} title={submitLabel}
        disabled={isSaving} aria-busy={isSaving} onPointerDown={event => event.preventDefault()} onClick={onSave}>
        <span className="inline-flex items-center justify-center gap-[0.35rem]">
          <Save className={styles.toolIcon} strokeWidth={1.9} />
          <span>{isSaving ? "Saving" : "Save"}</span>
        </span>
      </button>
    </div>
  );
}
