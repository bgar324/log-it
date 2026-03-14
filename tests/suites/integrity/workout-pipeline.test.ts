import assert from "node:assert/strict";
import test from "node:test";
import {
  computeWorkoutTotalWeightLb,
  normalizeWorkoutPayload,
} from "../../../lib/workouts/payload";
import { formatWorkoutForClipboard } from "../../../lib/workout-export";

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

test("workout logging pipeline keeps totals, normalized names, and clipboard export aligned", () => {
  const parsed = expectParsedWorkout(
    normalizeWorkoutPayload({
      title: " Evening Pull ",
      workoutType: " Pull ",
      performedAt: "2026-03-12T18:05",
      weightUnit: "KG",
      exercises: [
        {
          name: "Lat Pulldown",
          sets: [
            { reps: "6", weight: "72.5" },
            { reps: "7", weightLb: "61.2" },
          ],
        },
        {
          name: "Pull Up",
          sets: [{ reps: "10" }],
        },
      ],
    }),
  );

  assert.equal(parsed.title, "Evening Pull");
  assert.equal(parsed.workoutType, "Pull");
  assert.equal(parsed.workoutTypeSlug, "pull");
  assert.equal(parsed.exercises[0]?.normalizedName, "lat pulldown");
  assert.equal(parsed.exercises[1]?.sets[0]?.weightLb, null);

  const totalWeightLb = Number(computeWorkoutTotalWeightLb(parsed).toString());
  assert.ok(Math.abs(totalWeightLb - 1903.4713) < 0.01);

  const clipboardText = formatWorkoutForClipboard({
    performedAt: parsed.performedAt,
    workoutType: parsed.workoutType,
    title: parsed.title,
    weightUnit: parsed.weightUnit,
    exercises: parsed.exercises,
  });

  assert.equal(
    clipboardText,
    "3/12: Pull\n\nLat Pulldown:\n72.5x6\n61.2x7\n\nPull Up:\nBWx10",
  );
});

test("workout parsing strips corrupt rows but preserves a valid workout core", () => {
  const parsed = expectParsedWorkout(
    normalizeWorkoutPayload({
      title: "   ",
      performedAt: "2026-04-02T06:30",
      weightUnit: "stone",
      exercises: [
        {
          name: "Bench Press",
          sets: [
            { reps: "0", weightLb: "135" },
            { reps: "5", weightLb: "135" },
            { reps: "abc", weightLb: "225" },
          ],
        },
        {
          name: "   ",
          sets: [{ reps: "8", weightLb: "55" }],
        },
      ],
    }),
  );

  assert.equal(parsed.title, "Untitled workout");
  assert.equal(parsed.weightUnit, "LB");
  assert.equal(parsed.exercises.length, 1);
  assert.deepEqual(parsed.exercises[0]?.sets, [{ reps: 5, weightLb: "135" }]);
});
