import "../rendering/alias";
import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveWorkoutReturn,
  workoutReturnQueryForDay,
} from "../../../app/workouts/workout-return";

test("a workout opened directly returns to History", () => {
  assert.deepEqual(resolveWorkoutReturn(undefined), {
    href: "/dashboard?view=workouts",
    query: "",
  });
  assert.deepEqual(resolveWorkoutReturn({}), {
    href: "/dashboard?view=workouts",
    query: "",
  });
});

test("a day from the history browser survives to Back and onward links", () => {
  assert.deepEqual(resolveWorkoutReturn({ from: "workouts", day: "2025-12-10" }), {
    href: "/dashboard?view=workouts&day=2025-12-10",
    query: "?from=workouts&day=2025-12-10",
  });
});

test("only a real calendar day is honored, and only for History", () => {
  assert.deepEqual(resolveWorkoutReturn({ from: "workouts", day: "yesterday" }), {
    href: "/dashboard?view=workouts",
    query: "?from=workouts",
  });
  assert.deepEqual(resolveWorkoutReturn({ from: "dashboard", day: "2025-12-10" }), {
    href: "/dashboard",
    query: "?from=dashboard",
  });
});

test("an untrusted source can never aim Back off the app", () => {
  const injected = resolveWorkoutReturn({
    from: "https://evil.example.com",
    day: "2025-12-10\" onload=x",
  });

  assert.ok(injected.href.startsWith("/dashboard"), injected.href);
  assert.equal(injected.query, "?from=dashboard");

  // Repeated params arrive as arrays; the first value is read, not joined.
  assert.deepEqual(resolveWorkoutReturn({ from: ["workouts", "split"], day: ["2025-12-10"] }), {
    href: "/dashboard?view=workouts&day=2025-12-10",
    query: "?from=workouts&day=2025-12-10",
  });
});

test("history links only carry a day they can prove", () => {
  assert.equal(workoutReturnQueryForDay("2025-12-10"), "?from=workouts&day=2025-12-10");
  assert.equal(workoutReturnQueryForDay("nonsense"), "?from=workouts");
});
