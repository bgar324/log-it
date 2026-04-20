import assert from "node:assert/strict";
import test from "node:test";
import { createExerciseInsightRequestContext } from "../lib/workouts/insight-request";

test("createExerciseInsightRequestContext keys prediction requests off exercise, date, position, and visible set count", () => {
  const base = createExerciseInsightRequestContext(
    "Bench Press",
    "2026-04-20",
    2,
    3,
  );
  const earlier = createExerciseInsightRequestContext(
    "Bench Press",
    "2026-04-20",
    1,
    3,
  );
  const laterDate = createExerciseInsightRequestContext(
    "Bench Press",
    "2026-04-22",
    2,
    3,
  );
  const extraSet = createExerciseInsightRequestContext(
    "Bench Press",
    "2026-04-20",
    2,
    4,
  );

  assert.ok(base);
  assert.ok(earlier);
  assert.ok(laterDate);
  assert.ok(extraSet);
  assert.notEqual(base?.lookupKey, earlier?.lookupKey);
  assert.notEqual(base?.lookupKey, laterDate?.lookupKey);
  assert.notEqual(base?.lookupKey, extraSet?.lookupKey);
});

test("createExerciseInsightRequestContext ignores manual set values and only depends on visible set count", () => {
  const fromEmptyInputs = createExerciseInsightRequestContext(
    "Bench Press",
    "2026-04-20",
    2,
    3,
  );
  const afterEditingWeightsAndReps = createExerciseInsightRequestContext(
    "Bench Press",
    "2026-04-20",
    2,
    3,
  );

  assert.deepEqual(afterEditingWeightsAndReps, fromEmptyInputs);
});
