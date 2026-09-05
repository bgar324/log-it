"use client";

import { ExerciseReorderDialog } from "@/app/components/exercise-reorder-dialog";
import type { WorkoutSplitExerciseTemplate } from "@/lib/workout-splits/shared";

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
  const items = exercises.map((exercise, index) => ({
    id: exercise.order,
    title: exercise.exerciseDisplayName.trim() || `Exercise ${index + 1}`,
    meta: exercise.sets === 1 ? "1 set" : `${exercise.sets} sets`,
  }));

  return (
    <ExerciseReorderDialog
      items={items}
      onCancel={onCancel}
      onSave={onSave}
    />
  );
}
