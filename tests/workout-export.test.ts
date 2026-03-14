import assert from "node:assert/strict";
import test from "node:test";
import {
  formatWorkoutForClipboard,
  formatWorkoutSplitForClipboard,
} from "../lib/workout-export";
import { createDatabaseDate } from "../lib/workout-utils";

test("formatWorkoutForClipboard produces compact plain-text output", () => {
  const formatted = formatWorkoutForClipboard({
    performedAt: createDatabaseDate(2026, 3, 12),
    workoutType: "Pull",
    title: "Pull Day",
    weightUnit: "LB",
    exercises: [
      {
        name: "Lat Pulldown",
        sets: [
          { reps: 6, weightLb: 160 },
          { reps: 7, weightLb: 135 },
        ],
      },
      {
        name: "Pull-Up",
        sets: [{ reps: 10, weightLb: null }],
      },
    ],
  });

  assert.equal(
    formatted,
    "3/12: Pull\n\nLat Pulldown:\n160x6\n135x7\n\nPull-Up:\nBWx10",
  );
});

test("formatWorkoutSplitForClipboard produces weekday-by-weekday plain text", () => {
  const formatted = formatWorkoutSplitForClipboard({
    id: "split-1",
    name: "Powerbuilding",
    days: [
      {
        id: "wed",
        weekday: "WEDNESDAY",
        workoutType: "Push",
        workoutTypeSlug: "push",
        exercises: [],
      },
      {
        id: "mon",
        weekday: "MONDAY",
        workoutType: "Lower",
        workoutTypeSlug: "lower",
        exercises: [
          {
            id: "ex-1",
            order: 1,
            exerciseDisplayName: "Hack Squat",
            exerciseSlug: "hack-squat",
            sets: 2,
          },
        ],
      },
      {
        id: "tue",
        weekday: "TUESDAY",
        workoutType: "Rest",
        workoutTypeSlug: "rest",
        exercises: [],
      },
      {
        id: "thu",
        weekday: "THURSDAY",
        workoutType: "Pull",
        workoutTypeSlug: "pull",
        exercises: [],
      },
      {
        id: "fri",
        weekday: "FRIDAY",
        workoutType: "Rest",
        workoutTypeSlug: "rest",
        exercises: [],
      },
      {
        id: "sat",
        weekday: "SATURDAY",
        workoutType: "Rest",
        workoutTypeSlug: "rest",
        exercises: [],
      },
      {
        id: "sun",
        weekday: "SUNDAY",
        workoutType: "Rest",
        workoutTypeSlug: "rest",
        exercises: [],
      },
    ],
  });

  assert.equal(
    formatted,
    [
      "Monday: Lower",
      "Hack Squat - 2 sets",
      "",
      "Tuesday: Rest",
      "",
      "Wednesday: Push",
      "",
      "Thursday: Pull",
      "",
      "Friday: Rest",
      "",
      "Saturday: Rest",
      "",
      "Sunday: Rest",
    ].join("\n"),
  );
});
