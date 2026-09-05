import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { SplitExerciseReorderDialog } from "@/app/dashboard/split-exercise-reorder-dialog";
import { WorkoutLoggerReorderDialog } from "@/app/workouts/new/_components/workout-logger-reorder-dialog";
import type { ExerciseDraft } from "@/app/workouts/new/workout-logger.utils";
import type { WorkoutSplitExerciseTemplate } from "@/lib/workout-splits/shared";
import { render } from "./render";

const SPLIT_EXERCISES: WorkoutSplitExerciseTemplate[] = [
  {
    id: "bench",
    order: 1,
    exerciseDisplayName: "Bench press",
    exerciseSlug: "bench-press",
    sets: 3,
  },
  {
    id: "row",
    order: 2,
    exerciseDisplayName: "Barbell row",
    exerciseSlug: "barbell-row",
    sets: 3,
  },
  {
    id: "raise",
    order: 3,
    exerciseDisplayName: "Lateral raise",
    exerciseSlug: "lateral-raise",
    sets: 4,
  },
];

const LOGGER_EXERCISES: ExerciseDraft[] = SPLIT_EXERCISES.map((exercise) => ({
  id: exercise.id ?? `${exercise.order}`,
  name: exercise.exerciseDisplayName,
  sets: Array.from({ length: exercise.sets }, (_, index) => ({
    id: `${exercise.order}-set-${index}`,
    reps: "",
    weightLb: "",
    usesBodyweight: false,
    durationSeconds: "",
  })),
}));

function getMoveDialog() {
  const dialog = document.body.querySelector<HTMLElement>(
    'section[aria-label="Move exercises"]',
  );
  assert.ok(dialog);
  return dialog;
}

test("split exercise reordering uses the two-tap move flow", async () => {
  let savedOrder: number[] = [];
  const mounted = await render(
    createElement(SplitExerciseReorderDialog, {
      exercises: SPLIT_EXERCISES,
      onCancel: () => {},
      onSave: (orderedExerciseOrders) => {
        savedOrder = orderedExerciseOrders;
      },
    }),
  );

  try {
    const dialog = getMoveDialog();
    const source = dialog.querySelector<HTMLElement>(
      'button[aria-label="Select Bench press at position 1 to move"]',
    );
    assert.ok(source);
    await mounted.click(source);
    assert.match(dialog.textContent ?? "", /Bench press selected\. Choose a position\./);

    const destination = dialog.querySelector<HTMLElement>(
      'button[aria-label="Move Bench press to position 3"]',
    );
    assert.ok(destination);
    await mounted.click(destination);

    const done = Array.from(dialog.querySelectorAll<HTMLElement>("button")).find(
      (button) => button.textContent?.trim() === "Done",
    );
    assert.ok(done);
    await mounted.click(done);

    assert.deepEqual(savedOrder, [2, 3, 1]);
  } finally {
    mounted.unmount();
  }
});

test("logger exercise reordering matches the split two-tap move flow", async () => {
  let savedOrder: string[] = [];
  const mounted = await render(
    createElement(WorkoutLoggerReorderDialog, {
      exercises: LOGGER_EXERCISES,
      isOpen: true,
      onCancel: () => {},
      onSave: (orderedExerciseIds) => {
        savedOrder = orderedExerciseIds;
      },
    }),
  );

  try {
    const dialog = getMoveDialog();
    const source = dialog.querySelector<HTMLElement>(
      'button[aria-label="Select Bench press at position 1 to move"]',
    );
    assert.ok(source);
    await mounted.click(source);

    const destination = dialog.querySelector<HTMLElement>(
      'button[aria-label="Move Bench press to position 2"]',
    );
    assert.ok(destination);
    await mounted.click(destination);

    const done = Array.from(dialog.querySelectorAll<HTMLElement>("button")).find(
      (button) => button.textContent?.trim() === "Done",
    );
    assert.ok(done);
    await mounted.click(done);

    assert.deepEqual(savedOrder, ["row", "bench", "raise"]);
  } finally {
    mounted.unmount();
  }
});
