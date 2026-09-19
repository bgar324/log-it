"use client";

import { MoveReorderDialog } from "@/app/components/move-reorder-dialog";
import type { WorkoutSplitExerciseTemplate } from "@/lib/workout-splits/shared";

type SplitExerciseReorderDialogProps = {
  exercises: WorkoutSplitExerciseTemplate[];
  open: boolean;
  onCancel: () => void;
  onSave: (orderedExerciseOrders: number[]) => void;
};

export function SplitExerciseReorderDialog({
  exercises,
  open,
  onCancel,
  onSave,
}: SplitExerciseReorderDialogProps) {
  const items = exercises.map((exercise, index) => ({
    id: exercise.order,
    title: exercise.exerciseDisplayName.trim() || `Exercise ${index + 1}`,
    meta: exercise.sets === 1 ? "1 set" : `${exercise.sets} sets`,
  }));

  return (
    <MoveReorderDialog kind="exercise"
      items={items}
      open={open}
      onCancel={onCancel}
      onSave={onSave}
    />
  );
}
