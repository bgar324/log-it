import assert from "node:assert/strict";
import test from "node:test";
import { getWorkoutTypeColor } from "../lib/workout-splits/colors";
import { normalizeWorkoutSplitPayload } from "../lib/workout-splits/payload";
import {
  getWeekdayForDate,
  parseDateKey,
  reorderSplitDays,
} from "../lib/workout-splits/shared";
import { formatDatabaseDateValue } from "../lib/workout-utils";
import { normalizeExerciseSlug } from "../lib/workout-utils";

test("normalizeExerciseSlug creates a canonical kebab-case slug", () => {
  assert.equal(normalizeExerciseSlug(" BenchPress "), "bench-press");
  assert.equal(normalizeExerciseSlug("Cable   Fly"), "cable-fly");
});

test("normalizeWorkoutSplitPayload fills missing days with rest days", () => {
  const parsed = normalizeWorkoutSplitPayload({
    name: "Upper / Lower",
    days: [
      {
        weekday: "MONDAY",
        workoutType: "Push",
        exercises: [
          { exerciseDisplayName: "Bench Press", sets: 4 },
          { exerciseDisplayName: "Incline DB Press", sets: 3 },
        ],
      },
      {
        weekday: "TUESDAY",
        workoutType: "Pull",
        exercises: [{ exerciseDisplayName: "Barbell Row", sets: 4 }],
      },
    ],
  });

  assert.ok("value" in parsed);

  if (!("value" in parsed)) {
    throw new Error("Expected workout split to parse.");
  }

  assert.equal(parsed.value.days.length, 7);
  assert.equal(parsed.value.days[0]?.workoutTypeSlug, "push");
  assert.equal(parsed.value.days[2]?.workoutType, "Rest");
  assert.equal(parsed.value.days[0]?.exercises[0]?.exerciseSlug, "bench-press");
});

test("getWorkoutTypeColor is deterministic and honors the default push hue", () => {
  const push = getWorkoutTypeColor("Push");
  const pushAgain = getWorkoutTypeColor("push");
  const custom = getWorkoutTypeColor("Shoulders");

  assert.deepEqual(push, pushAgain);
  assert.match(push.border, /hsl\(4,/);
  assert.match(custom.background, /hsl\(/);
});

test("date helpers map dates to split weekdays and date-only values", () => {
  const date = parseDateKey("2026-03-09");

  assert.ok(date);

  if (!date) {
    throw new Error("Expected date to parse.");
  }

  assert.equal(getWeekdayForDate(date), "MONDAY");
  assert.equal(formatDatabaseDateValue(date), "2026-03-09");
});

test("reorderSplitDays moves a template into a new weekday slot", () => {
  const parsed = normalizeWorkoutSplitPayload({
    days: [
      { weekday: "MONDAY", workoutType: "Push", exercises: [] },
      { weekday: "TUESDAY", workoutType: "Pull", exercises: [] },
      { weekday: "WEDNESDAY", workoutType: "Legs", exercises: [] },
      { weekday: "THURSDAY", workoutType: "Rest", exercises: [] },
      { weekday: "FRIDAY", workoutType: "Upper", exercises: [] },
      { weekday: "SATURDAY", workoutType: "Lower", exercises: [] },
      { weekday: "SUNDAY", workoutType: "Rest", exercises: [] },
    ],
  });

  assert.ok("value" in parsed);

  if (!("value" in parsed)) {
    throw new Error("Expected split to parse.");
  }

  const reordered = reorderSplitDays(parsed.value.days, 4, 1);

  assert.equal(reordered[1]?.workoutType, "Upper");
  assert.equal(reordered[1]?.weekday, "TUESDAY");
  assert.equal(reordered[2]?.workoutType, "Pull");
});
