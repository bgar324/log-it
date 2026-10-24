import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { act } from "react";
import { useWorkoutLoggerInsights } from "@/app/workouts/new/_hooks/use-workout-logger-insights";
import { WorkoutLoggerGuidance } from "@/app/workouts/new/_components/workout-logger-guidance";
import { invalidateWorkoutDetails } from "@/app/dashboard/workout-detail-cache";
import type { ExerciseDraft, ExerciseInsight } from "@/app/workouts/new/workout-logger.types";
import { render } from "./render";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { DashboardClient } from "@/app/dashboard/dashboard-client";
import { createEmptyDashboardData } from "@/app/dashboard/data.empty";

const originalFetch = globalThis.fetch;
test.beforeEach(() => invalidateWorkoutDetails());
test.afterEach(() => { globalThis.fetch = originalFetch; });

function Probe({ name = "Bench", userId = "owner" }: { name?: string; userId?: string }) {
  const exercise: ExerciseDraft = { id: "exercise", name, sets: [{ id: "set", reps: "", weightLb: "", usesBodyweight: false, durationSeconds: "" }] };
  const state = useWorkoutLoggerInsights({ userId, weightUnit: "LB", exercises: [exercise], performedAt: "2026-10-23" });
  return <WorkoutLoggerGuidance exercise={exercise} insightState={state.exerciseInsightById.exercise} weightUnit="LB" onRetry={() => {}} />;
}

function response(name: string, weight: number) {
  return Response.json({
    exerciseName: name, normalizedName: name.toLowerCase(), sessionsCount: 1,
    lastPerformedAt: "2026-10-20", allTimeBestWeight: weight, prediction: null,
    lastSession: { workoutId: "past", workoutTitle: "Upper", performedAt: "2026-10-20", setCount: 1, totalReps: 8, bestWeight: weight, bestWeightReps: 8, totalVolume: weight * 8, sets: [{ reps: 8, weightLb: weight, durationSeconds: null }] },
  } satisfies ExerciseInsight);
}

test("a renamed exercise cannot be overwritten by the previous shared request", async () => {
  let resolveBench!: (response: Response) => void;
  let resolveRow!: (response: Response) => void;
  globalThis.fetch = input => new Promise<Response>(resolve => {
    if (new URL(String(input), "http://localhost").searchParams.get("exercise") === "Bench") resolveBench = resolve;
    else resolveRow = resolve;
  });
  const mounted = await render(<Probe />);
  try {
    await mounted.rerender(<Probe name="Row" />);
    await act(async () => { resolveRow(response("Row", 200)); });
    assert.match(mounted.text(), /200 lb × 8/);
    await act(async () => { resolveBench(response("Bench", 90)); });
    assert.match(mounted.text(), /200 lb × 8/);
    assert.doesNotMatch(mounted.text(), /90 lb/);
  } finally { mounted.unmount(); }
});

test("an account change hides the prior account's guidance before its new read completes", async () => {
  let resolveOther!: (response: Response) => void;
  let calls = 0;
  globalThis.fetch = () => ++calls === 1 ? Promise.resolve(response("Bench", 90))
    : new Promise<Response>(resolve => { resolveOther = resolve; });
  const mounted = await render(<Probe />);
  try {
    assert.match(mounted.text(), /90 lb × 8/);
    await mounted.rerender(<Probe userId="other-owner" />);
    assert.doesNotMatch(mounted.text(), /90 lb/);
    await act(async () => { resolveOther(response("Bench", 200)); });
    assert.match(mounted.text(), /200 lb × 8/);
  } finally { mounted.unmount(); }
});

test("starting a workout joins guidance warming before History and Splits finish", async () => {
  const user = { id: "owner", username: "owner", email: "owner@example.com",
    firstName: "Ben", lastName: "Garcia", preferredWeightUnit: "LB",
    publicProfileEnabled: false, profileImageUpdatedAt: null, createdAt: new Date("2026-01-01") } satisfies Parameters<typeof createEmptyDashboardData>[0];
  const data = createEmptyDashboardData(user, new Date("2026-10-23"));
  data.overview.todaySession = [{ id: "planned", name: "Bench", plannedSets: 1, lastPerformedLabel: null, lastWeight: null, lastReps: null }];
  const insightRead = Promise.withResolvers<Response>();
  let insightCalls = 0;
  const finishViews: Array<(response: Response) => void> = [];
  globalThis.fetch = input => {
    if (String(input).includes("/api/workouts/insights?")) {
      insightCalls++;
      return insightRead.promise;
    }
    const view = Promise.withResolvers<Response>();
    finishViews.push(view.resolve);
    return view.promise;
  };
  const mounted = await render(<SearchParamsContext.Provider value={new URLSearchParams()}>
    <DashboardClient initialView="dashboard" userId={user.id} data={data} benEnabled />
  </SearchParamsContext.Provider>);
  try {
    await act(async () => {
      const idle = Promise.withResolvers<void>();
      window.setTimeout(idle.resolve, 0);
      await idle.promise;
    });
    assert.equal(finishViews.length, 2);
    assert.equal(insightCalls, 1);
    await mounted.rerender(<Probe />);
    assert.equal(insightCalls, 1);
    assert.ok(mounted.container.querySelector('[aria-busy="true"]'));
    await act(async () => { insightRead.resolve(response("Bench", 90)); });
    assert.match(mounted.text(), /90 lb × 8/);
    assert.equal(insightCalls, 1);
  } finally {
    mounted.unmount();
    for (const finish of finishViews) finish(Response.json({ data: {} }));
  }
});
