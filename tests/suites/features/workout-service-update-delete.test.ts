import assert from "node:assert/strict";
import test from "node:test";
import { deleteWorkout, updateWorkout, WORKOUT_NOT_FOUND_ERROR } from "../../../lib/workouts/service";
import type { ParsedWorkout } from "../../../lib/workouts/payload";
import { createDatabaseDate, formatDatabaseDateValue } from "../../../lib/workout-utils";
import {
  BASE_WORKOUT,
  createDefaultTransactionMock,
  decimalString,
  resetMockedTransaction,
  withMockedTransaction,
} from "./workout-service.fixtures";

test.afterEach(() => {
  resetMockedTransaction();
});

test("updateWorkout replaces exercises through a nested update and includes old and new sync keys", async () => {
  const { tx, calls } = createDefaultTransactionMock();
  const updatedPayload: ParsedWorkout = {
    title: "Upper Reload",
    workoutType: "Upper",
    workoutTypeSlug: "upper",
    performedAt: createDatabaseDate(2026, 3, 13),
    weightUnit: "LB",
    exercises: [
      {
        name: "Incline Press",
        normalizedName: "incline press",
        sets: [{ reps: 8, weightLb: "95", durationSeconds: null }],
      },
    ],
  };

  tx.workoutLog.findFirst = async (args) => {
    calls.workoutLogFindFirst.push(args as Record<string, unknown>);
    return {
      id: "workout-1",
      performedAt: createDatabaseDate(2026, 3, 12),
      exercises: [
        {
          name: "Bench Press",
          normalizedName: "bench press",
        },
      ],
    };
  };

  withMockedTransaction(async (callback) => callback(tx));

  const result = await updateWorkout("workout-1", "user-1", updatedPayload);

  assert.deepEqual(result, {
    id: "workout-1",
    syncInput: {
      userId: "user-1",
      normalizedExerciseNames: ["bench press", "incline press"],
      performedAtDates: ["2026-03-12", "2026-03-13"],
    },
  });

  const updatedWorkout = calls.workoutLogUpdate[0]?.data as {
    title: string;
    totalWeightLb: unknown;
    workoutType?: string | null;
    performedAt: Date;
    exercises: {
      deleteMany: Record<string, never>;
      create: Array<{
        name: string;
        normalizedName: string;
        order: number;
      }>;
    };
  };
  assert.equal(updatedWorkout.title, "Upper Reload");
  assert.equal(decimalString(updatedWorkout.totalWeightLb), "760");
  assert.equal(updatedWorkout.workoutType, "Upper");
  assert.equal(formatDatabaseDateValue(updatedWorkout.performedAt), "2026-03-13");
  assert.deepEqual(updatedWorkout.exercises.deleteMany, {});
  assert.deepEqual(updatedWorkout.exercises.create, [
    {
      name: "Incline Press",
      normalizedName: "incline press",
      order: 1,
      sets: {
        create: [{ order: 1, reps: 8, weightLb: "95", durationSeconds: null }],
      },
    },
  ]);
});

test("updateWorkout throws a not-found error when the target workout does not exist", async () => {
  const { tx } = createDefaultTransactionMock();

  withMockedTransaction(async (callback) => callback(tx));

  await assert.rejects(
    () => updateWorkout("missing-workout", "user-1", BASE_WORKOUT),
    (error: unknown) =>
      error instanceof Error && error.message === WORKOUT_NOT_FOUND_ERROR,
  );
});

test("deleteWorkout removes the workout and returns the affected summary keys", async () => {
  const { tx, calls } = createDefaultTransactionMock();

  tx.workoutLog.findFirst = async (args) => {
    calls.workoutLogFindFirst.push(args as Record<string, unknown>);
    return {
      id: "workout-1",
      performedAt: createDatabaseDate(2026, 3, 12),
      exercises: [
        {
          name: "Lat Pulldown",
          normalizedName: "lat pulldown",
        },
      ],
    };
  };

  withMockedTransaction(async (callback) => callback(tx));

  const result = await deleteWorkout("workout-1", "user-1");

  assert.deepEqual(result, {
    id: "workout-1",
    syncInput: {
      userId: "user-1",
      normalizedExerciseNames: ["lat pulldown"],
      performedAtDates: ["2026-03-12"],
    },
  });
  assert.equal(calls.workoutLogDelete.length, 1);
});
