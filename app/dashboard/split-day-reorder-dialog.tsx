"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  SPLIT_WEEKDAYS,
  getSplitWeekdayIndex,
  getSplitWeekdayLabel,
  isRestDayWorkoutTypeSlug,
  type SplitWeekdayValue,
  type WorkoutSplitDayTemplate,
} from "@/lib/workout-splits/shared";
import { reorderItems } from "@/lib/workout-utils";
import { splitStyles } from "./split-system.styles";
import { getInitialSelectedWeekday } from "./split-manager.shared";

type SplitDayReorderDialogProps = {
  days: WorkoutSplitDayTemplate[];
  onCancel: () => void;
  onSave: (orderedWeekdays: SplitWeekdayValue[]) => void;
};

function getDayTitle(day: WorkoutSplitDayTemplate, index: number) {
  const isRestDay = isRestDayWorkoutTypeSlug(day.workoutTypeSlug);
  return day.workoutType.trim() || (isRestDay ? "Rest" : `Day ${index + 1}`);
}

function getDayMeta(day: WorkoutSplitDayTemplate) {
  if (isRestDayWorkoutTypeSlug(day.workoutTypeSlug)) {
    return "Rest day";
  }

  return day.exercises.length === 1
    ? "1 exercise"
    : `${day.exercises.length} exercises`;
}

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
  const [selectedWeekday, setSelectedWeekday] =
    useState<SplitWeekdayValue | null>(null);
  const [todayWeekday] = useState<SplitWeekdayValue>(getInitialSelectedWeekday);

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
  const selectedDay = selectedWeekday
    ? dayByWeekday.get(selectedWeekday) ?? null
    : null;
  const selectedIndex = selectedWeekday
    ? orderedWeekdays.indexOf(selectedWeekday)
    : -1;
  const selectedTitle = selectedDay
    ? getDayTitle(selectedDay, Math.max(selectedIndex, 0))
    : null;

  function selectWorkoutOrDestination(
    weekday: SplitWeekdayValue,
    destinationIndex: number,
  ) {
    if (!selectedWeekday) {
      setSelectedWeekday(weekday);
      return;
    }

    if (selectedWeekday === weekday) {
      setSelectedWeekday(null);
      return;
    }

    setOrderedWeekdays((current) => {
      const sourceIndex = current.indexOf(selectedWeekday);

      if (sourceIndex === -1 || sourceIndex === destinationIndex) {
        return current;
      }

      return reorderItems(current, sourceIndex, destinationIndex);
    });
    setSelectedWeekday(null);
  }

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className={splitStyles.splitDialogOverlay}>
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close move workouts"
        className={splitStyles.splitDialogBackdrop}
        onClick={onCancel}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Move workouts"
        className={splitStyles.splitDialog}
      >
        <h2 className={splitStyles.splitDialogTitle}>Move workouts</h2>
        <p aria-live="polite" className={splitStyles.splitDialogBody}>
          {selectedTitle
            ? `${selectedTitle} selected. Choose a day.`
            : "Choose a workout to move."}
        </p>

        <div
          aria-label="Weekly workout order"
          className={splitStyles.splitWeekReorderList}
        >
          {orderedDays.map((day, index) => {
            const slotWeekday = SPLIT_WEEKDAYS[index] ?? day.weekday;
            const slotLabel = getSplitWeekdayLabel(slotWeekday);
            const isToday = slotWeekday === todayWeekday;
            const isSelected = selectedWeekday === day.weekday;
            const dayTitle = getDayTitle(day, index);
            const actionLabel = selectedWeekday
              ? isSelected
                ? "Deselect"
                : "Move here"
              : "Move";
            const buttonLabel = selectedTitle
              ? isSelected
                ? `Cancel moving ${dayTitle}`
                : `Move ${selectedTitle} to ${slotLabel}`
              : `Select ${dayTitle} from ${slotLabel} to move`;

            return (
              <div
                key={day.weekday}
                data-reorder-index={index}
                data-reorder-weekday={day.weekday}
                className={splitStyles.splitReorderSlot}
              >
                <div className={splitStyles.splitReorderDayLabel}>
                  <span
                    className={
                      isToday ? splitStyles.splitReorderDayLabelToday : undefined
                    }
                  >
                    {slotLabel.slice(0, 3)}
                  </span>
                  {isToday ? (
                    <span className={splitStyles.splitReorderToday}>Today</span>
                  ) : null}
                </div>
                <button
                  type="button"
                  aria-label={buttonLabel}
                  aria-pressed={isSelected}
                  data-reorder-card
                  data-selected={isSelected}
                  className={splitStyles.splitReorderCard}
                  onClick={() =>
                    selectWorkoutOrDestination(day.weekday, index)
                  }
                >
                  <span className={splitStyles.splitReorderItemText}>
                    <span className={splitStyles.splitReorderItemTitle}>
                      {dayTitle}
                    </span>
                    <span className={splitStyles.splitReorderItemMeta}>
                      {getDayMeta(day)}
                    </span>
                  </span>
                  <span
                    data-selected={isSelected}
                    className={splitStyles.splitReorderItemAction}
                  >
                    {actionLabel}
                  </span>
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
            Done
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
