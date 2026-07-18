import assert from "node:assert/strict";
import test from "node:test";
import { recoverWorkoutDraft } from "../lib/workouts/draft-recovery";

test("a recovered workout draft retains its original date and split metadata", () => {
  const recovered = recoverWorkoutDraft(
    {
      title: "Pull day",
      workoutType: "Pull",
      performedAt: "2026-12-15",
    },
    { exercises: [{ name: "Pull Up" }], counters: { exercise: 1, set: 1 } },
  );

  assert.equal(recovered.performedAt, "2026-12-15");
  assert.equal(recovered.workoutType, "Pull");
  assert.equal(recovered.exercises[0]?.name, "Pull Up");
});
