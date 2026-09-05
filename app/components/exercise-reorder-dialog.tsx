"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { reorderItems } from "@/lib/workout-utils";
import { moveReorderStyles } from "./move-reorder-dialog.styles";

type ExerciseReorderId = string | number;

export type ExerciseReorderItem<Id extends ExerciseReorderId> = {
  id: Id;
  title: string;
  meta: string;
};

type ExerciseReorderDialogProps<Id extends ExerciseReorderId> = {
  items: ExerciseReorderItem<Id>[];
  onCancel: () => void;
  onSave: (orderedIds: Id[]) => void;
};

export function ExerciseReorderDialog<Id extends ExerciseReorderId>({
  items,
  onCancel,
  onSave,
}: ExerciseReorderDialogProps<Id>) {
  const [orderedIds, setOrderedIds] = useState<Id[]>(() =>
    items.map((item) => item.id),
  );
  const [selectedId, setSelectedId] = useState<Id | null>(null);

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

  const itemById = useMemo(
    () =>
      new Map<Id, ExerciseReorderItem<Id>>(
        items.map((item) => [item.id, item]),
      ),
    [items],
  );
  const orderedItems = orderedIds
    .map((id) => itemById.get(id))
    .filter((item): item is ExerciseReorderItem<Id> => Boolean(item));
  const selectedItem = selectedId === null ? null : itemById.get(selectedId) ?? null;

  function selectExerciseOrDestination(id: Id, destinationIndex: number) {
    if (selectedId === null) {
      setSelectedId(id);
      return;
    }

    if (selectedId === id) {
      setSelectedId(null);
      return;
    }

    setOrderedIds((current) => {
      const sourceIndex = current.indexOf(selectedId);

      if (sourceIndex === -1 || sourceIndex === destinationIndex) {
        return current;
      }

      return reorderItems(current, sourceIndex, destinationIndex);
    });
    setSelectedId(null);
  }

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className={moveReorderStyles.overlay}>
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close move exercises"
        className={moveReorderStyles.backdrop}
        onClick={onCancel}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Move exercises"
        className={moveReorderStyles.dialog}
      >
        <h2 className={moveReorderStyles.title}>Move exercises</h2>
        <p aria-live="polite" className={moveReorderStyles.body}>
          {selectedItem
            ? `${selectedItem.title} selected. Choose a position.`
            : "Choose an exercise to move."}
        </p>

        <div aria-label="Exercise order" className={moveReorderStyles.list}>
          {orderedItems.map((item, index) => {
            const isSelected = selectedId === item.id;
            const actionLabel = selectedItem
              ? isSelected
                ? "Deselect"
                : "Move here"
              : "Move";
            const buttonLabel = selectedItem
              ? isSelected
                ? `Cancel moving ${item.title}`
                : `Move ${selectedItem.title} to position ${index + 1}`
              : `Select ${item.title} at position ${index + 1} to move`;

            return (
              <button
                key={item.id}
                type="button"
                aria-label={buttonLabel}
                aria-pressed={isSelected}
                data-reorder-card
                data-reorder-id={item.id}
                data-selected={isSelected}
                className={moveReorderStyles.card}
                onClick={() => selectExerciseOrDestination(item.id, index)}
              >
                <span className={moveReorderStyles.itemText}>
                  <span className={moveReorderStyles.itemTitle}>{item.title}</span>
                  <span className={moveReorderStyles.itemMeta}>{item.meta}</span>
                </span>
                <span
                  data-selected={isSelected}
                  className={moveReorderStyles.itemAction}
                >
                  {actionLabel}
                </span>
              </button>
            );
          })}
        </div>

        <div className={moveReorderStyles.actions}>
          <button
            type="button"
            className={moveReorderStyles.secondaryButton}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className={moveReorderStyles.primaryButton}
            onClick={() => onSave(orderedIds)}
          >
            Done
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
