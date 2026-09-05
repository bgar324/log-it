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

function getReorderDialog() {
  const dialog = document.body.querySelector<HTMLElement>(
    'section[aria-label="Reorder exercises"]',
  );
  assert.ok(dialog);
  return dialog;
}

function getDragLabels(dialog: HTMLElement) {
  return Array.from(
    dialog.querySelectorAll<HTMLButtonElement>('button[aria-label^="Drag "]'),
  ).map((button) => button.getAttribute("aria-label"));
}

test("split exercise reordering exposes the grab-handle flow", async () => {
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
    const dialog = getReorderDialog();
    assert.deepEqual(getDragLabels(dialog), [
      "Drag Bench press",
      "Drag Barbell row",
      "Drag Lateral raise",
    ]);
    assert.equal(dialog.textContent?.includes("Move here"), false);

    const save = Array.from(dialog.querySelectorAll<HTMLElement>("button")).find(
      (button) => button.textContent?.trim() === "Save order",
    );
    assert.ok(save);
    await mounted.click(save);
    assert.deepEqual(savedOrder, [1, 2, 3]);
  } finally {
    mounted.unmount();
  }
});

test("logger exercise reordering matches the split grab-handle flow", async () => {
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
    const dialog = getReorderDialog();
    assert.deepEqual(getDragLabels(dialog), [
      "Drag Bench press",
      "Drag Barbell row",
      "Drag Lateral raise",
    ]);
    assert.equal(dialog.textContent?.includes("Move here"), false);

    const save = Array.from(dialog.querySelectorAll<HTMLElement>("button")).find(
      (button) => button.textContent?.trim() === "Save order",
    );
    assert.ok(save);
    await mounted.click(save);
    assert.deepEqual(savedOrder, ["bench", "row", "raise"]);
  } finally {
    mounted.unmount();
  }
});
