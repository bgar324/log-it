import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { WorkoutLoggerGuidance } from "@/app/workouts/new/_components/workout-logger-guidance";
import type { ExerciseInsight, ExerciseDraft } from "@/app/workouts/new/workout-logger.types";
import { render } from "./render";

const exercise: ExerciseDraft = {
  id: "press", name: "Incline press",
  sets: [{ id: "one", weightLb: "", reps: "", usesBodyweight: false, durationSeconds: "" }],
};
const insight: ExerciseInsight = {
  exerciseName: "Incline press", normalizedName: "incline press", sessionsCount: 4,
  lastPerformedAt: "2026-09-15", allTimeBestWeight: 110,
  lastSession: { workoutId: "workout", workoutTitle: "Upper", performedAt: "2026-09-15",
    setCount: 2, totalReps: 11, bestWeight: 90, bestWeightReps: 6, totalVolume: 990,
    sets: [{ weightLb: 90, reps: 5 }, { weightLb: 90, reps: 6 }].map(set => ({ ...set, durationSeconds: null })),
  },
  prediction: { confidence: "high", basedOnSessions: 4, daysSinceLastPerformed: 4, rationale: [],
    predictedSets: [{ setIndex: 1, weightLb: 95, reps: 6, repRange: { min: 5, max: 7 } },
      { setIndex: 2, weightLb: 95, reps: 5, repRange: { min: 4, max: 6 } }],
  },
};

test("guidance distinguishes recorded sets from suggestions and matches planned set count", async () => {
  const mounted = await render(<WorkoutLoggerGuidance exercise={exercise} insightState={{ status: "ready", data: insight }} weightUnit="LB" onRetry={() => {}} />);
  try {
    assert.match(mounted.text(), /Sep 15/);
    const rows = mounted.all("tbody tr");
    assert.equal(rows.length, 2, "past sets remain readable even when today plans fewer");
    assert.match(rows[0].textContent ?? "", /90 lb × 5/);
    assert.match(rows[0].textContent ?? "", /95 lb × 6/);
    assert.match(rows[1].textContent ?? "", /90 lb × 6/);
    assert.doesNotMatch(rows[1].textContent ?? "", /95 lb/);
    assert.equal(mounted.container.querySelector("input"), null);
  } finally { mounted.unmount(); }
});

test("low-confidence forecasts stay out of the suggested-values column", async () => {
  const prediction = insight.prediction!;
  const mounted = await render(<WorkoutLoggerGuidance exercise={exercise} insightState={{ status: "ready", data: { ...insight, prediction: { ...prediction, confidence: "low" } } }} weightUnit="LB" onRetry={() => {}} />);
  try {
    assert.match(mounted.text(), /90 lb × 5/);
    assert.doesNotMatch(mounted.text(), /95 lb/);
  } finally { mounted.unmount(); }
});

test("loading and errors do not show stale guidance as current", async () => {
  let retries = 0;
  const props = { exercise, weightUnit: "LB" as const, onRetry: () => { retries++; } };
  const mounted = await render(<WorkoutLoggerGuidance {...props} insightState={{ status: "loading", data: insight }} />);
  try {
    assert.doesNotMatch(mounted.text(), /95 lb|90 lb/);
    await mounted.rerender(<WorkoutLoggerGuidance {...props} insightState={{ status: "error", data: insight }} />);
    assert.doesNotMatch(mounted.text(), /95 lb|90 lb/);
    const retry = mounted.findByText("button", "Retry");
    assert.ok(retry);
    await mounted.click(retry);
    assert.equal(retries, 1);
  } finally { mounted.unmount(); }
});
