"use client";

import { useState } from "react";
import { reorderItems } from "@/lib/workout-utils";
import type { ExerciseDraft } from "../workout-logger.utils";

type UseWorkoutLoggerDragOptions = {
  onReorder: (
    updater: (current: ExerciseDraft[]) => ExerciseDraft[],
  ) => void;
};

export function useWorkoutLoggerDrag({
  onReorder,
}: UseWorkoutLoggerDragOptions) {
  const [draggingExerciseIndex, setDraggingExerciseIndex] = useState<
    number | null
  >(null);
  const [dropTargetExerciseIndex, setDropTargetExerciseIndex] = useState<
    number | null
  >(null);

  function endExerciseDrag() {
    setDraggingExerciseIndex(null);
    setDropTargetExerciseIndex(null);
  }

  function startDraggingExercise(exerciseIndex: number) {
    setDraggingExerciseIndex(exerciseIndex);
    setDropTargetExerciseIndex(exerciseIndex);
  }

  function dragOverExercise(exerciseIndex: number) {
    setDropTargetExerciseIndex(exerciseIndex);
  }

  function dropExerciseAt(exerciseIndex: number) {
    const fromIndex = draggingExerciseIndex ?? exerciseIndex;

    if (fromIndex === exerciseIndex) {
      endExerciseDrag();
      return;
    }

    onReorder((current) => reorderItems(current, fromIndex, exerciseIndex));
    endExerciseDrag();
  }

  return {
    draggingExerciseIndex,
    dropTargetExerciseIndex,
    dragOverExercise,
    dropExerciseAt,
    endExerciseDrag,
    startDraggingExercise,
  };
}
