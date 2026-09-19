"use client";

import { MoveReorderDialog } from "@/app/components/move-reorder-dialog";
import type { ExerciseDraft } from "../workout-logger.utils";

type WorkoutLoggerReorderDialogProps = {
  exercises: ExerciseDraft[];
  isOpen: boolean;
  onCancel: () => void;
  onSave: (orderedExerciseIds: string[]) => void;
};

export function WorkoutLoggerReorderDialog({
  exercises,
  isOpen,
  onCancel,
  onSave,
}: WorkoutLoggerReorderDialogProps) {
  const items = exercises.map((exercise, index) => ({
    id: exercise.id,
    title: exercise.name.trim() || `Exercise ${index + 1}`,
    meta: exercise.sets.length === 1 ? "1 set" : `${exercise.sets.length} sets`,
  }));

  return (
    <MoveReorderDialog kind="exercise"
      items={items}
      open={isOpen}
      onCancel={onCancel}
      onSave={onSave}
    />
  );
}
