"use client";

import { GripVertical } from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
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

type DayDragState = {
  weekday: SplitWeekdayValue;
  pointerId: number;
  left: number;
  top: number;
  width: number;
  height: number;
  startClientY: number;
  clientY: number;
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
  const [drag, setDrag] = useState<DayDragState | null>(null);
  const [todayWeekday] = useState<SplitWeekdayValue>(getInitialSelectedWeekday);
  const dragRef = useRef<DayDragState | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const previousCardTopsRef = useRef(new Map<SplitWeekdayValue, number>());

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
  const draggingWeekday = drag?.weekday ?? null;
  const draggingDay = draggingWeekday
    ? dayByWeekday.get(draggingWeekday) ?? null
    : null;
  const draggingIndex = draggingWeekday
    ? orderedWeekdays.indexOf(draggingWeekday)
    : -1;

  useLayoutEffect(() => {
    if (!listRef.current) {
      return;
    }

    const cards = Array.from(
      listRef.current.querySelectorAll<HTMLElement>("[data-reorder-card]"),
    );
    const nextCardTops = new Map<SplitWeekdayValue, number>();

    cards.forEach((card, index) => {
      const weekday = orderedWeekdays[index];
      if (!weekday) {
        return;
      }

      const nextTop = card.getBoundingClientRect().top;
      const previousTop = previousCardTopsRef.current.get(weekday);
      nextCardTops.set(weekday, nextTop);

      if (
        weekday !== draggingWeekday &&
        previousTop !== undefined &&
        previousTop !== nextTop &&
        typeof card.animate === "function"
      ) {
        card.animate(
          [
            { transform: `translateY(${previousTop - nextTop}px)` },
            { transform: "translateY(0)" },
          ],
          {
            duration: 160,
            easing: "cubic-bezier(0.2, 0.7, 0.2, 1)",
          },
        );
      }
    });

    previousCardTopsRef.current = nextCardTops;
  }, [draggingWeekday, orderedWeekdays]);

  function startDragging(
    event: ReactPointerEvent<HTMLButtonElement>,
    weekday: SplitWeekdayValue,
  ) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const card = event.currentTarget.closest<HTMLElement>("[data-reorder-card]");
    if (!card) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = card.getBoundingClientRect();
    const nextDrag = {
      weekday,
      pointerId: event.pointerId,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      startClientY: event.clientY,
      clientY: event.clientY,
    };

    dragRef.current = nextDrag;
    setDrag(nextDrag);
  }

  function moveDraggingItem(event: ReactPointerEvent<HTMLDivElement>) {
    const currentDrag = dragRef.current;
    if (
      !currentDrag ||
      currentDrag.pointerId !== event.pointerId ||
      !listRef.current
    ) {
      return;
    }

    event.preventDefault();
    const nextDrag = {
      ...currentDrag,
      clientY: event.clientY,
    };
    dragRef.current = nextDrag;
    setDrag(nextDrag);

    const slots = Array.from(
      listRef.current.querySelectorAll<HTMLElement>("[data-reorder-index]"),
    );
    let toIndex = -1;
    let closestDistance = Number.POSITIVE_INFINITY;

    slots.forEach((slot, index) => {
      const rect = slot.getBoundingClientRect();
      const distance =
        event.clientY < rect.top
          ? rect.top - event.clientY
          : event.clientY > rect.bottom
            ? event.clientY - rect.bottom
            : 0;

      if (distance < closestDistance) {
        closestDistance = distance;
        toIndex = index;
      }
    });

    setOrderedWeekdays((current) => {
      const fromIndex = current.indexOf(currentDrag.weekday);

      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return current;
      }

      return reorderItems(current, fromIndex, toIndex);
    });
  }

  function stopDragging(event: ReactPointerEvent) {
    if (dragRef.current?.pointerId !== event.pointerId) {
      return;
    }

    dragRef.current = null;
    setDrag(null);
  }

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className={splitStyles.splitDialogOverlay}>
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close reorder week"
        className={splitStyles.splitDialogBackdrop}
        onClick={onCancel}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Reorder week"
        className={splitStyles.splitDialog}
      >
        <h2 className={splitStyles.splitDialogTitle}>Reorder week</h2>

        <div
          ref={listRef}
          aria-label="Weekly workout order"
          className={splitStyles.splitWeekReorderList}
          onPointerMove={moveDraggingItem}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
        >
          {orderedDays.map((day, index) => {
            const slotWeekday = SPLIT_WEEKDAYS[index] ?? day.weekday;
            const slotLabel = getSplitWeekdayLabel(slotWeekday);
            const isToday = slotWeekday === todayWeekday;
            const isDragging = draggingWeekday === day.weekday;
            const dayTitle = getDayTitle(day, index);

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
                <div
                  data-reorder-card
                  data-placeholder={isDragging}
                  className={`${splitStyles.splitReorderCard} ${
                    isDragging ? splitStyles.splitReorderCardPlaceholder : ""
                  }`}
                >
                  <div className={splitStyles.splitReorderItemText}>
                    <p className={splitStyles.splitReorderItemTitle}>{dayTitle}</p>
                    <p className={splitStyles.splitReorderItemMeta}>
                      {getDayMeta(day)}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Drag ${dayTitle} from ${slotLabel}`}
                    className={splitStyles.splitReorderDragHandle}
                    onPointerDown={(event) =>
                      startDragging(event, day.weekday)
                    }
                    onLostPointerCapture={stopDragging}
                  >
                    <GripVertical
                      className={splitStyles.splitReorderGripIcon}
                      strokeWidth={1.9}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {drag && draggingDay ? (
          <div
            aria-hidden="true"
            data-reorder-preview
            className={splitStyles.splitReorderDragPreview}
            style={{
              left: drag.left,
              top: drag.top,
              width: drag.width,
              height: drag.height,
              transform: `translate3d(0, ${
                drag.clientY - drag.startClientY
              }px, 0)`,
            }}
          >
            <div className={splitStyles.splitReorderItemText}>
              <p className={splitStyles.splitReorderItemTitle}>
                {getDayTitle(draggingDay, Math.max(draggingIndex, 0))}
              </p>
              <p className={splitStyles.splitReorderItemMeta}>
                {getDayMeta(draggingDay)}
              </p>
            </div>
            <div className={splitStyles.splitReorderDragHandle}>
              <GripVertical
                className={splitStyles.splitReorderGripIcon}
                strokeWidth={1.9}
              />
            </div>
          </div>
        ) : null}

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
