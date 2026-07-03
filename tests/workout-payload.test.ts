import assert from "node:assert/strict";
import test from "node:test";
import {
  computeWorkoutTotalWeightLb,
  normalizeWorkoutPayload,
} from "../lib/workouts/payload";
import { formatDatabaseDateValue } from "../lib/workout-utils";

type ParsedWorkoutResult = ReturnType<typeof normalizeWorkoutPayload>;
type ParsedWorkoutValue = Exclude<ParsedWorkoutResult, { error: string }>["value"];

function expectParsedWorkout(
  result: ParsedWorkoutResult,
): ParsedWorkoutValue {
  assert.ok("value" in result);

  if (!("value" in result)) {
    throw new Error("Expected a parsed workout value.");
  }

  return result.value as ParsedWorkoutValue;
}

test("normalizeWorkoutPayload keeps pound inputs unchanged", () => {
  const value = expectParsedWorkout(
    normalizeWorkoutPayload({
      title: "Push Day",
      workoutType: "Push",
      performedAt: "2026-03-08",
      weightUnit: "LB",
      exercises: [
        {
          name: "Bench Press",
          sets: [
            { reps: "5", weightLb: "135" },
            { reps: 3, weight: "145.5" },
          ],
        },
      ],
    }),
  );

  assert.equal(value.weightUnit, "LB");
  assert.equal(value.workoutType, "Push");
  assert.equal(value.workoutTypeSlug, "push");
  assert.ok(value.performedAt instanceof Date);
  assert.equal(formatDatabaseDateValue(value.performedAt), "2026-03-08");
  assert.equal(value.exercises[0]?.normalizedName, "bench press");
  assert.equal(value.exercises[0]?.sets[0]?.weightLb, "135");
  assert.equal(computeWorkoutTotalWeightLb(value).toString(), "1111.5");
});

test("normalizeWorkoutPayload converts kilogram inputs to stored pounds", () => {
  const value = expectParsedWorkout(
    normalizeWorkoutPayload({
      title: "Leg Day",
      workoutType: "Lower Body",
      performedAt: "2026-03-08",
      weightUnit: "KG",
      exercises: [
        {
          name: "Back Squat",
          sets: [{ reps: "5", weightLb: "100" }],
        },
      ],
    }),
  );

  assert.equal(value.weightUnit, "KG");
  assert.equal(value.workoutTypeSlug, "lower-body");
  assert.equal(value.exercises[0]?.sets[0]?.weightLb, "220.4623");
  assert.ok(
    Math.abs(Number(computeWorkoutTotalWeightLb(value).toString()) - 1102.3115) <
      0.0001,
  );
});

test("normalizeWorkoutPayload rejects exercises without valid sets", () => {
  const parsed = normalizeWorkoutPayload({
    title: "Push Day",
    performedAt: "2026-03-08",
    weightUnit: "LB",
    exercises: [
      {
        name: "Row",
        sets: [{ reps: "0", weightLb: "135" }],
      },
    ],
  });

  assert.deepEqual(parsed, {
    error: 'Exercise "Row" needs at least one valid set with reps or time.',
  });
});

test("normalizeWorkoutPayload accepts time-only sets", () => {
  const value = expectParsedWorkout(
    normalizeWorkoutPayload({
      title: "Core",
      workoutType: "Core",
      performedAt: "2026-03-08",
      weightUnit: "LB",
      exercises: [
        {
          name: "Plank",
          sets: [{ reps: "", durationSeconds: "60" }],
        },
      ],
    }),
  );

  assert.deepEqual(value.exercises[0]?.sets, [
    { reps: 0, weightLb: null, durationSeconds: 60 },
  ]);
  assert.equal(computeWorkoutTotalWeightLb(value).toString(), "0");
});

test("computeWorkoutTotalWeightLb credits bodyweight sets with the tracked body weight", () => {
  const value = expectParsedWorkout(
    normalizeWorkoutPayload({
      title: "Pull Day",
      performedAt: "2026-07-02",
      weightUnit: "LB",
      exercises: [
        {
          name: "Pull Up",
          sets: [
            { reps: "10" },
            { reps: "8", weightLb: "25" },
          ],
        },
      ],
    }),
  );

  // 10 reps at 180 lb bodyweight + 8 reps at 25 lb = 1800 + 200
  assert.equal(computeWorkoutTotalWeightLb(value, "180").toString(), "2000");

  // Without a tracked body weight, bodyweight sets contribute nothing.
  assert.equal(computeWorkoutTotalWeightLb(value).toString(), "200");
});

test("computeWorkoutTotalWeightLb ignores body weight for time-only sets", () => {
  const value = expectParsedWorkout(
    normalizeWorkoutPayload({
      title: "Core",
      performedAt: "2026-07-02",
      weightUnit: "LB",
      exercises: [{ name: "Plank", sets: [{ reps: "", durationSeconds: "60" }] }],
    }),
  );

  assert.equal(computeWorkoutTotalWeightLb(value, "180").toString(), "0");
});
