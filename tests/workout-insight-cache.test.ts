import "./suites/rendering/alias";
import assert from "node:assert/strict";
import test from "node:test";
import { createExerciseInsightRequestContext } from "../lib/workouts/insight-request";
import { invalidateWorkoutDetails } from "../app/dashboard/workout-detail-cache";
import { loadWorkoutInsight, readWorkoutInsight } from "../app/workouts/new/workout-insight-cache";
import type { ExerciseInsight } from "../app/workouts/new/workout-logger.types";

const originalFetch = globalThis.fetch;
const originalNow = Date.now;
const context = createExerciseInsightRequestContext("Bench press", "2026-10-23", 1)!;
const insight: ExerciseInsight = {
  exerciseName: "Bench press", normalizedName: "bench press", sessionsCount: 0,
  lastPerformedAt: null, lastSession: null, allTimeBestWeight: null, prediction: null,
};

test.beforeEach(() => invalidateWorkoutDetails());
test.afterEach(() => { globalThis.fetch = originalFetch; Date.now = originalNow; });

test("prediction reads share pending work but never cross account, unit, date, order, or edit boundaries", async () => {
  let calls = 0;
  const units: string[] = [];
  globalThis.fetch = async input => {
    calls++;
    units.push(new URL(String(input), "http://localhost").searchParams.get("unit") ?? "");
    return Response.json({ ...insight, allTimeBestWeight: calls });
  };
  const first = loadWorkoutInsight("owner", "LB", context);
  const joined = loadWorkoutInsight("owner", "LB", context);
  assert.equal(first, joined);
  assert.equal((await first)?.allTimeBestWeight, 1);
  assert.equal(readWorkoutInsight("owner", "LB", context)?.allTimeBestWeight, 1);
  assert.equal((await loadWorkoutInsight("other-owner", "LB", context))?.allTimeBestWeight, 2);
  assert.equal((await loadWorkoutInsight("owner", "KG", context))?.allTimeBestWeight, 3);
  assert.deepEqual(units, ["LB", "LB", "KG"]);
  for (const changed of [
    createExerciseInsightRequestContext("Bench press", "2026-10-22", 1)!,
    createExerciseInsightRequestContext("Bench press", "2026-10-23", 2)!,
    createExerciseInsightRequestContext("Bench press", "2026-10-23", 1, "edited-workout")!,
  ]) {
    assert.equal(readWorkoutInsight("owner", "LB", changed), undefined);
    await loadWorkoutInsight("owner", "LB", changed);
  }
  assert.equal(calls, 6);
  assert.equal(readWorkoutInsight("owner", "LB", context)?.allTimeBestWeight, 1);
});

test("a save disowns pending predictions and an old completion cannot replace the new history", async () => {
  let resolveOld!: (response: Response) => void;
  let calls = 0;
  globalThis.fetch = () => ++calls === 1
    ? new Promise<Response>(resolve => { resolveOld = resolve; })
    : Promise.resolve(Response.json({ ...insight, allTimeBestWeight: 225 }));
  const old = loadWorkoutInsight("owner", "LB", context);
  invalidateWorkoutDetails("changed-history-workout");
  const current = loadWorkoutInsight("owner", "LB", context);
  assert.equal((await current)?.allTimeBestWeight, 225);
  resolveOld(Response.json({ ...insight, allTimeBestWeight: 200 }));
  assert.equal(await old, null);
  assert.equal(readWorkoutInsight("owner", "LB", context)?.allTimeBestWeight, 225);
});

test("failed predictions remain retryable and successful no-history answers expire", async () => {
  let calls = 0;
  let now = 1000;
  Date.now = () => now;
  globalThis.fetch = async () => ++calls === 1
    ? Response.json({ error: "Unavailable" }, { status: 503 })
    : Response.json(insight);
  await assert.rejects(loadWorkoutInsight("owner", "LB", context), /Unavailable/);
  assert.equal(readWorkoutInsight("owner", "LB", context), undefined);
  assert.equal((await loadWorkoutInsight("owner", "LB", context))?.lastSession, null);
  assert.equal(calls, 2);
  now += 5 * 60 * 1000;
  assert.equal(readWorkoutInsight("owner", "LB", context), undefined);
  await loadWorkoutInsight("owner", "LB", context);
  assert.equal(calls, 3);
});
