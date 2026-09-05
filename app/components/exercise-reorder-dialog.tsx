"use client";

import { GripVertical } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const [draggingId, setDraggingId] = useState<Id | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

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

  function moveDraggingItem(clientY: number) {
    if (draggingId === null || !listRef.current) {
      return;
    }

    const rows = Array.from(
      listRef.current.querySelectorAll<HTMLElement>("[data-reorder-index]"),
    );
    const targetRow = rows.find((row) => {
      const rect = row.getBoundingClientRect();
      return clientY >= rect.top && clientY <= rect.bottom;
    });
    const targetIndex = Number(targetRow?.dataset.reorderIndex);

    if (!Number.isInteger(targetIndex)) {
      return;
    }

    setOrderedIds((current) => {
      const sourceIndex = current.indexOf(draggingId);

      if (sourceIndex === -1 || sourceIndex === targetIndex) {
        return current;
      }

      return reorderItems(current, sourceIndex, targetIndex);
    });
  }

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className={moveReorderStyles.overlay}>
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close reorder exercises"
        className={moveReorderStyles.backdrop}
        onClick={onCancel}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Reorder exercises"
        className={moveReorderStyles.dialog}
      >
        <h2 className={moveReorderStyles.title}>Reorder exercises</h2>

        <div
          ref={listRef}
          aria-label="Exercise order"
          className={moveReorderStyles.exerciseList}
          onPointerMove={(event) => {
            if (draggingId === null) {
              return;
            }

            event.preventDefault();
            moveDraggingItem(event.clientY);
          }}
          onPointerUp={() => setDraggingId(null)}
          onPointerCancel={() => setDraggingId(null)}
        >
          {orderedItems.map((item, index) => (
            <div
              key={item.id}
              data-reorder-id={item.id}
              data-reorder-index={index}
              data-dragging={draggingId === item.id}
              className={moveReorderStyles.exerciseItem}
            >
              <div className={moveReorderStyles.itemText}>
                <p className={moveReorderStyles.itemTitle}>{item.title}</p>
                <p className={moveReorderStyles.itemMeta}>{item.meta}</p>
              </div>
              <button
                type="button"
                aria-label={`Drag ${item.title}`}
                className={moveReorderStyles.dragHandle}
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  setDraggingId(item.id);
                }}
              >
                <GripVertical
                  className={moveReorderStyles.inlineIcon}
                  strokeWidth={1.9}
                />
              </button>
            </div>
          ))}
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
            Save order
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
