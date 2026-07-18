"use client";

import { GripVertical } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { WorkoutSplitExerciseTemplate } from "@/lib/workout-splits/shared";
import { reorderItems } from "@/lib/workout-utils";
import { splitStyles } from "./split-system.styles";

type SplitExerciseReorderDialogProps = {
  exercises: WorkoutSplitExerciseTemplate[];
  onCancel: () => void;
  onSave: (orderedExerciseOrders: number[]) => void;
};

export function SplitExerciseReorderDialog({
  exercises,
  onCancel,
  onSave,
}: SplitExerciseReorderDialogProps) {
  const [orderedExerciseOrders, setOrderedExerciseOrders] = useState(() =>
    exercises.map((exercise) => exercise.order),
  );
  const [draggingOrder, setDraggingOrder] = useState<number | null>(null);
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

  const exerciseByOrder = useMemo(
    () => new Map(exercises.map((exercise) => [exercise.order, exercise])),
    [exercises],
  );
  const orderedExercises = orderedExerciseOrders
    .map((exerciseOrder) => exerciseByOrder.get(exerciseOrder))
    .filter((exercise): exercise is WorkoutSplitExerciseTemplate => Boolean(exercise));

  function moveDraggingItem(clientY: number) {
    if (draggingOrder === null || !listRef.current) {
      return;
    }

    const rows = Array.from(
      listRef.current.querySelectorAll<HTMLElement>("[data-reorder-order]"),
    );
    const targetRow = rows.find((row) => {
      const rect = row.getBoundingClientRect();
      return clientY >= rect.top && clientY <= rect.bottom;
    });
    const targetOrder = Number(targetRow?.dataset.reorderOrder);

    if (!Number.isFinite(targetOrder) || targetOrder === draggingOrder) {
      return;
    }

    setOrderedExerciseOrders((current) => {
      const fromIndex = current.indexOf(draggingOrder);
      const toIndex = current.indexOf(targetOrder);

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
    <div className={splitStyles.splitDialogOverlay}>
      <button
        type="button"
        className={splitStyles.splitDialogBackdrop}
        aria-label="Cancel exercise reorder"
        onClick={onCancel}
      />
      <section
        className={splitStyles.splitDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className={splitStyles.splitDialogTitle}>
          Reorder exercises
        </h2>

        <div
          ref={listRef}
          className={splitStyles.splitReorderList}
          onPointerMove={(event) => {
            if (draggingOrder === null) {
              return;
            }

            event.preventDefault();
            moveDraggingItem(event.clientY);
          }}
          onPointerUp={() => setDraggingOrder(null)}
          onPointerCancel={() => setDraggingOrder(null)}
        >
          {orderedExercises.map((exercise, index) => {
            const exerciseName = exercise.exerciseDisplayName.trim() || `Exercise ${index + 1}`;
            const setLabel = exercise.sets === 1 ? "1 set" : `${exercise.sets} sets`;

            return (
              <div
                key={exercise.id ?? exercise.order}
                data-reorder-order={exercise.order}
                data-dragging={draggingOrder === exercise.order}
                className={splitStyles.splitReorderItem}
              >
                <div className={splitStyles.splitReorderItemText}>
                  <p className={splitStyles.splitReorderItemTitle}>{exerciseName}</p>
                  <p className={splitStyles.splitReorderItemMeta}>{setLabel}</p>
                </div>
                <button
                  type="button"
                  className={splitStyles.splitReorderDragHandle}
                  aria-label={`Drag ${exerciseName}`}
                  onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    setDraggingOrder(exercise.order);
                  }}
                >
                  <GripVertical
                    className={splitStyles.inlineIcon}
                    aria-hidden="true"
                    strokeWidth={1.9}
                  />
                </button>
              </div>
            );
          })}
        </div>

        <div className={splitStyles.splitDialogActions}>
          <button
            type="button"
            className={splitStyles.splitDialogSecondaryButton}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className={splitStyles.primaryButton}
            onClick={() => onSave(orderedExerciseOrders)}
          >
            Save order
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
