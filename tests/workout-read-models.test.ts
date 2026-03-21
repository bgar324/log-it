import assert from "node:assert/strict";
import test from "node:test";
import {
  buildExerciseSummaryRecords,
  buildWorkoutCalendarDayCounts,
  createWorkoutReadModelSyncInput,
} from "../lib/workout-read-models";
import { createDatabaseDate } from "../lib/workout-utils";

test("createWorkoutReadModelSyncInput deduplicates exercises and dates", () => {
  const syncInput = createWorkoutReadModelSyncInput(
    "user-1",
    ["bench press", "bench press", " row "],
    [
      createDatabaseDate(2026, 3, 20),
      "2026-03-20",
      "2026-03-21",
    ],
  );

  assert.deepEqual(syncInput, {
    userId: "user-1",
    normalizedExerciseNames: ["bench press", "row"],
    performedAtDates: ["2026-03-20", "2026-03-21"],
  });
});

test("buildExerciseSummaryRecords groups sessions and keeps the latest display name", () => {
  const summaries = buildExerciseSummaryRecords([
    {
      normalizedName: "bench press",
      name: "Bench Press",
      createdAt: new Date("2026-03-20T00:00:00.000Z"),
      workoutLog: {
        id: "workout-2",
        performedAt: createDatabaseDate(2026, 3, 20),
      },
      sets: [
        { reps: 5, weightLb: 225 },
        { reps: 8, weightLb: 185 },
      ],
    },
    {
      normalizedName: "bench press",
      name: "Barbell Bench Press",
      createdAt: new Date("2026-03-18T00:00:00.000Z"),
      workoutLog: {
        id: "workout-1",
        performedAt: createDatabaseDate(2026, 3, 18),
      },
      sets: [{ reps: 5, weightLb: 215 }],
    },
    {
      normalizedName: "",
      name: "Pull Up",
      createdAt: new Date("2026-03-18T00:00:00.000Z"),
      workoutLog: {
        id: "workout-1",
        performedAt: createDatabaseDate(2026, 3, 18),
      },
      sets: [{ reps: 10, weightLb: null }],
    },
  ]);

  assert.deepEqual(summaries, [
    {
      normalizedName: "bench press",
      name: "Bench Press",
      sessionCount: 2,
      setCount: 3,
      totalReps: 18,
      bestWeightLb: 225,
      lastPerformedAt: createDatabaseDate(2026, 3, 20),
    },
    {
      normalizedName: "pull up",
      name: "Pull Up",
      sessionCount: 1,
      setCount: 1,
      totalReps: 10,
      bestWeightLb: 0,
      lastPerformedAt: createDatabaseDate(2026, 3, 18),
    },
  ]);
});

test("buildWorkoutCalendarDayCounts rolls logs up by date", () => {
  const counts = buildWorkoutCalendarDayCounts([
    { performedAt: createDatabaseDate(2026, 3, 20) },
    { performedAt: createDatabaseDate(2026, 3, 20) },
    { performedAt: createDatabaseDate(2026, 3, 21) },
  ]);

  assert.deepEqual(counts, [
    { dateKey: "2026-03-20", workoutCount: 2 },
    { dateKey: "2026-03-21", workoutCount: 1 },
  ]);
});
