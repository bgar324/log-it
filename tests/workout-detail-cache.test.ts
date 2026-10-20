import assert from "node:assert/strict";
import test from "node:test";
import {
  invalidateWorkoutDetails,
  readWorkoutDetail,
  seedWorkoutDetails,
  workoutDetailGeneration,
} from "../app/dashboard/workout-detail-cache";
import type { WorkspaceWorkoutDetailProjection } from "../app/workspace/details/workspace-workout-detail.data";

const detail: WorkspaceWorkoutDetailProjection = {
  id: "workout-1",
  title: "Upper",
  workoutType: "Upper",
  summarySentence: "1 exercise · 1 set",
  summaryMeta: "Oct 19, 2026",
  editHref: "/workouts/workout-1/edit",
  exportText: "Bench: 100 lb × 8",
  exercises: [{ id: "exercise-1", name: "Bench", metaLine: "1 set", sets: [{ id: "set-1", orderLabel: "Set 1", detail: "100 lb × 8 reps", durationLabel: null }] }],
};

test.afterEach(() => invalidateWorkoutDetails());

test("history hydration cannot resurrect details invalidated by a save", () => {
  const beforeSave = workoutDetailGeneration();
  invalidateWorkoutDetails(detail.id);
  seedWorkoutDetails("account-1", "LB", [detail], beforeSave);
  assert.equal(readWorkoutDetail("account-1", "LB", detail.id), undefined);

  const edited = { ...detail, title: "Edited upper" };
  seedWorkoutDetails("account-1", "LB", [edited], workoutDetailGeneration());
  seedWorkoutDetails("account-1", "LB", [detail], beforeSave);
  const state = readWorkoutDetail("account-1", "LB", detail.id);
  assert.equal(state?.status === "ready" ? state.detail.title : null, "Edited upper");
});

test("hydrated workout details remain scoped to account and display unit", () => {
  seedWorkoutDetails("account-1", "LB", [detail]);
  assert.equal(readWorkoutDetail("account-2", "LB", detail.id), undefined);
  assert.equal(readWorkoutDetail("account-1", "KG", detail.id), undefined);
  assert.equal(readWorkoutDetail("account-1", "LB", detail.id)?.status, "ready");
});
