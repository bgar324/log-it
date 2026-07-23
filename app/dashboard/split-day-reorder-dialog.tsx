"use client";

import { GripVertical } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  getSplitWeekdayIndex,
  getSplitWeekdayLabel,
  isRestDayWorkoutTypeSlug,
  type SplitWeekdayValue,
  type WorkoutSplitDayTemplate,
} from "@/lib/workout-splits/shared";
import { reorderItems } from "@/lib/workout-utils";
import { splitStyles } from "./split-system.styles";

type SplitDayReorderDialogProps = {
  days: WorkoutSplitDayTemplate[];
  onCancel: () => void;
  onSave: (orderedWeekdays: SplitWeekdayValue[]) => void;
};

export function SplitDayReorderDialog({
  days,
  onCancel,
  onSave,
}: SplitDayReorderDialogProps) {
  const sortedDays = useMemo(
    () =>
      [...days].sort(
        (left, right) =>
          getSplitWeekdayIndex(left.weekday) - getSplitWeekdayIndex(right.weekday),
      ),
    [days],
  );
  const [orderedWeekdays, setOrderedWeekdays] = useState<SplitWeekdayValue[]>(() =>
    sortedDays.map((day) => day.weekday),
  );
  const [draggingWeekday, setDraggingWeekday] = useState<SplitWeekdayValue | null>(null);
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

  const dayByWeekday = useMemo(
    () => new Map(sortedDays.map((day) => [day.weekday, day])),
    [sortedDays],
  );
  const orderedDays = orderedWeekdays
    .map((weekday) => dayByWeekday.get(weekday))
    .filter((day): day is WorkoutSplitDayTemplate => Boolean(day));

  function moveDraggingItem(clientY: number) {
    if (draggingWeekday === null || !listRef.current) {
      return;
    }

    const rows = Array.from(
      listRef.current.querySelectorAll<HTMLElement>("[data-reorder-weekday]"),
    );
    const targetRow = rows.find((row) => {
      const rect = row.getBoundingClientRect();
      return clientY >= rect.top && clientY <= rect.bottom;
    });
    const targetWeekday = targetRow?.dataset.reorderWeekday as
      | SplitWeekdayValue
      | undefined;

    if (!targetWeekday || targetWeekday === draggingWeekday) {
      return;
    }

    setOrderedWeekdays((current) => {
      const fromIndex = current.indexOf(draggingWeekday);
      const toIndex = current.indexOf(targetWeekday);

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
        aria-label="Cancel day reorder"
        onClick={onCancel}
      />
      <section
        className={splitStyles.splitDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className={splitStyles.splitDialogTitle}>
          Reorder days
        </h2>

        <div
          ref={listRef}
          className={splitStyles.splitReorderList}
          onPointerMove={(event) => {
            if (draggingWeekday === null) {
              return;
            }

            event.preventDefault();
            moveDraggingItem(event.clientY);
          }}
          onPointerUp={() => setDraggingWeekday(null)}
          onPointerCancel={() => setDraggingWeekday(null)}
        >
          {orderedDays.map((day, index) => {
            const isRestDay = isRestDayWorkoutTypeSlug(day.workoutTypeSlug);
            const dayTitle =
              day.workoutType.trim() || (isRestDay ? "Rest" : `Day ${index + 1}`);
            const meta = isRestDay
              ? "Rest day"
              : day.exercises.length === 1
                ? "1 exercise"
                : `${day.exercises.length} exercises`;

            return (
              <div
                key={day.weekday}
                data-reorder-weekday={day.weekday}
                data-dragging={draggingWeekday === day.weekday}
                className={splitStyles.splitReorderItem}
              >
                <div className={splitStyles.splitReorderItemText}>
                  <p className={splitStyles.splitReorderItemTitle}>{dayTitle}</p>
                  <p className={splitStyles.splitReorderItemMeta}>
                    {getSplitWeekdayLabel(day.weekday)} · {meta}
                  </p>
                </div>
                <button
                  type="button"
                  className={splitStyles.splitReorderDragHandle}
                  aria-label={`Drag ${dayTitle}`}
                  onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    setDraggingWeekday(day.weekday);
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
            onClick={() => onSave(orderedWeekdays)}
          >
            Save order
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
