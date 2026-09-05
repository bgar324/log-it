import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { SplitDayReorderDialog } from "@/app/dashboard/split-day-reorder-dialog";
import type {
  SplitWeekdayValue,
  WorkoutSplitDayTemplate,
} from "@/lib/workout-splits/shared";
import { render } from "./render";

const DAYS: WorkoutSplitDayTemplate[] = [
  {
    id: "monday",
    weekday: "MONDAY",
    workoutType: "Push",
    workoutTypeSlug: "push",
    exercises: [
      {
        id: "bench",
        order: 1,
        exerciseDisplayName: "Bench press",
        exerciseSlug: "bench-press",
        sets: 3,
      },
    ],
  },
  {
    id: "tuesday",
    weekday: "TUESDAY",
    workoutType: "Pull",
    workoutTypeSlug: "pull",
    exercises: [],
  },
  {
    id: "wednesday",
    weekday: "WEDNESDAY",
    workoutType: "Rest",
    workoutTypeSlug: "rest",
    exercises: [],
  },
];

test("week reordering moves a workout with two taps", async () => {
  const previousOverflow = document.body.style.overflow;
  let savedOrder: SplitWeekdayValue[] = [];
  const mounted = await render(
    createElement(SplitDayReorderDialog, {
      days: DAYS,
      onCancel: () => {},
      onSave: (orderedWeekdays) => {
        savedOrder = orderedWeekdays;
      },
    }),
  );

  try {
    const dialog = document.body.querySelector<HTMLElement>(
      'section[aria-label="Move workouts"]',
    );
    assert.ok(dialog);
    assert.equal(dialog.querySelectorAll('button[aria-label^="Drag "]').length, 0);

    const source = dialog.querySelector<HTMLElement>(
      'button[aria-label="Select Push from Monday to move"]',
    );
    assert.ok(source);
    await mounted.click(source);
    assert.match(dialog.textContent ?? "", /Push selected\. Choose a day\./);

    const destination = dialog.querySelector<HTMLElement>(
      'button[aria-label="Move Push to Tuesday"]',
    );
    assert.ok(destination);
    await mounted.click(destination);
    assert.match(dialog.textContent ?? "", /Choose a workout to move\./);

    const save = Array.from(dialog.querySelectorAll<HTMLElement>("button")).find(
      (button) => button.textContent?.trim() === "Save",
    );
    assert.ok(save);
    await mounted.click(save);

    assert.deepEqual(savedOrder, ["TUESDAY", "MONDAY", "WEDNESDAY"]);
  } finally {
    mounted.unmount();
  }

  assert.equal(document.body.style.overflow, previousOverflow);
});
