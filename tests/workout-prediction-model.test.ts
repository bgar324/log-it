import assert from "node:assert/strict";
import test from "node:test";
import { predictExercisePerformance, type PredictionSession } from "../lib/workouts/prediction";
import { poundsToDisplayWeight } from "../lib/weight-unit";

function history(count: number, weight: (index: number) => number | null, reps: (index: number) => number = () => 8) {
  return Array.from({ length: count }, (_, i): PredictionSession => ({
    workoutId: `workout-${i}`,
    workoutTitle: "Training",
    performedAt: new Date(Date.UTC(2025, 0, 1 + i * 4)),
    exerciseOrder: 2,
    sets: [{ setIndex: 1, weightLb: weight(i), reps: reps(i) }],
  }));
}

function forecast(sessions: PredictionSession[], weightUnit: "LB" | "KG" = "LB") {
  return predictExercisePerformance({
    sessions,
    performedAt: new Date(Date.UTC(2026, 0, 1)),
    currentPosition: 2,
    setCount: 3,
    weightUnit,
  });
}

test("learned forecasts change direction when training labels change despite identical latest anchors", () => {
  const rising = forecast(history(30, i => 100 + i * 5));
  const falling = forecast(history(30, i => 390 - i * 5));
  assert.ok(rising && falling);
  assert.equal(rising.model.source, "ridge");
  assert.equal(falling.model.source, "ridge");
  assert.ok(rising.model.modelMae! < rising.model.baselineMae! * 0.95);
  assert.ok(falling.model.modelMae! < falling.model.baselineMae! * 0.95);
  assert.equal(rising.predictedSets[0].weightLb, 250);
  assert.equal(falling.predictedSets[0].weightLb, 240);
});

test("sparse histories and constant rank-deficient histories repeat the last anchor", () => {
  const sparse = forecast(history(8, i => 100 + i * 5));
  const constant = forecast(history(40, () => 150));
  assert.ok(sparse && constant);
  assert.equal(sparse.model.source, "repeat");
  assert.equal(sparse.model.validationExamples, 0);
  assert.equal(sparse.predictedSets[0].weightLb, 135);
  assert.equal(constant.model.source, "repeat");
  assert.equal(constant.model.modelMae, 0);
  assert.equal(constant.model.baselineMae, 0);
  assert.equal(constant.predictedSets[0].weightLb, 150);
});

test("target-day and future labels cannot affect a historical recommendation", () => {
  const prior = history(30, i => 100 + i * 5);
  const expected = forecast(prior);
  const contaminated = [
    ...prior,
    { ...prior[0], workoutId: "same-day", performedAt: new Date("2026-01-01T23:00:00Z"), sets: [{ setIndex: 1, weightLb: 9999, reps: 30 }] },
    { ...prior[0], workoutId: "future", performedAt: new Date("2026-02-01T00:00:00Z"), sets: [{ setIndex: 1, weightLb: 1, reps: 1 }] },
  ];
  assert.deepEqual(forecast(contaminated), expected);
  assert.deepEqual(forecast([...prior].reverse()), expected);
});

test("one date cannot multiply training examples and the history window is bounded", () => {
  const sessions = history(90, () => 150);
  const expected = forecast(sessions);
  assert.ok(expected);
  assert.equal(expected.basedOnSessions, 60);
  assert.equal(expected.model.trainingExamples, 58);
  assert.deepEqual(forecast(sessions.flatMap(session => [session, { ...session }])), expected);
});

test("bodyweight learns reps and a recent mode switch cannot recommend old external loads", () => {
  const bodyweight = forecast(history(30, () => null, i => 10 + i));
  assert.ok(bodyweight);
  assert.equal(bodyweight.model.source, "ridge");
  assert.equal(bodyweight.predictedSets[0].weightLb, null);
  assert.ok(bodyweight.predictedSets[0].reps! > 39);
  assert.ok(bodyweight.predictedSets[0].reps! <= 43);
  assert.notEqual(bodyweight.confidence, "high");
  const switched = history(30, i => i === 29 ? null : 100);
  const prediction = forecast(switched);
  assert.ok(prediction);
  assert.equal(prediction.basedOnSessions, 1);
  assert.equal(prediction.model.source, "repeat");
  assert.equal(prediction.predictedSets[0].weightLb, null);
});

test("recommendations remain loadable and bounded in either display unit", () => {
  const sessions = history(30, i => 100 + i * 5);
  for (const unit of ["LB", "KG"] as const) {
    const prediction = forecast(sessions, unit);
    assert.ok(prediction);
    const step = unit === "LB" ? 5 : 2.5;
    const last = Math.round(poundsToDisplayWeight(245, unit) / step) * step;
    const top = poundsToDisplayWeight(prediction.predictedSets[0].weightLb!, unit);
    assert.ok(top <= last + step + 0.01);
    assert.ok(top >= last - step * 3 - 0.01);
    for (const set of prediction.predictedSets) {
      assert.ok(set.weightLb !== null && set.weightLb > 0);
      const display = poundsToDisplayWeight(set.weightLb, unit);
      assert.ok(Math.abs(display / step - Math.round(display / step)) < 0.001);
      assert.ok(display <= top);
      assert.ok(set.reps !== null && Number.isInteger(set.reps) && set.reps > 0);
    }
  }
});

test("timed-only, malformed and target-only histories cannot create a learned recommendation", () => {
  const [session] = history(1, () => 100);
  assert.equal(forecast([{ ...session, sets: [{ setIndex: 1, reps: 0, weightLb: null }] }]), null);
  assert.equal(forecast([{ ...session, sets: [{ setIndex: 1, reps: 8, weightLb: Number.NaN }] }]), null);
  assert.equal(forecast([{ ...session, performedAt: new Date("2026-01-01") }]), null);
});
