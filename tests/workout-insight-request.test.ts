import assert from "node:assert/strict";
import test from "node:test";
import { createExerciseInsightRequestContext } from "../lib/workouts/insight-request";

test("createExerciseInsightRequestContext keys compare requests off exercise, date, and position", () => {
  const base = createExerciseInsightRequestContext("Bench Press", "2026-04-20", 2);
  const earlier = createExerciseInsightRequestContext("Bench Press", "2026-04-20", 1);
  const laterDate = createExerciseInsightRequestContext("Bench Press", "2026-04-22", 2);
  const otherExercise = createExerciseInsightRequestContext(
    "Incline Press",
    "2026-04-20",
    2,
  );

  assert.ok(base);
  assert.ok(earlier);
  assert.ok(laterDate);
  assert.ok(otherExercise);
  assert.notEqual(base?.lookupKey, earlier?.lookupKey);
  assert.notEqual(base?.lookupKey, laterDate?.lookupKey);
  assert.notEqual(base?.lookupKey, otherExercise?.lookupKey);
});

test("createExerciseInsightRequestContext never varies with the number of sets being logged", () => {
  const before = createExerciseInsightRequestContext("Bench Press", "2026-04-20", 2);
  const afterAddingSets = createExerciseInsightRequestContext(
    "Bench Press",
    "2026-04-20",
    2,
  );

  assert.deepEqual(afterAddingSets, before);
  assert.ok(!before?.requestPath.includes("setCount"));
});

test("createExerciseInsightRequestContext carries the workout being edited so it can be excluded", () => {
  const creating = createExerciseInsightRequestContext("Bench Press", "2026-04-20", 2);
  const editing = createExerciseInsightRequestContext(
    "Bench Press",
    "2026-04-20",
    2,
    "workout-7",
  );

  assert.ok(creating);
  assert.ok(editing);
  assert.equal(creating?.excludeWorkoutId, null);
  assert.equal(editing?.excludeWorkoutId, "workout-7");
  assert.notEqual(creating?.lookupKey, editing?.lookupKey);
  assert.ok(editing?.requestPath.includes("excludeWorkoutId=workout-7"));
  assert.ok(!creating?.requestPath.includes("excludeWorkoutId"));
});

test("createExerciseInsightRequestContext rejects incomplete context", () => {
  assert.equal(createExerciseInsightRequestContext("", "2026-04-20", 2), null);
  assert.equal(createExerciseInsightRequestContext("Bench Press", "", 2), null);
  assert.equal(
    createExerciseInsightRequestContext("Bench Press", "2026-04-20", 0),
    null,
  );
});
