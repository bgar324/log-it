import "../rendering/alias";
import assert from "node:assert/strict";
import test from "node:test";
import { loadTodaySession } from "../../../app/dashboard/data.today-session";
import { prisma } from "../../../lib/prisma";
import * as splitService from "../../../lib/workout-splits/service";
import { predictExercisePerformance, type PredictionSession } from "../../../lib/workouts/prediction";
import { convertStoredWeightToDisplay } from "../../../lib/weight-unit";

const now = new Date("2026-09-18T00:00:00Z");
const dates = ["2026-09-15", "2026-09-11", "2026-09-08", "2026-09-04"];

test("Home uses the existing predictor and carries confidence without inventing a progression", async (context) => {
  let count = 1;
  const originalSummary = prisma.exerciseSummary.findMany;
  const originalSets = prisma.workoutSet.findMany;
  const originalQuery = prisma.$queryRaw;
  context.after(() => {
    Reflect.set(prisma.exerciseSummary, "findMany", originalSummary);
    Reflect.set(prisma.workoutSet, "findMany", originalSets);
    Reflect.set(prisma, "$queryRaw", originalQuery);
  });
  context.mock.method(splitService, "getWorkoutSplitSeedForDate", async () => ({
    split: { id: "split", name: "Plan", isActive: true },
    day: { id: "day", weekday: "FRIDAY", workoutType: "Pull", workoutTypeSlug: "pull", exercises: [
      { id: "planned", order: 1, exerciseDisplayName: "V-bar Pushdown", exerciseSlug: "v-bar-pushdown", sets: 2 },
    ] },
  }));
  Reflect.set(prisma.exerciseSummary, "findMany", async () => []);
  Reflect.set(prisma, "$queryRaw", async () => dates.slice(0, count).map((date, i) => ({
    id: `exercise-${i}`, normalizedName: "v-bar pushdown", workoutId: `workout-${i}`,
    workoutTitle: "Pull", performedAt: new Date(`${date}T00:00:00Z`), exerciseOrder: 1,
  })));
  Reflect.set(prisma.workoutSet, "findMany", async () => dates.slice(0, count).flatMap((_, i) => [
    { workoutExerciseId: `exercise-${i}`, reps: 7, weightLb: 130 },
    { workoutExerciseId: `exercise-${i}`, reps: 8, weightLb: 130 },
  ]));
  const sessions = (): PredictionSession[] => dates.slice(0, count).map((date, i) => ({
    workoutId: `workout-${i}`, workoutTitle: "Pull", performedAt: new Date(`${date}T00:00:00Z`), exerciseOrder: 1,
    sets: [{ setIndex: 1, reps: 7, weightLb: 130 }, { setIndex: 2, reps: 8, weightLb: 130 }],
  }));
  const [sparse] = await loadTodaySession("user", "LB", now);
  assert.equal(sparse.lastWeight, 130);
  assert.equal(sparse.lastReps, 8, "equal-weight top sets choose the higher reps");
  assert.equal(sparse.suggestedTopSet?.confidence, "low");

  count = 4;
  const [established] = await loadTodaySession("user", "KG", now);
  const expected = predictExercisePerformance({ sessions: sessions(), performedAt: now, currentPosition: 1, setCount: 2, weightUnit: "KG" });
  assert.ok(expected && expected.confidence !== "low");
  const top = expected.predictedSets[0];
  assert.ok(top);
  assert.deepEqual(established.suggestedTopSet, {
    weight: top.weightLb === null ? null : convertStoredWeightToDisplay(top.weightLb, "KG"),
    reps: top.reps,
    confidence: expected.confidence,
  });

  count = 0;
  const [untrained] = await loadTodaySession("user", "LB", now);
  assert.equal(untrained.suggestedTopSet, undefined);
  assert.equal(untrained.lastReps, null);
});
