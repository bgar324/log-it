"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import {
  reorderSplitDays,
  SPLIT_WEEKDAYS,
  type SplitWeekdayValue,
  type WorkoutSplitTemplate,
} from "@/lib/workout-splits/shared";

type UseSplitManagerDayDragOptions = {
  selectedWeekday: SplitWeekdayValue;
  setSelectedWeekday: Dispatch<SetStateAction<SplitWeekdayValue>>;
  setSplit: Dispatch<SetStateAction<WorkoutSplitTemplate>>;
  clearAllExerciseSuggestions: () => void;
};

export function useSplitManagerDayDrag({
  selectedWeekday,
  setSelectedWeekday,
  setSplit,
  clearAllExerciseSuggestions,
}: UseSplitManagerDayDragOptions) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  function startDraggingDay(index: number) {
    setDraggingIndex(index);
    setDropTargetIndex(index);
  }

  function dragOverDay(index: number) {
    setDropTargetIndex(index);
  }

  function endDayDrag() {
    setDraggingIndex(null);
    setDropTargetIndex(null);
  }

  function dropDayAt(index: number) {
    const fromIndex = draggingIndex ?? index;

    if (fromIndex === index) {
      endDayDrag();
      return;
    }

    clearAllExerciseSuggestions();
    setSplit((current) => ({
      ...current,
      days: reorderSplitDays(current.days, fromIndex, index),
    }));
    setSelectedWeekday(SPLIT_WEEKDAYS[index] ?? selectedWeekday);
    endDayDrag();
  }

  return {
    draggingIndex,
    dropTargetIndex,
    startDraggingDay,
    dragOverDay,
    endDayDrag,
    dropDayAt,
  };
}
