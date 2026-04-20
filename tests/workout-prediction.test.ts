import assert from "node:assert/strict";
import test from "node:test";
import {
  computeBackoffProfile,
  computePositionAdjustment,
  computeRecoveryFactor,
  computeSetStrength,
  computeTrendAdjustment,
  findAnchorSet,
  predictExercisePerformance,
  scorePredictionConfidence,
  type PredictionSession,
} from "../lib/workouts/prediction";
import { createDatabaseDate } from "../lib/workout-utils";

function createWeightedSessions() {
  return [
    {
      workoutId: "workout-3",
      workoutTitle: "Push C",
      performedAt: createDatabaseDate(2026, 4, 15),
      exerciseOrder: 2,
      sets: [
        { setIndex: 1, reps: 8, weightLb: 190 },
        { setIndex: 2, reps: 8, weightLb: 185 },
        { setIndex: 3, reps: 7, weightLb: 180 },
      ],
    },
    {
      workoutId: "workout-2",
      workoutTitle: "Push B",
      performedAt: createDatabaseDate(2026, 4, 10),
      exerciseOrder: 2,
      sets: [
        { setIndex: 1, reps: 7, weightLb: 190 },
        { setIndex: 2, reps: 7, weightLb: 185 },
        { setIndex: 3, reps: 6, weightLb: 180 },
      ],
    },
    {
      workoutId: "workout-1",
      workoutTitle: "Push A",
      performedAt: createDatabaseDate(2026, 4, 5),
      exerciseOrder: 3,
      sets: [
        { setIndex: 1, reps: 8, weightLb: 185 },
        { setIndex: 2, reps: 8, weightLb: 180 },
        { setIndex: 3, reps: 7, weightLb: 175 },
      ],
    },
  ] satisfies PredictionSession[];
}

test("computeSetStrength caps high-rep influence", () => {
  assert.equal(Number(computeSetStrength(185, 8).toFixed(1)), 234.3);
  assert.equal(Number(computeSetStrength(185, 20).toFixed(1)), 259);
});

test("findAnchorSet prefers the strongest weighted set and falls back to bodyweight reps", () => {
  assert.deepEqual(
    findAnchorSet({
      sets: [
        { setIndex: 1, reps: 12, weightLb: 95 },
        { setIndex: 2, reps: 8, weightLb: 135 },
        { setIndex: 3, reps: 10, weightLb: 115 },
      ],
    }),
    {
      setIndex: 2,
      reps: 8,
      weightLb: 135,
      strength: computeSetStrength(135, 8),
      kind: "weighted",
    },
  );

  assert.deepEqual(
    findAnchorSet({
      sets: [
        { setIndex: 1, reps: 10, weightLb: null },
        { setIndex: 2, reps: 12, weightLb: null },
        { setIndex: 3, reps: 12, weightLb: null },
      ],
    }),
    {
      setIndex: 2,
      reps: 12,
      weightLb: null,
      strength: 12,
      kind: "bodyweight",
    },
  );
});

test("recovery, position, and trend adjustments follow the configured heuristics", () => {
  assert.equal(computeRecoveryFactor(1), 0.94);
  assert.equal(computeRecoveryFactor(4), 1);
  assert.equal(computeRecoveryFactor(40), 0.9);

  assert.equal(computePositionAdjustment(3, 2), 0.985);
  assert.equal(computePositionAdjustment(1, 4), 1.045);
  assert.equal(computePositionAdjustment(8, 1), 0.92);

  assert.equal(computeTrendAdjustment([260, 250, 200]), 1.03);
  assert.equal(computeTrendAdjustment([180, 190, 200]), 0.97);
  assert.equal(computeTrendAdjustment([220, 215]), 1);
});

test("computeBackoffProfile derives median ratios and rep deltas from recent sessions", () => {
  const profile = computeBackoffProfile(createWeightedSessions());

  assert.equal(Number((profile.get(1)?.weightRatio ?? 0).toFixed(3)), 0.974);
  assert.equal(profile.get(1)?.repDelta, 0);
  assert.equal(Number((profile.get(2)?.weightRatio ?? 0).toFixed(3)), 0.947);
  assert.equal(profile.get(2)?.repDelta, -1);
});

test("predictExercisePerformance returns stable weighted predictions and extends visible set count", () => {
  const basePrediction = predictExercisePerformance({
    sessions: createWeightedSessions(),
    performedAt: createDatabaseDate(2026, 4, 20),
    currentPosition: 2,
    setCount: 3,
    weightUnit: "LB",
  });
  const extendedPrediction = predictExercisePerformance({
    sessions: createWeightedSessions(),
    performedAt: createDatabaseDate(2026, 4, 20),
    currentPosition: 2,
    setCount: 4,
    weightUnit: "LB",
  });

  assert.ok(basePrediction);
  assert.ok(extendedPrediction);
  assert.equal(basePrediction?.predictedSets.length, 3);
  assert.equal(extendedPrediction?.predictedSets.length, 4);
  assert.equal(basePrediction?.predictedSets[0]?.weightLb, 190);
  assert.equal(basePrediction?.predictedSets[0]?.reps, 8);
  assert.equal(basePrediction?.predictedSets[1]?.weightLb, 185);
  assert.equal(basePrediction?.predictedSets[2]?.reps, 7);
  assert.equal(basePrediction?.confidence, "high");
  assert.deepEqual(
    extendedPrediction?.predictedSets.slice(0, 3),
    basePrediction?.predictedSets,
  );
  assert.equal(extendedPrediction?.predictedSets[3]?.weightLb, 175);
  assert.equal(extendedPrediction?.predictedSets[3]?.reps, 6);
});

test("predictExercisePerformance degrades gracefully for sparse and bodyweight-only history", () => {
  const sparsePrediction = predictExercisePerformance({
    sessions: [createWeightedSessions()[0]!],
    performedAt: createDatabaseDate(2026, 4, 22),
    currentPosition: 2,
    setCount: 3,
    weightUnit: "LB",
  });
  const bodyweightPrediction = predictExercisePerformance({
    sessions: [
      {
        workoutId: "pull-2",
        workoutTitle: "Pull B",
        performedAt: createDatabaseDate(2026, 4, 17),
        exerciseOrder: 3,
        sets: [
          { setIndex: 1, reps: 12, weightLb: null },
          { setIndex: 2, reps: 10, weightLb: null },
        ],
      },
      {
        workoutId: "pull-1",
        workoutTitle: "Pull A",
        performedAt: createDatabaseDate(2026, 4, 12),
        exerciseOrder: 3,
        sets: [
          { setIndex: 1, reps: 11, weightLb: null },
          { setIndex: 2, reps: 9, weightLb: null },
        ],
      },
    ],
    performedAt: createDatabaseDate(2026, 4, 20),
    currentPosition: 3,
    setCount: 2,
    weightUnit: "LB",
  });

  assert.ok(sparsePrediction);
  assert.equal(sparsePrediction?.confidence, "low");
  assert.equal(sparsePrediction?.predictedSets[0]?.weightLb, 190);
  assert.equal(sparsePrediction?.predictedSets[0]?.reps, 8);

  assert.ok(bodyweightPrediction);
  assert.equal(bodyweightPrediction?.confidence, "medium");
  assert.equal(bodyweightPrediction?.predictedSets[0]?.weightLb, null);
  assert.equal(bodyweightPrediction?.predictedSets[0]?.reps, 12);
});

test("scorePredictionConfidence maps weighted scores onto labels", () => {
  assert.equal(
    scorePredictionConfidence({
      sessionCount: 5,
      anchorValues: [240, 238, 236, 237, 239],
      setCounts: [3, 3, 3, 3, 3],
      daysSinceLastPerformed: 4,
      currentPosition: 2,
      historicalMedianPosition: 2,
    }).label,
    "high",
  );

  assert.equal(
    scorePredictionConfidence({
      sessionCount: 1,
      anchorValues: [240],
      setCounts: [3],
      daysSinceLastPerformed: 35,
      currentPosition: 4,
      historicalMedianPosition: 2,
    }).label,
    "low",
  );
});
