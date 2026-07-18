"use client";

import { GripVertical } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { reorderItems } from "@/lib/workout-utils";
import { styles } from "../workout-logger.styles";
import type { ExerciseDraft } from "../workout-logger.utils";

type WorkoutLoggerReorderDialogProps = {
  exercises: ExerciseDraft[];
  isOpen: boolean;
  onCancel: () => void;
  onSave: (orderedExerciseIds: string[]) => void;
};

export function WorkoutLoggerReorderDialog({
  exercises,
  isOpen,
  onCancel,
  onSave,
}: WorkoutLoggerReorderDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <WorkoutLoggerReorderDialogContent
      key={exercises.map((exercise) => exercise.id).join("-")}
      exercises={exercises}
      onCancel={onCancel}
      onSave={onSave}
    />
  );
}

type WorkoutLoggerReorderDialogContentProps = Omit<
  WorkoutLoggerReorderDialogProps,
  "isOpen"
>;

function WorkoutLoggerReorderDialogContent({
  exercises,
  onCancel,
  onSave,
}: WorkoutLoggerReorderDialogContentProps) {
  const [orderedIds, setOrderedIds] = useState(() =>
    exercises.map((exercise) => exercise.id),
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onCancel]);

  const exerciseById = useMemo(
    () => new Map(exercises.map((exercise) => [exercise.id, exercise])),
    [exercises],
  );
  const orderedExercises = orderedIds
    .map((exerciseId) => exerciseById.get(exerciseId))
    .filter((exercise): exercise is ExerciseDraft => Boolean(exercise));

  function moveDraggingItem(clientY: number) {
    if (!draggingId || !listRef.current) {
      return;
    }

    const rows = Array.from(
      listRef.current.querySelectorAll<HTMLElement>("[data-reorder-id]"),
    );
    const targetRow = rows.find((row) => {
      const rect = row.getBoundingClientRect();
      return clientY >= rect.top && clientY <= rect.bottom;
    });
    const targetId = targetRow?.dataset.reorderId;

    if (!targetId || targetId === draggingId) {
      return;
    }

    setOrderedIds((current) => {
      const fromIndex = current.indexOf(draggingId);
      const toIndex = current.indexOf(targetId);

      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return current;
      }

      return reorderItems(current, fromIndex, toIndex);
    });
  }

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className={styles.reorderOverlay}>
      <button
        type="button"
        className={styles.reorderBackdrop}
        aria-label="Cancel workout reorder"
        onClick={onCancel}
      />
      <section
        className={styles.reorderDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className={styles.reorderHeader}>
          <div>
            <h2 id={titleId} className={styles.confirmTitle}>
              Reorder exercises
            </h2>
          </div>
        </div>

        <div
          ref={listRef}
          className={styles.reorderList}
          onPointerMove={(event) => {
            if (!draggingId) {
              return;
            }

            event.preventDefault();
            moveDraggingItem(event.clientY);
          }}
          onPointerUp={() => setDraggingId(null)}
          onPointerCancel={() => setDraggingId(null)}
        >
          {orderedExercises.map((exercise, exerciseIndex) => {
            const exerciseName = exercise.name.trim() || `Exercise ${exerciseIndex + 1}`;
            const setLabel =
              exercise.sets.length === 1 ? "1 set" : `${exercise.sets.length} sets`;

            return (
              <div
                key={exercise.id}
                data-reorder-id={exercise.id}
                data-dragging={draggingId === exercise.id}
                className={styles.reorderItem}
              >
                <div className={styles.reorderItemText}>
                  <p className={styles.reorderItemTitle}>{exerciseName}</p>
                  <p className={styles.reorderItemMeta}>{setLabel}</p>
                </div>
                <button
                  type="button"
                  className={styles.reorderDragHandle}
                  aria-label={`Drag ${exerciseName}`}
                  onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    setDraggingId(exercise.id);
                  }}
                >
                  <GripVertical
                    className={styles.icon}
                    aria-hidden="true"
                    strokeWidth={1.9}
                  />
                </button>
              </div>
            );
          })}
        </div>

        <div className={styles.reorderActions}>
          <button
            type="button"
            className={styles.confirmSecondaryButton}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.saveButton}
            onClick={() => onSave(orderedIds)}
          >
            Save order
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
