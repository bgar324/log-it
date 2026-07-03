"use client";

import { ArrowUpDown, Dumbbell, Loader2, Plus, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { styles } from "../workout-logger.styles";

type WorkoutLoggerMobileActionsProps = {
  addExerciseLabel: string;
  formId: string;
  isSaving: boolean;
  reorderDisabled: boolean;
  submitLabel: string;
  onAddExercise: () => void;
  onOpenReorder: () => void;
};

export function WorkoutLoggerMobileActions({
  addExerciseLabel,
  formId,
  isSaving,
  reorderDisabled,
  submitLabel,
  onAddExercise,
  onOpenReorder,
}: WorkoutLoggerMobileActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  function handleAddExercise() {
    onAddExercise();
    setIsOpen(false);
  }

  function handleOpenReorder() {
    onOpenReorder();
    setIsOpen(false);
  }

  if (!isMounted) {
    return null;
  }

  return createPortal(
    <div className={styles.mobileFabRoot}>
      <div
        className={styles.mobileFabStack}
        data-open={isOpen}
        aria-hidden={!isOpen}
      >
        <button
          type="submit"
          form={formId}
          className={styles.mobileFabAction}
          disabled={isSaving}
          tabIndex={isOpen ? 0 : -1}
          aria-label={submitLabel}
          title={submitLabel}
        >
          {isSaving ? (
            <Loader2
              className={styles.mobileFabIconSpin}
              aria-hidden="true"
              strokeWidth={1.9}
            />
          ) : (
            <Save
              className={styles.mobileFabIcon}
              aria-hidden="true"
              strokeWidth={1.9}
            />
          )}
        </button>
        <button
          type="button"
          className={styles.mobileFabAction}
          onClick={handleAddExercise}
          tabIndex={isOpen ? 0 : -1}
          aria-label={addExerciseLabel}
          title={addExerciseLabel}
        >
          <Plus
            className={styles.mobileFabIcon}
            aria-hidden="true"
            strokeWidth={1.9}
          />
        </button>
        <button
          type="button"
          className={styles.mobileFabAction}
          disabled={reorderDisabled}
          onClick={handleOpenReorder}
          tabIndex={isOpen ? 0 : -1}
          aria-label="Reorder workout"
          title="Reorder workout"
        >
          <ArrowUpDown
            className={styles.mobileFabIcon}
            aria-hidden="true"
            strokeWidth={1.9}
          />
        </button>
      </div>

      <button
        type="button"
        className={styles.mobileFabButton}
        data-open={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close workout actions" : "Open workout actions"}
      >
        {isOpen ? (
          <X
            className={styles.mobileFabMainIcon}
            aria-hidden="true"
            strokeWidth={2.1}
          />
        ) : (
          <Dumbbell
            className={styles.mobileFabMainIcon}
            aria-hidden="true"
            strokeWidth={1.9}
          />
        )}
      </button>
    </div>,
    document.body,
  );
}
