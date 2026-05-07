import assert from "node:assert/strict";
import test from "node:test";
import { createWorkout } from "../../../lib/workouts/service";
import { formatDatabaseDateValue } from "../../../lib/workout-utils";
import {
  assertTransactionOptions,
  BASE_WORKOUT,
  createDefaultTransactionMock,
  decimalString,
  resetMockedTransaction,
  withMockedTransaction,
} from "./workout-service.fixtures";

test.afterEach(() => {
  resetMockedTransaction();
});

test("createWorkout writes a nested workout payload and returns read-model sync metadata", async () => {
  const { tx, calls } = createDefaultTransactionMock();

  withMockedTransaction(async (callback, options) => {
    assertTransactionOptions(options);
    return callback(tx);
  });

  const result = await createWorkout("user-1", BASE_WORKOUT);

  assert.deepEqual(result, {
    id: "workout-created",
    syncInput: {
      userId: "user-1",
      normalizedExerciseNames: ["lat pulldown", "pull up"],
      performedAtDates: ["2026-03-12"],
    },
  });

  const createdData = calls.workoutLogCreate[0]?.data as {
    title: string;
    workoutType?: string | null;
    totalWeightLb: unknown;
    performedAt: Date;
    exercises: {
      create: Array<{
        name: string;
        normalizedName: string;
        order: number;
        sets: { create: Array<{ order: number; reps: number; weightLb: string | null }> };
      }>;
    };
  };

  assert.equal(createdData.title, "Pull Day");
  assert.equal(createdData.workoutType, "Pull");
  assert.equal(decimalString(createdData.totalWeightLb), "1905");
  assert.equal(formatDatabaseDateValue(createdData.performedAt), "2026-03-12");
  assert.deepEqual(createdData.exercises.create, [
    {
      name: "Lat Pulldown",
      normalizedName: "lat pulldown",
      order: 1,
      sets: {
        create: [
          { order: 1, reps: 6, weightLb: "160" },
          { order: 2, reps: 7, weightLb: "135" },
        ],
      },
    },
    {
      name: "Pull Up",
      normalizedName: "pull up",
      order: 2,
      sets: {
        create: [{ order: 1, reps: 10, weightLb: null }],
      },
    },
  ]);
});
