"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { reorderItems } from "@/lib/workout-utils";
import type { ExerciseDraft } from "../workout-logger.utils";

function findExerciseIndexFromPoint(clientX: number, clientY: number) {
  for (const element of document.elementsFromPoint(clientX, clientY)) {
    if (!(element instanceof HTMLElement)) {
      continue;
    }

    const card = element.closest<HTMLElement>("[data-exercise-card]");

    if (!card) {
      continue;
    }

    const exerciseIndex = Number.parseInt(card.dataset.exerciseIndex ?? "", 10);

    if (Number.isInteger(exerciseIndex)) {
      return exerciseIndex;
    }
  }

  return null;
}

type UseWorkoutLoggerDragOptions = {
  onReorder: (
    updater: (current: ExerciseDraft[]) => ExerciseDraft[],
  ) => void;
};

export function useWorkoutLoggerDrag({
  onReorder,
}: UseWorkoutLoggerDragOptions) {
  const exerciseDragRef = useRef<{
    activeIndex: number;
    targetIndex: number;
    pointerId: number;
  } | null>(null);
  const [draggingExerciseIndex, setDraggingExerciseIndex] = useState<
    number | null
  >(null);
  const [dropTargetExerciseIndex, setDropTargetExerciseIndex] = useState<
    number | null
  >(null);

  function clearExerciseDragState() {
    exerciseDragRef.current = null;
    setDraggingExerciseIndex(null);
    setDropTargetExerciseIndex(null);
  }

  function commitExerciseReorder(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) {
      clearExerciseDragState();
      return;
    }

    onReorder((current) => reorderItems(current, fromIndex, toIndex));
    clearExerciseDragState();
  }

  function handleExercisePointerDown(
    event: ReactPointerEvent<HTMLButtonElement>,
    exerciseIndex: number,
  ) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    exerciseDragRef.current = {
      activeIndex: exerciseIndex,
      targetIndex: exerciseIndex,
      pointerId: event.pointerId,
    };
    setDraggingExerciseIndex(exerciseIndex);
    setDropTargetExerciseIndex(exerciseIndex);
  }

  function handleExercisePointerMove(
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    const activeDrag = exerciseDragRef.current;

    if (!activeDrag || activeDrag.pointerId !== event.pointerId) {
      return;
    }

    const hoveredIndex = findExerciseIndexFromPoint(event.clientX, event.clientY);

    if (hoveredIndex === null || hoveredIndex === activeDrag.targetIndex) {
      return;
    }

    exerciseDragRef.current = {
      ...activeDrag,
      targetIndex: hoveredIndex,
    };
    setDropTargetExerciseIndex(hoveredIndex);
  }

  function handleExercisePointerUp(
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    const activeDrag = exerciseDragRef.current;

    if (!activeDrag || activeDrag.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    commitExerciseReorder(activeDrag.activeIndex, activeDrag.targetIndex);
  }

  function handleExercisePointerCancel(
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    const activeDrag = exerciseDragRef.current;

    if (!activeDrag || activeDrag.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    clearExerciseDragState();
  }

  return {
    draggingExerciseIndex,
    dropTargetExerciseIndex,
    handleExercisePointerCancel,
    handleExercisePointerDown,
    handleExercisePointerMove,
    handleExercisePointerUp,
  };
}
