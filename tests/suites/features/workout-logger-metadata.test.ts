// The logger modules import through the "@/*" alias, which tsc leaves in the
// emitted require() calls: this registers the same mapping for CommonJS.
import "../rendering/alias";
import assert from "node:assert/strict";
import test from "node:test";
import { buildWorkoutLoggerPayload } from "../../../app/workouts/new/workout-logger.submit";
import type { ExerciseDraft } from "../../../app/workouts/new/workout-logger.types";

const exercises: ExerciseDraft[] = [
  {
    id: "ex-1",
    name: "Barbell bench press",
    sets: [
      {
        id: "st-1",
        reps: "8",
        weightLb: "135",
        usesBodyweight: false,
        durationSeconds: "",
      },
    ],
  },
];

// The workspace logger keeps the date and the workout type in a sheet, and a
// closed sheet has no DOM — so `required` on those fields never fires. These
// cases pin the payload boundary as the check that cannot be skipped.
test("a workout with no date is rejected even when its exercises are complete", () => {
  const payload = buildWorkoutLoggerPayload({
    exercises,
    title: "Push day",
    workoutType: "Push",
    performedAt: "",
    weightUnit: "LB",
  });

  assert.ok("error" in payload);
});

test("a half-typed date is rejected", () => {
  const payload = buildWorkoutLoggerPayload({
    exercises,
    title: "Push day",
    workoutType: "Push",
    performedAt: "2026-09",
    weightUnit: "LB",
  });

  assert.ok("error" in payload);
});

test("an editable workout type must be chosen when types exist to choose from", () => {
  const payload = buildWorkoutLoggerPayload({
    exercises,
    title: "Push day",
    workoutType: "   ",
    performedAt: "2026-09-17",
    weightUnit: "LB",
    requireWorkoutType: true,
  });

  assert.ok("error" in payload);
});

test("an untyped workout still saves, because bodyweight and untyped histories are valid", () => {
  const payload = buildWorkoutLoggerPayload({
    exercises,
    title: "Morning session",
    workoutType: "",
    performedAt: "2026-09-17",
    weightUnit: "LB",
  });

  assert.ok("value" in payload);
  assert.equal(payload.value.workoutType, "");
  assert.equal(payload.value.performedAt, "2026-09-17");
});
